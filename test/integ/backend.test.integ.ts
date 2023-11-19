import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient();
console.log("TableName:", process.env.TABLE_NAME);
describe("DynamoDB Table", () => {
  it("should verify the table is active", async () => {
    const response = await dynamoDB.send(new DescribeTableCommand({ TableName: process.env.TABLE_NAME }));
    expect(response.Table?.TableStatus).toBe("ACTIVE");
  });
});
