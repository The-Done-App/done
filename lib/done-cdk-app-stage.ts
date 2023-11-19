/** =========================================================================================
 * Filename: done-cdk-app-stage.ts
 *
 * Description: CDK Stage construct for the Done app. CDK stages can be used to
 * deploy multiple stacks in a single pipeline and can easily be reused to deploy
 * the same stacks in different environments (e.g. prepod, prod) or accounts.
 *
 * This stage is used to deploy the frontend and backend stacks.
 *
 * Contains:
 * - DynamoDB table construct
 * - Cognito user pool construct
 * - API Gateway Rest API construct
 * - DynamoDBApiHandler construct (custom construct to create API Gateway resources,
 * methods, and lambda functions)
========================================================================================= */

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DoneBackendStack } from "./done-backend-stack";
import { DoneFrontendStack } from "./done-frontend-stack";

// The stage construct takes in the deploymentEnv prop to determine which environment
// the app is being deployed to (e.g. preprod, prod).
interface DoneCdkAppStageProps extends cdk.StageProps {
  deploymentEnv: string;
}

/** =========================================================================================
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stage.html
 * 
 * CDK Stage construct for deploying an entire environment (e.g. preprod, prod). This stage is used
 * to deploy both the frontend and backend stacks while outputting resource identifiers for use in
 * later stages of the pipeline.
 ========================================================================================= */
export class DoneCdkAppStage extends cdk.Stage {
  cloudFrontUrlOutput: cdk.CfnOutput;
  distributionIdOutput: cdk.CfnOutput;
  bucketArnOutput: cdk.CfnOutput;
  bucketNameOutput: cdk.CfnOutput;
  tableNameOutput: cdk.CfnOutput;
  userPoolIdOutput: cdk.CfnOutput;
  userPoolClientIdOutput: cdk.CfnOutput;
  userPoolDomainOutput: cdk.CfnOutput;
  apiUrlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: DoneCdkAppStageProps) {
    super(scope, id, props);

    // Deploy the frontend stack.
    const frontendStack = new DoneFrontendStack(this, "DoneFrontendStack", {
      deploymentEnv: props.deploymentEnv || "preprod",
    });

    // Deploy the backend stack.
    const backendStack = new DoneBackendStack(this, "DoneBackendStack", {
      deploymentEnv: props.deploymentEnv || "preprod",
      frontendUrl: frontendStack.cloudFrontUrlOutput.value,
    });

    // Expose the following values as outputs of this stage
    this.cloudFrontUrlOutput = frontendStack.cloudFrontUrlOutput;
    this.distributionIdOutput = frontendStack.distributionIdOutput;
    this.bucketArnOutput = frontendStack.bucketArnOutput;
    this.bucketNameOutput = frontendStack.bucketNameOutput;
    this.tableNameOutput = backendStack.tableNameOutput;
    this.userPoolIdOutput = backendStack.userPoolIdOutput;
    this.userPoolClientIdOutput = backendStack.userPoolClientIdOutput;
    this.userPoolDomainOutput = backendStack.userPoolDomainOutput;
    this.apiUrlOutput = backendStack.apiUrlOutput;
  }
}
