import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DoneFrontendStack } from "../lib/done-frontend-stack";

test("Frontend Stack Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new DoneFrontendStack(app, "TestFrontendStack", {
    deploymentEnv: "preprod",
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResource("AWS::S3::Bucket", {});
  template.hasResource("AWS::CloudFront::Distribution", {});
  template.hasResource("AWS::CloudFront::CloudFrontOriginAccessIdentity", {});
});
