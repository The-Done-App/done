/** =========================================================================================
 * Filename: DoneSchemaModel.ts
 *
 * Description: This file contains the DoneSchemaModel construct. This is a custom
 * construct that creates the schema models for each resource type in the Done app.
 * The schema models are used to validate the data sent to the API.
========================================================================================= */

import { JsonSchemaType, JsonSchemaVersion, Model, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

// https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchemaType.html
//
// Define the schema for each resource type for API request validation
const dataSchemas = {
  userCategory: {
    categoryName: { type: JsonSchemaType.STRING },
  },
  userTask: {
    taskTitle: { type: JsonSchemaType.STRING },
    taskNotes: { type: JsonSchemaType.STRING },
    taskDueDate: { type: JsonSchemaType.NUMBER },
    taskCompleted: { type: JsonSchemaType.BOOLEAN, default: false },
    categoryId: { type: JsonSchemaType.STRING, default: "none" },
  },
  taskNotification: {
    notificationEnabled: { type: JsonSchemaType.BOOLEAN, default: true },
    reminderTimeBeforeDue: { type: JsonSchemaType.NUMBER },
  },
};

interface DoneSchemaModelProps {
  resourceType: "userTask" | "userCategory" | "taskNotification";
  api: RestApi;
}

/** =========================================================================================
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.Model.html
 * 
 * CDK construct for API Gateway to validate API request format.
 ========================================================================================= */
export class DoneSchemaModel extends Model {
  constructor(scope: Construct, id: string, { resourceType, api }: DoneSchemaModelProps) {
    super(scope, id, {
      contentType: "application/json",
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: `${resourceType}Model`,
        type: JsonSchemaType.OBJECT,
        properties: dataSchemas[resourceType],
      },
      restApi: api,
    });
  }
}
