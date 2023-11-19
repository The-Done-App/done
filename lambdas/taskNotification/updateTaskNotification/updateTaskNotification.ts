/** =========================================================================================
 * Filename: updateTaskNotification.ts
 * 
 * Description: Lambda code for the function to update a task notification for a task in the
 * DynamoDB table. The task ID and notification ID are passed in as query string parameters,
 * and the user ID is passed in as a header "X-User-Id".
 * 
 * Since we are using a PATCH request, only the properties to be updated need to be passed.
 * The request body should be a JSON object with ONE OR BOTH of following properties:
 * 
 * {
 *  notificationEnabled?: boolean,
 *  reminderTimeBeforeDue?: number
 * }
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Processing ${event.httpMethod} request for ${event.path}`);

  // Set headers to enable CORS (Cross-Origin Resource Sharing)
  // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS,PATCH",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-User-Id",
    "Access-Control-Allow-Origin": `https://${process.env.FRONTEND_URL}` || "",
  };

  // Initialize DynamoDB Document Client for making queries to DynamoDB
  const ddbclient = new DynamoDBClient();
  const docClient = DynamoDBDocument.from(ddbclient);

  // Read user ID from headers
  const userId = event.headers["X-User-Id"] || event.headers["x-user-id"];
  // Ensure that the user ID is not empty
  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "User ID is missing in the request headers" }),
    };
  }

  // Ensure the request has a body
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }

  // Get the taskId and notificationId from the query string parameters
  const taskId = event?.queryStringParameters?.taskId;
  const notificationId = event?.queryStringParameters?.notificationId;

  // Ensure the request has the necessary parameters
  if (!taskId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Task ID is missing in the request query string parameters" }),
    };
  }
  if (!notificationId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Notification ID is missing in the request query string parameters" }),
    };
  }

  // Parse the request body from JSON string into a JSON object
  const requestBody = JSON.parse(event.body);

  // Define the update expression and attribute values based on the request body
  const updateExpressionParts: string[] = ["updatedAt = :updatedAt"];
  const expressionAttributeValues: { [key: string]: any } = {
    ":updatedAt": Date.now(),
  };

  for (const key in requestBody) {
    updateExpressionParts.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = requestBody[key];
  }

  const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

  // Define the parameters for the DynamoDB query
  const params = {
    TableName: process.env.TABLE_NAME || "",
    Key: {
      pk: `TASK#${taskId}`,
      sk: `NOTIFICATION#${notificationId}`,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: Object.keys(requestBody).reduce((obj, key) => {
      obj[`#${key}`] = key;
      return obj;
    }, {} as any),
    ExpressionAttributeValues: expressionAttributeValues,
  };

  type TaskNotification = {
    notificationEnabled: boolean;
    reminderTimeBeforeDue: number;
    createdAt: number;
    updatedAt: number;
    pk: string;
    sk: string;
  };

  type TaskNotificationResponse = Omit<UpdateCommandOutput, "Attributes"> & {
    Attributes?: TaskNotification;
  };

  try {
    // Update the task notification
    const response = (await docClient.update(params)) as TaskNotificationResponse;

    // Clean the response to only return the properties that were updated
    const cleanedNotification = {
      taskId: taskId,
      notificationId: notificationId,
      // Only return the properties that were updated
      ...(response.Attributes?.notificationEnabled !== undefined && {
        notificationEnabled: response.Attributes.notificationEnabled,
      }),
      ...(response.Attributes?.reminderTimeBeforeDue !== undefined && {
        reminderTimeBeforeDue: response.Attributes.reminderTimeBeforeDue,
      }),
      ...(response.Attributes?.createdAt !== undefined && { createdAt: response.Attributes.createdAt }),
      ...(response.Attributes?.updatedAt !== undefined && { updatedAt: response.Attributes.updatedAt }),
    };

    // Return a 200 response if no errors
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Task notification updated successfully",
        data: cleanedNotification,
      }),
    };
  } catch (error) {
    console.error("Error updating task notification", error);
    // Return a 500 response if any errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error updating task notification",
        error: (error as Error).message,
      }),
    };
  }
};
