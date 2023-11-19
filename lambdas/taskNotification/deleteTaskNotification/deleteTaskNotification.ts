/** =========================================================================================
 * Filename: deleteTaskNotification.ts
 * 
 * Description: Lambda code for the function to delete a task notification for a task in the
 * DynamoDB table. The task ID and notification ID are passed in as query string parameters,
 * and the user ID is passed in as a header "X-User-Id".
 * 
 * There is no request body for this function.
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Processing ${event.httpMethod} request for ${event.path}`);

  // Set headers to enable CORS (Cross-Origin Resource Sharing)
  // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS,DELETE",
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

  // Get the task ID and notification ID from the query string parameters
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

  // Define the parameters for the DynamoDB query
  const params = {
    TableName: process.env.TABLE_NAME || "",
    Key: {
      pk: `USER#${userId}`,
      sk: `TASK#${taskId}NOTIFICATION#${notificationId}`,
    },
  };

  try {
    // Delete the task notification from the table
    await docClient.delete(params);

    // Return a 200 response if no errors
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Task notification deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Error deleting item from DynamoDB", error);
    // Return a 500 response if any errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error deleting task notification",
        error: (error as Error).message,
      }),
    };
  }
};
