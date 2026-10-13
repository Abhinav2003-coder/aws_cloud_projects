import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // 1. Parse the incoming JSON data from the frontend
    const body = JSON.parse(event.body);
    const { courseId, studentId, date, status } = body;

    // 2. Construct the Sort Key (combining Date and StudentID as planned)
    const sortKey = `${date}_${studentId}`;

    // 3. Prepare the command to insert into DynamoDB
    const command = new PutCommand({
      TableName: "AttendanceRecords",
      Item: {
        CourseID: courseId,          // Partition Key
        Date_StudentID: sortKey,     // Sort Key
        Date: date,
        StudentID: studentId,
        Status: status,              // 'Present', 'Absent', or 'Late'
        Timestamp: new Date().toISOString()
      },
    });

    // 4. Send the command to the database
    await docClient.send(command);

    // 5. Return a success response back to the frontend
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" }, // Required for CORS
      body: JSON.stringify({ message: "Attendance saved successfully!" }),
    };

  } catch (error) {
    console.error("Error saving attendance:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to save record." }),
    };
  }
};