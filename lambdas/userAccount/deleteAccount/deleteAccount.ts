/** =========================================================================================
 * Filename: deleteAccount.ts
 * 
 * Description: Lambda code for the function to delete a user's account and all associated data
 * from the DynamoDB table, including settings, categories, tasks, and task notifications. The
 * user ID is passed in as a header "X-User-Id".
 * 
 * There is no request body for this function.
========================================================================================= */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
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

  // Initialize the DynamoDB client
  const ddbclient = new DynamoDBClient();
  // Create a document client to simplify interactions with DynamoDB
  const docClient = DynamoDBDocument.from(ddbclient);

  // Retrieve the user ID from the request headers
  const userId = event.headers["X-User-Id"] || event.headers["x-user-id"];

  // If no user ID is present, return a 400 error
  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "User ID is missing in the request headers" }),
    };
  }

  // Set up query parameters to retrieve all items for the user
  const queryParams: QueryCommandInput = {
    TableName: process.env.TABLE_NAME || "",
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
    },
  };

  try {
    let lastEvaluatedKey = undefined;
    // Loop to handle paginated results from DynamoDB query
    do {
      // Update the query parameters with the last evaluated key to get the next set of items
      queryParams.ExclusiveStartKey = lastEvaluatedKey;
      // Execute the query against DynamoDB
      const queryResult = await docClient.query(queryParams);

      // If items are found, proceed to delete them
      if (queryResult.Items && queryResult.Items.length > 0) {
        // Map the query results to an array of delete requests
        const deleteRequests = queryResult.Items.map((item) => ({
          DeleteRequest: {
            Key: {
              pk: item.pk,
              sk: item.sk,
            },
          },
        }));

        // Array to hold promises for batch delete operations
        const batchPromises = [];

        // DynamoDB batchWrite can process a maximum of 25 requests at a time
        for (let i = 0; i < deleteRequests.length; i += 25) {
          // Construct batch delete parameters
          const batchWriteParams = {
            RequestItems: {
              [process.env.TABLE_NAME || ""]: deleteRequests.slice(i, i + 25),
            },
          };
          // Add batch delete operation to promises array
          batchPromises.push(docClient.batchWrite(batchWriteParams));
        }

        // Execute all batch delete operations
        await Promise.all(batchPromises);
      }

      // Update the lastEvaluatedKey for the next iteration of the loop
      lastEvaluatedKey = queryResult.LastEvaluatedKey;
    } while (lastEvaluatedKey); // Continue looping until all items are processed

    // Return a 200 response upon successful deletion
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "User items deleted successfully",
      }),
    };
  } catch (error) {
    // Log the error and return a 500 error response
    console.error("Error deleting items from DynamoDB", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error deleting user items",
        error: (error as Error).message,
      }),
    };
  }
};
