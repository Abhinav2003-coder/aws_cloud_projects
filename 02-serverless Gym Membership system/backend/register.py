import json
import boto3

# 1. DynamoDB resource initialize karein
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('GymMembers')

# Common CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
}


def lambda_handler(event, context):
    try:
        # Check agar request body missing hai (jaise browser me URL open karne par)
        if not event.get('body'):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'error': 'Missing request body. Please send a valid POST request with JSON payload.'
                }),
            }

        # 2. Request body parse karein
        body = json.loads(event['body'])

        user_id = body['userId']
        email = body['email']
        name = body['name']

        # 3. DynamoDB me data save karein
        table.put_item(
            Item={
                'userId': user_id,
                'email': email,
                'name': name,
                'membershipStatus': 'ACTIVE',
                'tier': 'Gold',
            }
        )

        # 4. Success response
        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Member data saved successfully!'}),
        }

    except Exception as e:
        # Error handling
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)}),
        }