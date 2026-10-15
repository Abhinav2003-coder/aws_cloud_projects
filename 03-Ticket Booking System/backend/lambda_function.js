import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path;

  console.log("Method:", method);
  console.log("Path:", path);
  console.log("Full Event:", JSON.stringify(event, null, 2));

  try {

    // Handle CORS
    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    // ===========================
    // GET /events
    // ===========================
    if (method === "GET" && path.endsWith("/events")) {

      const result = await docClient.send(
        new ScanCommand({
          TableName: "EventsTable",
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items || []),
      };
    }

    // ===========================
    // POST /book
    // ===========================
    if (method === "POST" && path.endsWith("/book")) {

      let body;

      try {
        body = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Invalid JSON",
          }),
        };
      }

      const { eventId, userEmail, seatsRequested } = body;

      // Validation
      if (!eventId || !userEmail || seatsRequested == null) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Missing required fields",
          }),
        };
      }

      const seats = Number(seatsRequested);

      if (isNaN(seats) || seats <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Seats must be a positive number",
          }),
        };
      }

      if (!userEmail.includes("@")) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: "Invalid email address",
          }),
        };
      }

      const bookingId =
        "BOOK-" + Math.random().toString(36).substring(2, 9).toUpperCase();

      // Update available seats
      await docClient.send(
        new UpdateCommand({
          TableName: "EventsTable",
          Key: {
            eventId: eventId,
          },
          UpdateExpression:
            "SET availableSeats = availableSeats - :seats",
          ConditionExpression:
            "attribute_exists(eventId) AND availableSeats >= :seats",
          ExpressionAttributeValues: {
            ":seats": seats,
          },
        })
      );

      // Save booking
      await docClient.send(
        new PutCommand({
          TableName: "BookingsTable",
          Item: {
            bookingId,
            eventId,
            userEmail,
            seatsBooked: seats,
            bookingStatus: "CONFIRMED",
            timestamp: new Date().toISOString(),
          },
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Ticket booked successfully!",
          bookingId,
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        message: "Route not found",
      }),
    };

  } catch (error) {

    console.error(error);

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Requested seats are not available or event not found.",
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};