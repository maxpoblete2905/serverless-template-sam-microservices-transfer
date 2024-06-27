// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
import { v4 as uuidv4 } from "uuid";

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A simple example includes a HTTP patch method to add a list of items to a DynamoDB table.
 */
export const patchItemsHandler = async (event) => {
  if (event.httpMethod !== "PATCH") {
    throw new Error(
      `putItemHandler only accepts PATCH method, you tried: ${event.httpMethod} method.`
    );
  }
  // All log statements are written to CloudWatch
  console.info("received:", event);

  // Parse the body of the request to get the list of items
  const body = JSON.parse(event.body);
  const items = body.items; // Assuming the list of items is under the "items" key

  // Generate unique IDs and create the list of PutRequest objects
  const putRequests = items.map((item) => ({
    PutRequest: {
      Item: {
        id: uuidv4(),
        ...item,
      },
    },
  }));

  // Create the BatchWriteCommand input
  const params = {
    RequestItems: {
      [tableName]: putRequests,
    },
  };

  try {
    // Send the batch write command
    const data = await ddbDocClient.send(new BatchWriteCommand(params));
    console.log("Success - items added", data);
  } catch (err) {
    console.log("Error", err.stack);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Items added successfully",
      items: putRequests,
    }),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
