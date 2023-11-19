/** =========================================================================================
 * Filename: done-backend-stack.ts
 *
 * Description: This file contains the CDK stack for the Done backend. The constructs
 * in this stack correspond directly to the backend resources that will be deployed
 * in the AWS account.
 *
 * Contains:
 * - DynamoDB table construct
 * - Cognito user pool construct
 * - API Gateway Rest API construct
 * - DynamoDBApiHandler construct (custom construct to create API Gateway resources,
 *  methods, and lambda functions)
 * - Outputs for the backend stack's DynamoDB table name, Cognito user pool ID,
 *  Cognito user pool client ID, Cognito user pool domain, and API Gateway URL
 *  to be used in other parts of the CDK app and React App.
========================================================================================= */

import * as cdk from "aws-cdk-lib";
import { Period, RequestAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  OAuthScope,
  ProviderAttribute,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolDomain,
  UserPoolIdentityProviderGoogle,
} from "aws-cdk-lib/aws-cognito";
import { AttributeType, Billing, TableEncryptionV2, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { DoneSchemaModel } from "./constructs/DoneSchemaModel";
import { DynamoDBApiHandler } from "./constructs/DynamoDBApiHandler";

interface DoneBackendStackProps extends cdk.StackProps {
  deploymentEnv: string;
  frontendUrl: string;
}

/** =========================================================================================
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stack.html
 * 
 * CDK Stack construct for the backend resources. This stack corresponds to a CloudFormation stack that
 * is deployed by the pipeline through the DoneCdkAppStage construct (used for both preprod and prod).
 ========================================================================================= */
export class DoneBackendStack extends cdk.Stack {
  tableNameOutput: cdk.CfnOutput;
  userPoolIdOutput: cdk.CfnOutput;
  userPoolClientIdOutput: cdk.CfnOutput;
  userPoolDomainOutput: cdk.CfnOutput;
  apiUrlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, { deploymentEnv, frontendUrl, ...props }: DoneBackendStackProps) {
    super(scope, id, props);

    /** ###############################################################################################
     *                                  === DynamoDB Table ===
     * ############################################################################################## **/

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb.TableV2.html
     * 
     * The TableV2 construct represents a DynamoDB table in AWS CDK. TableV2 is the recommended construct
     * for creating DynamoDB tables in AWS CDK. Since we are using single table design, this table will
     * house all of the application's data.
     * 
     * If the stack is deleted, the table will be preserved as a snapshot.
     ========================================================================================= */
    const table = new TableV2(this, "Table", {
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      pointInTimeRecovery: true,
      billing: Billing.onDemand(),
      encryption: TableEncryptionV2.awsManagedKey(),
    });
    this.tableNameOutput = new cdk.CfnOutput(this, "TableNameOutput", {
      value: table.tableName,
      exportName: `TableName-${deploymentEnv}`,
    });

    /** ###############################################################################################
     *                           === Cognito Identity Provider (User Pool) ===
     * ############################################################################################## **/

    // Verify the ARN of the IDP secrets is set as an environment variable
    if (!process.env.IDP_SECRETS_ARN) {
      throw new Error("IDP_SECRETS_ARN environment variable is not defined");
    }

    // Verify the domain prefixes are set as environment variables
    if (!process.env.PROD_DOMAIN_PREFIX || !process.env.PREPROD_DOMAIN_PREFIX) {
      throw new Error("PROD_DOMAIN_PREFIX and PREPROD_DOMAIN_PREFIX environment variables are not defined");
    }

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.SecretValue.html
     * 
     * The SecretValue construct allows working with secret values in CDK. Here it is used to retrieve
     * google identity provider information from AWS Secrets Manager to be passed to Cognito.
     ========================================================================================= */
    const googleClientId = cdk.SecretValue.secretsManager(process.env.IDP_SECRETS_ARN, {
      jsonField: "GOOGLE_CLIENT_ID",
    });
    const googleClientSecret = cdk.SecretValue.secretsManager(process.env.IDP_SECRETS_ARN, {
      jsonField: "GOOGLE_CLIENT_SECRET",
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPool.html
     * 
     * The UserPool construct sets up the Cognito Identity Provider for the application. Self sign up
     * is enabled so that users can sign up for the application without an admin.
     ========================================================================================= */
    const userPool = new UserPool(this, "MyUserPool", {
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Expose the user pool ID as an output of this stack
    this.userPoolIdOutput = new cdk.CfnOutput(this, "UserPoolIdOutput", {
      value: userPool.userPoolId,
      exportName: `UserPoolId-${deploymentEnv}`,
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolDomain.html
     * 
     * The Cognito domain for the app. Application users will be redirected to this domain for authentication.
     ========================================================================================= */
    const userPoolDomain = new UserPoolDomain(this, "UserPoolDomain", {
      userPool,
      cognitoDomain: {
        domainPrefix: deploymentEnv === "prod" ? process.env.PROD_DOMAIN_PREFIX : process.env.PREPROD_DOMAIN_PREFIX,
      },
    });

    // Expose the user pool domain as an output of this stack
    this.userPoolDomainOutput = new cdk.CfnOutput(this, "UserPoolDomainOutput", {
      value: userPoolDomain.domainName,
      exportName: `UserPoolDomain-${deploymentEnv}`,
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolIdentityProviderGoogle.html
     * 
     * The Google identity provider is used to allow users to sign in with their Google account. The provider
     * is integrated with cognito by providing the Google App Client ID and Client Secret retrieved from AWS
     * Secrets Manager.
     ========================================================================================= */
    const googleProvider = new UserPoolIdentityProviderGoogle(this, "GoogleProvider", {
      userPool,
      // Client ID does not need to be protected
      clientId: googleClientId.unsafeUnwrap(),
      // The Google provider supports SecretValue objects, meaning the client secret can be safely added.
      clientSecretValue: googleClientSecret,
      attributeMapping: {
        email: ProviderAttribute.GOOGLE_EMAIL,
        givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
        fullname: ProviderAttribute.GOOGLE_NAME,
      },
      scopes: ["profile", "email", "openid"],
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolClient.html
     * 
     * The user pool app client configures the user pool to allow the React app to authenticate with it
     * using the Cognito app client ID and secret. The client also defines Google as a supported identity
     * provider.
     ========================================================================================= */
    const userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: [`https://${frontendUrl}`, ...(deploymentEnv !== "prod" ? ["http://localhost:8000"] : [])],
        logoutUrls: [`https://${frontendUrl}`, ...(deploymentEnv !== "prod" ? ["http://localhost:8000"] : [])],
      },
    });

    // Ensure the Google provider is created before the user pool client to prevent deployment failure.
    userPoolClient.node.addDependency(googleProvider);

    // Expose the user pool client ID as an output of this stack
    this.userPoolClientIdOutput = new cdk.CfnOutput(this, "UserPoolClientIdOutput", {
      value: userPoolClient.userPoolClientId,
      exportName: `UserPoolClientId-${deploymentEnv}`,
    });

    /** ###############################################################################################
     *                                  === API Gateway Rest API ===
     * ############################################################################################## **/

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html
     * 
     * The RestApi hosts the API Gateway endpoints to allow communication between the frontend and backend.
     ========================================================================================= */
    const api = new RestApi(this, "DoneApi", {
      restApiName: "Done API Service",
    });

    // Set a usage plan for the API Gateway. This usage plan will limit the number of requests per client.
    api.addUsagePlan("DoneApiUsagePlan", {
      name: "DoneApiUsagePlan",
      throttle: {
        rateLimit: 10,
        burstLimit: 5,
      },
      quota: {
        limit: 1000,
        period: Period.DAY,
      },
    });

    // Expose the API Gateway URL as an output of this stack
    this.apiUrlOutput = new cdk.CfnOutput(this, "DoneApiUrlOutput", {
      value: api.url,
      exportName: `DoneApiUrl-${deploymentEnv}`,
    });

    // Set the default CORS preflight options for the API Gateway endpoints.
    const defaultCorsPreflightOptions = {
      allowOrigins:
        deploymentEnv === "prod" ? [`https://${frontendUrl}`] : ["http://localhost:8000", `https://${frontendUrl}`],
      allowMethods: ["POST", "GET", "PATCH", "DELETE"],
      allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    };

    // Create the authorizer lambda function. This function will be used to
    // authenticate and authorize requests to the API Gateway endpoints.
    const lambdaAuth = new Function(this, "DoneApiAuthorizerHandler", {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("./lambdas/auth/lambdaAuthorizer"),
      handler: "lambdaAuthorizer.handler",
      environment: {
        IDP_SECRETS_ARN: process.env.IDP_SECRETS_ARN,
        JWKS_ENDPOINT: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}/.well-known/jwks.json`,
        ACCOUNT_ID: this.account,
        API_ID: api.restApiId,
      },
    });

    // This API Gateway authorizer will be used to authenticate requests to the endpoints.
    const authorizer = new RequestAuthorizer(this, "DoneApiAuthorizer", {
      handler: lambdaAuth,
      identitySources: ["method.request.header.Authorization"],
      authorizerName: "DoneApiAuthorizer",
    });

    // These models are used to validate the request body of the API requests for each resource type.
    const models = {
      userCategory: new DoneSchemaModel(this, "UserCategoryModel", {
        resourceType: "userCategory",
        api,
      }),
      userTask: new DoneSchemaModel(this, "UserTaskModel", {
        resourceType: "userTask",
        api,
      }),
      taskNotification: new DoneSchemaModel(this, "TaskNotificationModel", {
        resourceType: "taskNotification",
        api,
      }),
    };

    /** =========================================================================================
     * API Gateway resources, methods, and lambda functions.
     * 
     * These resources are created using the DynamoDBApiHandler construct which is a custom construct
     * that creates a Lambda function that interacts with a DynamoDB table and adds it as an integration
     * to API Gateway resource.
     ========================================================================================= */

    /* ==================================== User category APIs ===================================== */
    const userAccountPathPart = "userAccount";
    const userAccountResource = api.root.addResource(userAccountPathPart, {
      defaultCorsPreflightOptions,
    });
    const initializeUserHandler = new DynamoDBApiHandler(this, "initializeUserHandler", {
      table,
      resource: userAccountResource,
      pathPart: userAccountPathPart,
      method: "initializeUser",
      httpMethod: "POST",
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    const deleteAccountHandler = new DynamoDBApiHandler(this, "DeleteAccountHandler", {
      table,
      resource: userAccountResource,
      pathPart: userAccountPathPart,
      method: "deleteAccount",
      httpMethod: "DELETE",
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    /* ====================================== User Task APIs ======================================= */
    const userTaskPathPart = "userTask";
    const userTaskResource = api.root.addResource(userTaskPathPart, {
      defaultCorsPreflightOptions,
    });
    const userTaskQueryParameters = {
      "method.request.querystring.taskId": true,
    };

    const createUserTaskHandler = new DynamoDBApiHandler(this, "CreateUserTaskHandler", {
      table,
      resource: userTaskResource,
      method: "createUserTask",
      pathPart: userTaskPathPart,
      httpMethod: "POST",
      schemaModel: models.userTask,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    const deleteUserTaskHandler = new DynamoDBApiHandler(this, "DeleteUserTaskHandler", {
      table,
      resource: userTaskResource,
      method: "deleteUserTask",
      pathPart: userTaskPathPart,
      httpMethod: "DELETE",
      queryStringParameters: userTaskQueryParameters,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    const updateUserTaskHandler = new DynamoDBApiHandler(this, "UpdateUserTaskHandler", {
      table,
      resource: userTaskResource,
      method: "updateUserTask",
      pathPart: userTaskPathPart,
      httpMethod: "PATCH",
      queryStringParameters: userTaskQueryParameters,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    /* ==================================== User Category APIs ===================================== */
    const userCategoryPathPart = "userCategory";
    const userCategoryResource = api.root.addResource(userCategoryPathPart, {
      defaultCorsPreflightOptions,
    });
    const userCategoryQueryParameters = {
      "method.request.querystring.categoryId": true,
    };

    const createUserCategoryHandler = new DynamoDBApiHandler(this, "CreateUserCategoryHandler", {
      table,
      resource: userCategoryResource,
      method: "createUserCategory",
      pathPart: userCategoryPathPart,
      httpMethod: "POST",
      schemaModel: models.userCategory,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    /* ==================================== User Settings APIs ===================================== */
    const userSettingsPathPart = "userSettings";
    const userSettingsResource = api.root.addResource(userSettingsPathPart, {
      defaultCorsPreflightOptions,
    });

    const updateUserSettingsHandler = new DynamoDBApiHandler(this, "UpdateUserSettingsHandler", {
      table,
      resource: userSettingsResource,
      method: "updateUserSettings",
      pathPart: userSettingsPathPart,
      httpMethod: "PATCH",
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    /* ================================== Task Notification APIs ===================================== */
    const taskNotificationPathPart = "taskNotification";
    const taskNotificationResource = api.root.addResource(taskNotificationPathPart, {
      defaultCorsPreflightOptions,
    });
    const taskNotificationQueryParameters = {
      "method.request.querystring.taskId": true,
      "method.request.querystring.notificationId": true,
    };

    const createTaskNotificationHandler = new DynamoDBApiHandler(this, "CreateTaskNotificationHandler", {
      table,
      resource: taskNotificationResource,
      pathPart: taskNotificationPathPart,
      method: "createTaskNotification",
      httpMethod: "POST",
      schemaModel: models.taskNotification,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    const deleteTaskNotificationHandler = new DynamoDBApiHandler(this, "DeleteTaskNotificationHandler", {
      table,
      resource: taskNotificationResource,
      pathPart: taskNotificationPathPart,
      method: "deleteTaskNotification",
      httpMethod: "DELETE",
      queryStringParameters: taskNotificationQueryParameters,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });

    const updateTaskNotificationHandler = new DynamoDBApiHandler(this, "UpdateTaskNotificationHandler", {
      table,
      resource: taskNotificationResource,
      pathPart: taskNotificationPathPart,
      method: "updateTaskNotification",
      httpMethod: "PATCH",
      queryStringParameters: taskNotificationQueryParameters,
      authorizer,
      frontendUrl,
      deploymentEnv,
    });
  }
}
