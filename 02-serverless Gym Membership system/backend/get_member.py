import json
from decimal import Decimal
import boto3

# DynamoDB initialize karein
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('GymMembers')

# Reusable CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
}


# Helper class to convert DynamoDB Decimal objects to int/float for JSON serialization
class DecimalEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, Decimal):
            # Convert decimal to int if whole number, else float
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    try:
        # Check query parameters for userId
        if (
            not event.get('queryStringParameters')
            or 'userId' not in event['queryStringParameters']
        ):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'message': 'Missing required query parameter: userId'
                }),
            }

        user_id = event['queryStringParameters']['userId']

        # Fetch member from DynamoDB
        response = table.get_item(Key={'userId': user_id})

        if 'Item' in response:
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                # DecimalEncoder handles any numeric fields safely
                'body': json.dumps(response['Item'], cls=DecimalEncoder),
            }
        else:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'User not found'}),
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)}),
        }