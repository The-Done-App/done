/** =========================================================================================
 * Filename: createUserCategory.ts
 * 
 * Description: Lambda code for the function to create a new category for a user in the DynamoDB
 * table. The user ID is passed in as a header "X-User-Id".
 * 
 * The request body should be a JSON object with the following property:
 * 
 * {
 *  categoryName: string
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

  // Creating a new DynamoDB Document Client instance
  const ddbclient = new DynamoDBClient();
  const docClient = DynamoDBDocument.from(ddbclient);

  // Extracting the User ID from the incoming request headers
  const userId = event.headers["X-User-Id"] || event.headers["x-user-id"];
  // Check if the User ID is provided or not
  if (!userId) {
    // If User ID is missing, return a 400 error with a message
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "User ID is missing in the request headers" }),
    };
  }

  // Check if the request body is provided or not
  if (!event.body) {
    // If request body is missing, return a 400 error with a message
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }

  // Generate a new UUID for the category
  const categoryId = uuidv4();

  // Parse the request body to get the category name
  const requestBody = JSON.parse(event.body);
  // Current timestamp for setting the creation and last updated time
  const currentTime = Date.now();

  // Define parameters for DynamoDB put operation
  const params = {
    TableName: process.env.TABLE_NAME || "",
    Item: {
      pk: `USER#${userId}`,
      sk: `CATEGORY#${categoryId}`,
      categoryName: requestBody.categoryName,
      createdAt: currentTime,
      updatedAt: currentTime,
    },
  };

  const cleanedUserCategories = {
    categoryId: categoryId,
    categoryName: requestBody.categoryName,
    createdAt: currentTime,
    updatedAt: currentTime,
  };

  // Try to put the new item in the DynamoDB table
  try {
    await docClient.put(params);
    // On success, return the created category information
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: cleanedUserCategories,
        message: "Category created successfully",
      }),
    };
  } catch (error) {
    // Log the error and return a 500 error response if the put operation fails
    console.error("Error inserting item into DynamoDB", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error creating category",
        error: (error as Error).message,
      }),
    };
  }
};
