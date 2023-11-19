import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DoneBackendStack } from "../lib/done-backend-stack";

test("Backend Stack Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new DoneBackendStack(app, "TestBackendStack", {
    deploymentEnv: "preprod",
    frontendUrl: "https://example.com",
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResource("AWS::DynamoDB::GlobalTable", {});
  template.hasResource("AWS::ApiGateway::RestApi", {});
  template.hasResource("AWS::Cognito::UserPool", {});
  // template.hasResource("AWS::Cognito::UserPoolDomain", {});
  template.hasResource("AWS::Cognito::UserPoolClient", {});
  template.hasResource("AWS::Cognito::UserPoolIdentityProvider", {});
});
