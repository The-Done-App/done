/** =========================================================================================
 * Filename: done-pipeline-stack.ts
 *
 * Description: This file contains the CDK stack for the Done pipeline. This pipeline
 * is self-mutating, meaning that it will update itself when changes are made to the
 * pipeline code and pushed to the Source repository in CodeCommit. The pipeline includes
 * the following stages to build out the CI/CD architecture.
 *
 * =========================================================================================
 *
 * # CI/CD Architecture:
 *
 * Source:
 * - Source stage: pulls the CDK app code from the CodeCommit repo
 *
 * Build:
 * - Test-Build-Synth stage: runs unit tests, builds, and synthesizes the CDK app
 * - Pre prod stage: deploys the CDK app in a pre prod environment
 * - Pre prod react app stage: deploys the React app in a pre prod environment
 *
 * Test:
 * - IntegTest stage: runs integ tests against the deployed app
 *
 * Deploy:
 * - Prod stage: deploys the CDK app in a prod environment
 * - Prod react app stage: deploys the React app in a prod environment
 *
 * =========================================================================================
 *
 * Notes: This example demonstrates the fact that while the structure of CI/CD generally
 * align with the 4 stages above, these stages are loosely defined and should be customized
 * to fit the needs of each application.
 *
 * In this example, the pre prod deployment is placed in the build stage because it is a
 * prerequisite for the integ tests even though it is technically a type of deployment.
 *
 * In addition, the deployment of the Prod stage includes a build command for the React app,
 * but it would not make sense to view this as part of the theoretical build stage since it
 * happens after tests are complete.
 *
========================================================================================= */

import * as cdk from "aws-cdk-lib";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { DoneCdkAppStage } from "./done-cdk-app-stage";
import path = require("path");

/** =========================================================================================
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stack.html
 * 
 * CDK Stack construct for the Done pipeline. This stack corresponds directly to a CloudFormation
 * stack in the AWS account. The stack contains the CI/CD pipeline and the CodeCommit repository.
 ========================================================================================= */
export class DonePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codecommit.Repository.html
     * 
     * CI/CD: === Source ===
     * 
     * Deploy the CodeCommit git repository that will store the CDK app code. Changes to this repo
     * will trigger the pipeline to run (since the synth step below has the repo defined as its input).
     ========================================================================================= */
    const commitRepo = new codecommit.Repository(this, "DoneRepo", {
      repositoryName: "done-cdk",
    });

    // If this error is thrown, the Google Identity Provider details are not set. Please see README.md
    if (!process.env.IDP_SECRETS_ARN) {
      throw new Error("IDP_SECRETS_ARN environment variable must be set");
    }

    // If this error is thrown, the domain prefixes are not set. Please see README.md
    if (!process.env.PROD_DOMAIN_PREFIX || !process.env.PREPROD_DOMAIN_PREFIX) {
      throw new Error("PROD_DOMAIN_PREFIX and PREPROD_DOMAIN_PREFIX environment variables must be set");
    }

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html
     *
     * Self-mutating CI/CD pipeline for the CDK app.
     * 
     * Initialized with the synth step to build the CDK app. Additional stages are defined and added
     * below using the addStage method.
     ========================================================================================= */
    const pipeline = new pipelines.CodePipeline(this, "DonePipeline", {
      /** =========================================================================================
       * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.ShellStep.html
       * 
       * CI/CD: === Build/Test ===
       * 
       * Run shell commands in ephemeral CodeBuild instances to test, build, and synthesize the 
       * CDK app into a CloudFormation template. Under the hood, the built assets are stored in
       * an S3 bucket with a name like "pipelineartifactsbucket".
       ========================================================================================= */
      synth: new pipelines.ShellStep("Test-Build-Synth", {
        input: pipelines.CodePipelineSource.codeCommit(commitRepo, "main"),
        commands: [
          "npm ci", // Install dependencies for CDK app
          "cd lambdas/auth/lambdaAuthorizer && npm ci && cd -", // Install dependencies for lambdas
          "cd lambdas/userTask/createUserTask && npm ci && cd -",
          "cd lambdas/userCategory/createUserCategory && npm ci && cd -",
          "cd lambdas/taskNotification/createTaskNotification && npm ci && cd -",
          "npm run test", // Run unit tests for CDK app
          "npm run build", // Build the CDK app
          "npx cdk synth", // Synthesize the CDK app
        ],
        env: {
          // Identity provider secrets are passed to the pipeline as environment variables.
          IDP_SECRETS_ARN: process.env.IDP_SECRETS_ARN,
          // The domain prefixes are passed to the pipeline as environment variables.
          PROD_DOMAIN_PREFIX: process.env.PROD_DOMAIN_PREFIX,
          PREPROD_DOMAIN_PREFIX: process.env.PREPROD_DOMAIN_PREFIX,
        },
      }),
      // The artifacts bucket is used to store the built assets for the CDK app.
      artifactBucket: new Bucket(this, "DoneArtifactsBucket", {
        // These properties are safe because the CDK app can be regenerated at any time.
        // These help simplify the cleanup process when the stack is destroyed.
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      publishAssetsInParallel: false,
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stage.html
     * 
     * CI/CD: === Build/Test ===
     * 
     * The PreProdAppStage uses the custom DoneCdkAppStage construct to deploy the CDK app in a pre prod
     * environment. By deploying first to a preprod environment, we can run integration tests and verify
     * app functionality without impacting the production environment.
     ========================================================================================= */
    const preProdAppStage = new DoneCdkAppStage(this, "DonePreProdStage", {
      env: {
        account: this.account,
        region: this.region,
      },
      deploymentEnv: "preprod",
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodeBuildStep.html
     * 
     * CI/CD: === Build/Test ===
     * 
     * Run shell commands to pass details about the AWS resources to the React app and build the React app.
     * The built assets are synced to the S3 bucket created by the pre prod stage.
     ========================================================================================= */
    const buildPreProdReactApp = new pipelines.CodeBuildStep("PreProd-React-Build-Deploy", {
      commands: [
        "cd src/done-react", // Change directory to the React app
        "touch .env", // Create a .env file
        'echo "VITE_FRONTEND_URL=${VITE_FRONTEND_URL}" >> .env', // Add the frontend URL to the .env file
        'echo "VITE_USER_POOL_ID=${VITE_USER_POOL_ID}" >> .env', // Add the user pool ID to the .env file
        'echo "VITE_APP_CLIENT_ID=${VITE_APP_CLIENT_ID}" >> .env', // Add the user pool app client ID to the .env file
        'echo "VITE_COGNITO_DOMAIN=${VITE_COGNITO_DOMAIN}" >> .env', // Add the user pool domain to the .env file
        'echo "VITE_API_URL=${VITE_API_URL}" >> .env', // Add the node environment to the .env file
        'echo "VITE_AWS_REGION=${VITE_AWS_REGION}" >> .env', // Add the AWS region to the .env file
        'echo "VITE_NODE_ENV=production" >> .env', // Add the node environment to the .env file
        'echo "VITE_STAGE=preprod" >> .env', // Add the stage to the .env file
        "cat .env", // Print the .env file to the console
        "npm ci", // Install dependencies for React app
        "npm run build", // Build the React app
        "aws s3 cp dist s3://${FRONTEND_BUCKET_NAME} --recursive", // Sync the React app build directory to the S3 bucket
        "aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths '/*'", // Invalidate the CloudFront cache
      ],
      // These values are uses by the React application to make API calls to the backend and configure authentication
      envFromCfnOutputs: {
        VITE_FRONTEND_URL: preProdAppStage.cloudFrontUrlOutput,
        VITE_USER_POOL_ID: preProdAppStage.userPoolIdOutput,
        VITE_APP_CLIENT_ID: preProdAppStage.userPoolClientIdOutput,
        VITE_COGNITO_DOMAIN: preProdAppStage.userPoolDomainOutput,
        VITE_API_URL: preProdAppStage.apiUrlOutput,
        FRONTEND_BUCKET_NAME: preProdAppStage.bucketNameOutput,
        CLOUDFRONT_DISTRIBUTION_ID: preProdAppStage.distributionIdOutput,
      },
      env: {
        VITE_AWS_REGION: this.region,
      },
      // These permissions are required to invalidate the CloudFront cache and
      // sync the React app build directory to the S3 bucket.
      rolePolicyStatements: [
        new PolicyStatement({
          actions: ["cloudfront:CreateInvalidation"],
          resources: ["*"],
        }),
        PolicyStatement.fromJson({
          Effect: "Allow",
          Action: ["s3:DeleteObject", "s3:GetBucketLocation", "s3:GetObject", "s3:ListBucket", "s3:PutObject"],
          Resource: ["arn:aws:s3:::*donepreprod*"],
        }),
      ],
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodeBuildStep.html
     * 
     * CI/CD: === Test ===
     * 
     * Run shell commands in ephemeral CodeBuild instances to run integ tests against the deployed app.
     ========================================================================================= */
    const integTest = new pipelines.CodeBuildStep("IntegTest", {
      commands: [
        "npm ci", // Install dependencies for CDK app
        "npm run test:integ", // Run integ tests for CDK app
      ],
      envFromCfnOutputs: {
        VITE_FRONTEND_URL: preProdAppStage.cloudFrontUrlOutput,
        TABLE_NAME: preProdAppStage.tableNameOutput,
      },
      // These permissions are required to verify that the DynamoDB table was created.
      rolePolicyStatements: [
        PolicyStatement.fromJson({
          Effect: "Allow",
          Action: ["dynamodb:DescribeTable"],
          Resource: ["arn:aws:dynamodb:*:*:table/*DonePreProd*DoneBackendStack*"],
        }),
      ],
    });

    // Add the pre prod stage to the pipeline.
    pipeline.addStage(preProdAppStage, {
      post: [buildPreProdReactApp],
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stage.html
     * 
     * CI/CD: === Deploy ===
     * 
     * The ProdAppStage uses the custom DoneCdkAppStage construct to deploy the CDK app in a prod.
     ========================================================================================= */
    const prodAppStage = new DoneCdkAppStage(this, "DoneProdStage", {
      env: {
        account: this.account,
        region: this.region,
      },
      deploymentEnv: "prod",
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodeBuildStep.html
     *
     * CI/CD: === Deploy ===
     *
     * Run shell commands to pass details about the AWS resources to the React app and build the React app.
     * The built assets are synced to the S3 bucket created by the prod stage.
     * ========================================================================================= */
    const buildProdReactApp = new pipelines.CodeBuildStep("Prod-React-Build-Deploy", {
      commands: [
        "cd src/done-react", // Change directory to the React app
        "touch .env", // Create a .env file
        'echo "VITE_FRONTEND_URL=${VITE_FRONTEND_URL}" >> .env', // Add the frontend URL to the .env file
        'echo "VITE_USER_POOL_ID=${VITE_USER_POOL_ID}" >> .env', // Add the user pool ID to the .env file
        'echo "VITE_APP_CLIENT_ID=${VITE_APP_CLIENT_ID}" >> .env', // Add the user pool app client ID to the .env file
        'echo "VITE_COGNITO_DOMAIN=${VITE_COGNITO_DOMAIN}" >> .env', // Add the user pool domain to the .env file
        'echo "VITE_API_URL=${VITE_API_URL}" >> .env', // Add the node environment to the .env file
        'echo "VITE_AWS_REGION=${VITE_AWS_REGION}" >> .env', // Add the AWS region to the .env file
        'echo "VITE_NODE_ENV=production" >> .env', // Add the node environment to the .env file
        'echo "VITE_STAGE=prod" >> .env', // Add the stage to the .env file
        "cat .env", // Print the .env file to the console
        "npm ci", // Install dependencies for React app
        "npm run build", // Build the React app
        "aws s3 cp dist s3://${FRONTEND_BUCKET_NAME} --recursive", // Sync the React app build directory to the S3 bucket
        "aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths '/*'", // Invalidate the CloudFront cache
      ],
      // These values are uses by the React application to make API calls to the backend and configure authentication
      envFromCfnOutputs: {
        VITE_FRONTEND_URL: prodAppStage.cloudFrontUrlOutput,
        VITE_USER_POOL_ID: prodAppStage.userPoolIdOutput,
        VITE_APP_CLIENT_ID: prodAppStage.userPoolClientIdOutput,
        VITE_COGNITO_DOMAIN: prodAppStage.userPoolDomainOutput,
        VITE_API_URL: prodAppStage.apiUrlOutput,
        FRONTEND_BUCKET_NAME: prodAppStage.bucketNameOutput,
        CLOUDFRONT_DISTRIBUTION_ID: prodAppStage.distributionIdOutput,
      },
      env: {
        VITE_AWS_REGION: this.region,
      },
      // These permissions are required to invalidate the CloudFront cache and
      // sync the React app build directory to the S3 bucket.
      rolePolicyStatements: [
        new PolicyStatement({
          actions: ["cloudfront:CreateInvalidation"],
          resources: ["*"],
        }),
        PolicyStatement.fromJson({
          Effect: "Allow",
          Action: ["s3:DeleteObject", "s3:GetBucketLocation", "s3:GetObject", "s3:ListBucket", "s3:PutObject"],
          Resource: ["arn:aws:s3:::*doneprod*"],
        }),
      ],
    });

    // Add the build step and prod react app stage to the pipeline.
    pipeline.addStage(prodAppStage, {
      pre: [integTest],
      post: [buildProdReactApp],
    });
  }
}
