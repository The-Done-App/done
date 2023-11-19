/** =========================================================================================
 * Filename: updateUserTask.ts
 * 
 * Description: Lambda code for the function to update a user task in the DynamoDB table. The task
 * ID is passed in as a query string parameter, and the user ID is passed in as a header "X-User-Id".
 * 
 * Since we are using a PATCH request, only the properties to be updated need to be passed.
 * The request body should be a JSON object with any combination of following properties:
 * 
 * {
 *  taskTitle?: string,
 *  taskNotes?: string,
 *  taskDueDate?: number,
 *  taskCompleted?: boolean,
 *  categoryId?: string | null
 * }
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
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
  // Ensure the request has the necessary parameters
  const taskId = event?.queryStringParameters?.taskId;
  if (!taskId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Task ID is missing in the request query string parameters" }),
    };
  }
  // Parse the request body from JSON string into a JSON object
  const requestBody = JSON.parse(event.body);

  // Build the update expression and expression attribute values for the DynamoDB query
  const updateExpressionParts: string[] = ["updatedAt = :updatedAt"];
  const expressionAttributeValues: { [key: string]: any } = {
    ":updatedAt": Date.now(),
  };

  // Loop through the request body and add the properties to be updated to the update expression
  for (const key in requestBody) {
    updateExpressionParts.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = requestBody[key];
  }

  // Construct the update expression for DynamoDB
  const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

  // Define the parameters for the DynamoDB query
  const params = {
    TableName: process.env.TABLE_NAME || "",
    Key: {
      pk: `USER#${userId}`,
      sk: `TASK#${taskId}`,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: Object.keys(requestBody).reduce((obj, key) => {
      obj[`#${key}`] = key;
      return obj;
    }, {} as any),
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    // Update the task in DynamoDB
    const updatedTask = await docClient.update(params);
    // Return a 200 response along with the updated attributes if no errors
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Task updated successfully",
        data: updatedTask.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error updating task in DynamoDB", error);
    // Return a 500 response if there are any errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error updating task",
        error: (error as Error).message,
      }),
    };
  }
};
