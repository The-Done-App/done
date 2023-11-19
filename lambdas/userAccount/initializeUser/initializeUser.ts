/** =========================================================================================
 * Filename: initializeUser.ts
 * 
 * Description: Lambda code for the function to initialize a user in the DynamoDB table.
 * The user ID is passed in as a header "X-User-Id".
 * 
 * If the user does not exist, a new user and settings are created.
 * If the user exists, the user's settings, categories, tasks, and task notifications are retrieved.
 * 
 * There is no request body for this function.
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, GetCommandInput, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {
  TaskNotificationsResponse,
  UserCategoriesResponse,
  UserSettingsResponse,
  UserTasksResponse,
} from "./userResponseTypes";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log the incoming event and context for debugging purposes
  console.log(`Processing ${event.httpMethod} request for ${event.path}`);

  // Set headers to enable CORS (Cross-Origin Resource Sharing)
  // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-User-Id",
    "Access-Control-Allow-Origin": `https://${process.env.FRONTEND_URL}` || "",
  };

  // Initialize the DynamoDB Client and Document Client
  const ddbclient = new DynamoDBClient();
  const docClient = DynamoDBDocument.from(ddbclient);

  // Check if the table name environment variable is set
  if (!process.env.TABLE_NAME) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Table name not set" }),
    };
  }

  // Extract user ID from the request headers
  const userId = event.headers["X-User-Id"] || event.headers["x-user-id"];

  // Return an error if user ID is missing
  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "User ID is missing in the request headers" }),
    };
  }

  // Current timestamp for creating new user entries
  const currentTime = Date.now();

  // Prepare to check if user settings already exist
  const userSettingsParams: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: `SETTINGS#`,
    },
  };

  // Attempt to get the user's settings
  const response = await docClient.get(userSettingsParams);

  /** =========================================================================================
   * If user settings do not exist, create new settings for the user
  ========================================================================================= */
  if (!response.Item) {
    const userSettings = {
      // Define default user settings
      twelveHour: true,
      enableNotifications: true,
      displayEmail: false,
      defaultNotifications: {
        "5": true,
        "15": true,
        "30": false,
        "45": false,
        "60": false,
      },
      sortMode: "category" as const,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    // Prepare parameters for creating user settings in DynamoDB
    const settingsParams = {
      TableName: process.env.TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `SETTINGS#`,
        ...userSettings,
      },
    };

    try {
      // Insert new user settings into the database
      await docClient.put(settingsParams);

      // Return success response with created user settings
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "User and settings created successfully",
          data: {
            userSettings,
            userCategories: [],
            userTasks: [],
            taskNotifications: [],
          },
        }),
      };
    } catch (error) {
      // Log and return any error encountered during the put operation
      console.error("Error inserting items into DynamoDB", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: "Error creating user and settings",
          error: (error as Error).message,
        }),
      };
    }
  } else {
    /** =========================================================================================
     * If user settings exist, retrieve and return the user's data
    ========================================================================================= */

    // Prepare parameters to get the user's tasks, categories, and notifications from DynamoDB.

    // User Categories parameters
    const userCategoriesParams: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": `CATEGORY#`,
      },
    };

    // User Tasks and Notifications parameters
    const userTasksAndNotificationsParams: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": `TASK#`,
      },
    };

    // Retrieve the user's settings, categories, tasks, and notifications from DynamoDB
    const [userSettings, userCategories, userTasksAndNotifications] = await Promise.all([
      docClient.get(userSettingsParams) as Promise<UserSettingsResponse>,
      docClient.query(userCategoriesParams) as Promise<UserCategoriesResponse>,
      docClient.query(userTasksAndNotificationsParams) as Promise<UserTasksResponse | TaskNotificationsResponse>,
    ]);

    // Clean the user data to remove unnecessary attributes
    const cleanedUserSettings = {
      twelveHour: userSettings.Item?.twelveHour,
      enableNotifications: userSettings.Item?.enableNotifications,
      displayEmail: userSettings.Item?.displayEmail,
      defaultNotifications: {
        "5": userSettings.Item?.defaultNotifications["5"],
        "15": userSettings.Item?.defaultNotifications["15"],
        "30": userSettings.Item?.defaultNotifications["30"],
        "45": userSettings.Item?.defaultNotifications["45"],
        "60": userSettings.Item?.defaultNotifications["60"],
      },
      sortMode: userSettings.Item?.sortMode,
      createdAt: userSettings.Item?.createdAt,
      updatedAt: userSettings.Item?.updatedAt,
    };

    // Clean the user categories to pull out the category ID and remove unnecessary attributes
    const cleanedUserCategories = userCategories.Items?.map((category) => ({
      categoryId: category.sk.split("CATEGORY#")[1],
      categoryName: category.categoryName,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    // Filter to only retrieve user tasks
    const filteredUserTasks = (userTasksAndNotifications as UserTasksResponse).Items?.filter(
      (task) => !task.sk.includes("NOTIFICATION#"),
    );

    // Clean the user tasks to pull out the task ID and remove unnecessary attributes
    const cleanedUserTasks = filteredUserTasks?.map((task) => ({
      taskId: task.sk.split("TASK#")[1],
      taskTitle: task.taskTitle,
      taskNotes: task.taskNotes ? task.taskNotes : "",
      taskDueDate: task.taskDueDate ? task.taskDueDate : 0,
      taskCompleted: task.taskCompleted,
      categoryId: task.categoryId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    // Filter to only retrieve task notifications
    const filteredTaskNotifications = (userTasksAndNotifications as TaskNotificationsResponse).Items?.filter((task) =>
      task.sk.includes("NOTIFICATION#"),
    );

    // Clean the task notifications to pull out the task ID and notification ID and remove unnecessary attributes
    const cleanedTaskNotifications = filteredTaskNotifications?.map((notification) => ({
      notificationId: notification.sk.split("NOTIFICATION#")[1],
      taskId: notification.sk.split("TASK#")[1].split("NOTIFICATION#")[0],
      notificationEnabled: notification.notificationEnabled,
      reminderTimeBeforeDue: notification.reminderTimeBeforeDue,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    // Return success response with all the retrieved user data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "User data retrieved successfully",
        data: {
          userSettings: cleanedUserSettings,
          userCategories: cleanedUserCategories,
          userTasks: cleanedUserTasks,
          taskNotifications: cleanedTaskNotifications,
        },
      }),
    };
  }
};
