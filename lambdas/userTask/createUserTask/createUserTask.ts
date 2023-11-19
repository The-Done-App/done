/** =========================================================================================
 * Filename: createUserTask.ts
 * 
 * Description: Lambda code for the function to create a new task and its notifications in the
 * DynamoDB table. The user ID is passed in as a header "X-User-Id".
 * 
 * The request body should be a JSON object with the following properties:
 * 
 * {
 *  taskTitle: string,
 *  taskCompleted: boolean,
 *  taskNotes?: string,
 *  taskDueDate?: number,
 *  categoryId?: string
 * }
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Processing ${event.httpMethod} request for ${event.path}`);

  // Verify that the table name is set
  if (!process.env.TABLE_NAME) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Table name not set" }),
    };
  }

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

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }

  // Generate a unique ID for the new task
  const taskId = uuidv4();

  // Parse the request body as JSON and set the current time
  const requestBody = JSON.parse(event.body);
  const currentTime = Date.now();

  // Define the parameters for the DynamoDB query
  const taskParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      pk: `USER#${userId}`,
      sk: `TASK#${taskId}`,
      taskTitle: requestBody.taskTitle,
      taskCompleted: false,
      ...(requestBody.taskNotes && { taskNotes: requestBody.taskNotes }),
      ...(requestBody.taskDueDate && { taskDueDate: requestBody.taskDueDate }),
      ...(requestBody.categoryId && { categoryId: requestBody.categoryId }),
      createdAt: currentTime,
      updatedAt: currentTime,
    } as Record<string, unknown>,
  };
  // If the task has notifications, add them to the batch write request
  const notifications = requestBody.defaultNotifications;
  const notificationItems = Object.keys(notifications)
    .filter((key) => notifications[key])
    .map((reminderTime) => ({
      pk: `USER#${userId}`,
      sk: `TASK#${taskId}NOTIFICATION#${uuidv4()}`,
      notificationEnabled: true,
      reminderTimeBeforeDue: parseInt(reminderTime),
      createdAt: currentTime,
      updatedAt: currentTime,
    }));

  try {
    // Insert the task into the table
    await docClient.put(taskParams);

    // Batch insert for notifications
    const writeRequests = notificationItems.map((item) => ({ PutRequest: { Item: item } }));
    await docClient.batchWrite({
      RequestItems: {
        [process.env.TABLE_NAME]: writeRequests,
      },
    });

    // Clean the task and notification data before returning it
    const cleanedTask = {
      taskId: taskId,
      taskTitle: requestBody.taskTitle,
      taskCompleted: requestBody.taskCompleted,
      taskNotes: requestBody.taskNotes ? requestBody.taskNotes : "",
      taskDueDate: requestBody.taskDueDate ? requestBody.taskDueDate : 0,
      ...(requestBody.categoryId && { categoryId: requestBody.categoryId }),
      taskNotifications: requestBody.taskNotifications,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
    const cleanedNotifications = notificationItems.map((notification) => ({
      notificationId: notification.sk.split("NOTIFICATION#")[1],
      taskId: taskId,
      notificationEnabled: notification.notificationEnabled,
      reminderTimeBeforeDue: notification.reminderTimeBeforeDue,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    // Return a 200 response and the task and notification data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Task and its notifications created successfully",
        data: {
          task: cleanedTask,
          notifications: cleanedNotifications,
        },
      }),
    };
  } catch (error) {
    console.error("Error inserting into DynamoDB", error);
    // Return a 500 response if there are any errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error creating task and its notifications",
        error: (error as Error).message,
      }),
    };
  }
};
