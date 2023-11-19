/** =========================================================================================
 * Filename: createTaskNotification.ts
 * 
 * Description: Lambda code for the function to create a new task notification for a task in the
 * DynamoDB table. The task ID is passed in as a query string parameter, and the user ID is passed
 * in as a header "X-User-Id".
 * 
 * The request body should be a JSON object with the following properties:
 * 
 * {
 *   notificationEnabled: boolean,
 *   reminderTimeBeforeDue: number
 * }
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Processing ${event.httpMethod} request for ${event.path}`);

  // Set headers to enable CORS (Cross-Origin Resource Sharing)
  // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS,POST",
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

  // Get the taskId from the query string parameters and ensure it is not empty
  const taskId = event?.queryStringParameters?.taskId;
  if (!taskId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Task ID is missing in the request query string parameters" }),
    };
  }
  // Generate a unique ID for the new task notification
  const notificationId = uuidv4();

  // Parse the request body from JSON string into a JSON object
  const requestBody = JSON.parse(event.body);
  // Get the current time
  const currentTime = Date.now();

  // Define the parameters for the DynamoDB query
  const params = {
    TableName: process.env.TABLE_NAME || "",
    Item: {
      pk: `USER#${userId}`,
      sk: `TASK#${taskId}NOTIFICATION#${notificationId}`,
      notificationEnabled: requestBody.notificationEnabled ?? true,
      reminderTimeBeforeDue: requestBody.reminderTimeBeforeDue,
      createdAt: currentTime,
      updatedAt: currentTime,
    },
  };

  try {
    // Add the new task notification to the table
    await docClient.put(params);

    const cleanedNotifications = {
      taskId: taskId,
      notificationId: notificationId,
      notificationEnabled: params.Item.notificationEnabled,
      reminderTimeBeforeDue: params.Item.reminderTimeBeforeDue,
      createdAt: params.Item.createdAt,
      updatedAt: params.Item.updatedAt,
    };

    // Return a 200 response if no errors
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Task notification created successfully",
        data: cleanedNotifications,
      }),
    };
  } catch (error) {
    console.error("Error inserting item into DynamoDB", error);
    // Return a 500 response if any errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error creating task notification",
        error: (error as Error).message,
      }),
    };
  }
};
