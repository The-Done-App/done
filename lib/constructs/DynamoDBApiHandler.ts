/** =========================================================================================
 * Filename: DynamoDBApiHandler.ts
 *
 * Description: This file contains the DynamoDBApiHandler construct. This is a custom
 * construct that creates an API Gateway resource, method, and lambda function that
 * interacts with a DynamoDB table.
========================================================================================= */

import * as cdk from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

// These are the props that will be passed to the construct:
interface DynamoDBApiHandlerProps {
  resource: cdk.aws_apigateway.Resource; // The API Gateway resource that the Lambda function will be added to
  pathPart: string; // The path part of the resource
  method: string; // The name of the method / lambda function
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; // The HTTP method
  table: cdk.aws_dynamodb.TableV2; // The DynamoDB table that the Lambda function will interact with
  schemaModel?: cdk.aws_apigateway.Model; // The schema model used to validate the request body
  queryStringParameters?: { [key: string]: boolean }; // The query string parameters used to validate the request
  authorizer?: cdk.aws_apigateway.IAuthorizer; // The authorizer used to authenticate the request
  frontendUrl: string; // The frontend URL used to set the CORS origin
  deploymentEnv: string; // The deployment environment variable used to set the CORS origin
}

/** =========================================================================================
 * This custom construct creates a Lambda function that interacts with a DynamoDB table
 * and adds it as an integration to an API Gateway resource.
 ========================================================================================= */
export class DynamoDBApiHandler extends Construct {
  public readonly handler: Function;
  constructor(
    scope: Construct,
    id: string,
    {
      resource,
      pathPart,
      table,
      method,
      httpMethod,
      schemaModel,
      queryStringParameters,
      authorizer,
      frontendUrl,
      deploymentEnv,
    }: DynamoDBApiHandlerProps,
  ) {
    super(scope, id);

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Function.html
     * 
     * CDK construct for Lambda function. This takes the code from the specified path and creates a Lambda
     * function with a Node.js runtime. It also sets the table name as an environment variable.
      ========================================================================================= */
    const lambdaHandler = new Function(this, id, {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset(`./lambdas/${pathPart}/${method}`),
      handler: `${method}.handler`,
      environment: {
        TABLE_NAME: table.tableName,
        FRONTEND_URL: frontendUrl,
        DEPLOYMENT_ENV: deploymentEnv,
      },
    });
    this.handler = lambdaHandler;

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.Resource.html
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.Method.html
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.LambdaIntegration.html
     * 
     * This function takes the Lambda function and uses it to create a Method on the API Gateway resource.
     * The LambdaIntegration creates a tight integration between the Lambda function and the API method.
      ========================================================================================= */
    resource.addMethod(httpMethod, new LambdaIntegration(lambdaHandler), {
      operationName: method,
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RequestValidator.html
      // If a schema model is provided, create a request validator for the method.
      requestModels: schemaModel ? { "application/json": schemaModel } : undefined,
      requestValidator: schemaModel
        ? new cdk.aws_apigateway.RequestValidator(this, `${method}Validator`, {
            restApi: resource.api,
            validateRequestBody: true,
          })
        : undefined,
      requestParameters: queryStringParameters || undefined,
      // Add the lambda authorizer to the method to authenticate the request and authorize the user
      authorizer,
    });

    // Give the Lambda function read/write permissions to the DynamoDB table
    table.grantReadWriteData(lambdaHandler);
  }
}
