/** =========================================================================================
 * Filename: deleteUserTask.ts
 * 
 * Description: Lambda code for the function to delete a user's task from the DynamoDB table. The
 * user ID is passed in as a header "X-User-Id", and the task ID is passed in as a query string
 * parameter.
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

  // Verify that the table name is set
  if (!process.env.TABLE_NAME) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Table name not set" }),
    };
  }

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
  // Ensure the request has the necessary parameters
  const taskId = event.queryStringParameters?.taskId;
  if (!taskId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Task ID is missing in the request query string parameters" }),
    };
  }

  // Define the parameters for the DynamoDB query
  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: `TASK#${taskId}`,
    },
  };

  try {
    // Delete the task from the table
    await docClient.delete(params);
    // Return a 200 response if there are no errors
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Task deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting task from DynamoDB", error);
    // Return a 500 response if there was an error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error deleting task",
        error: (error as Error).message,
      }),
    };
  }
};
