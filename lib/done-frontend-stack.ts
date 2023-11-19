/** =========================================================================================
 * Filename: done-frontend-stack.ts
 *
 * Description: This file contains the CDK stack for the Done frontend. The constructs
 * in this stack correspond directly to the frontend resources that will be deployed
 * in the AWS account.
 *
 * Contains:
 * - S3 bucket construct
 * - CloudFront distribution construct
 * - Outputs for the frontend stack's CloudFront URL, bucket ARN, and bucket name
 *  to be used in other parts of the CDK app and React App.
========================================================================================= */

import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface DoneFrontendStackProps extends cdk.StageProps {
  deploymentEnv: string;
}

/** =========================================================================================
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stack.html
 * 
 * CDK Stack construct for the frontend resources. This stack corresponds to a CloudFormation stack that
 * is deployed by the pipeline through the DoneCdkAppStage construct (used for both preprod and prod).
 ========================================================================================= */
export class DoneFrontendStack extends cdk.Stack {
  cloudFrontUrlOutput: cdk.CfnOutput;
  distributionIdOutput: cdk.CfnOutput;
  bucketArnOutput: cdk.CfnOutput;
  bucketNameOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: DoneFrontendStackProps) {
    super(scope, id, props);

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
     * 
     * This bucket will be used to host the frontend assets.
      ========================================================================================= */
    const frontendBucket = new s3.Bucket(this, "DoneFrontendBucket", {
      // These properties are safe because the React assets can be regenerated at any time.
      // These help simplify the cleanup process when the stack is destroyed.
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /** =========================================================================================
     * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.Distribution.html
     * 
     * This CloudFront distribution will be used to serve the frontend assets from the S3 bucket.
     ========================================================================================= */
    const frontendDistribution = new cloudfront.Distribution(this, "DoneFrontendDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // Expose the frontend stack's CloudFront URL as an output of this stack.
    this.cloudFrontUrlOutput = new cdk.CfnOutput(this, "DoneCloudFrontUrlOutput", {
      value: frontendDistribution.distributionDomainName,
      exportName: `DoneCloudFrontUrl-${props.deploymentEnv}`,
    });
    // Expose the CloudFront DistributionId as an output of this stack.
    this.distributionIdOutput = new cdk.CfnOutput(this, "DoneDistributionIdOutput", {
      value: frontendDistribution.distributionId,
      exportName: `DoneDistributionId-${props.deploymentEnv}`,
    });
    // Expose the Frontend Bucket ARN as an output of this stack.
    this.bucketArnOutput = new cdk.CfnOutput(this, "DoneBucketArnOutput", {
      value: frontendBucket.bucketArn,
      exportName: `DoneBucketArn-${props.deploymentEnv}`,
    });
    // Expose the Frontend Bucket Name as an output of this stack.
    this.bucketNameOutput = new cdk.CfnOutput(this, "DoneBucketNameOutput", {
      value: frontendBucket.bucketName,
      exportName: `DoneBucketName-${props.deploymentEnv}`,
    });
  }
}
