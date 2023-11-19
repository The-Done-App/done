import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as fs from "fs";
import { DonePipelineStack } from "../lib/done-pipeline-stack";
import path = require("path");

// Create a mock dist folder for the tests to use as an asset for BucketDeployment.
beforeAll(() => {
  const distPath = path.join("src", "done-react", "dist");
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
});

test("Pipeline Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new DonePipelineStack(app, "TestPipelineStack", {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::CodeCommit::Repository", {
    RepositoryName: "done-cdk",
  });
  template.hasResource("AWS::CodePipeline::Pipeline", {});
});
