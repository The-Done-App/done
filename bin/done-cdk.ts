#!/usr/bin/env node

/** =========================================================================================
 * Filename: done-cdk.ts
 *
 * Description: This is the entry point for the CDK app. It creates the pipeline
 * stack and is responsible for the original deployment before the code is
 * committed to the CodeCommmit repo.
 *
 * Once deployed, the pipeline will be triggered by changes to the repository.
========================================================================================= */
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { DonePipelineStack } from "../lib/done-pipeline-stack";

const app = new cdk.App();

new DonePipelineStack(app, "DonePipelineStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// ===============================================================================
// When making changes to the backend and frontend stacks, successful synthesis
// can be verified locally by uncommenting the following lines and running:
//
// `cdk synth DoneBackendStack && cdk synth DoneFrontendStack`
// ===============================================================================

// new DoneBackendStack(app, "DoneBackendStack", {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
//   deploymentEnv: "preprod",
//   frontendUrlOutput: "https://example.com",
// });

// new DoneFrontendStack(app, "DoneFrontendStack", {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
// });
