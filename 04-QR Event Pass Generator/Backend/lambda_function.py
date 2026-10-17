import json
import uuid
import boto3
from datetime import datetime
import urllib.parse

# AWS Services ko connect karna
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TABLE_NAME = 'EventPasses'
BUCKET_NAME = 'event-pass-2026'  # <-- YAHAN APNE S3 BUCKET KA NAAM DAALEIN!

def lambda_handler(event, context):
    try:
        # 1. Frontend Form se aane wala JSON data padhna
        if 'body' in event and event['body']:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        name = body.get('name', 'Guest Student')
        email = body.get('email', 'student@example.com')
        event_name = body.get('event_name', 'AWS Cloud & AI Workshop 2026')

        # 2. Unique Ticket ID (e.g., PASS-A1B2C3D4) aur Time banana
        ticket_id = "PASS-" + str(uuid.uuid4())[:8].upper()
        issued_at = datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')

        # 3. DynamoDB Table mein Record Save karna
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(Item={
            'ticket_id': ticket_id,
            'name': name,
            'email': email,
            'event_name': event_name,
            'status': 'VALID',
            'issued_at': issued_at
        })

        # 4. QR Code ke andar chhupa data taiyar karna
        qr_text = f"TICKET:{ticket_id} | NAME:{name} | EVENT:{event_name} | STATUS:VALID"
        encoded_qr = urllib.parse.quote(qr_text)
        qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_qr}"

        # 5. Sundar Printable E-Ticket (HTML File) banana
        ticket_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>E-Pass {ticket_id}</title>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #eef2ff; display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; }}
                .ticket {{ background: white; width: 360px; border-radius: 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.12); overflow: hidden; border: 2px solid #4f46e5; }}
                .top {{ background: linear-gradient(135deg, #4f46e5, #2563eb); color: white; padding: 22px; text-align: center; }}
                .body {{ padding: 24px; text-align: center; }}
                .status {{ background: #dcfce7; color: #15803d; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; }}
                .qr-frame {{ margin: 18px auto; padding: 12px; border: 2px dashed #94a3b8; border-radius: 12px; display: inline-block; }}
                .info {{ text-align: left; background: #f8fafc; padding: 14px; border-radius: 10px; font-size: 14px; line-height: 1.8; color: #334155; margin-top: 10px; }}
                .btn {{ margin-top: 18px; width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }}
                @media print {{ .btn {{ display: none; }} body {{ background: white; }} }}
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="top">
                    <h2 style="margin:0; font-size:20px;">{event_name}</h2>
                    <p style="margin:5px 0 0; font-size:12px; opacity:0.85;">Official Verified Cloud Entry Pass</p>
                </div>
                <div class="body">
                    <span class="status">● VERIFIED PASS</span>
                    <br>
                    <div class="qr-frame">
                        <img src="{qr_image_url}" width="170" height="170" alt="QR Code" />
                    </div>
                    <h3 style="margin: 0 0 10px; color:#1e1b4b; letter-spacing:1px;">{ticket_id}</h3>
                    <div class="info">
                        <b>Name:</b> {name}<br>
                        <b>Email:</b> {email}<br>
                        <b>Issued On:</b> {issued_at}
                    </div>
                    <button class="btn" onclick="window.print()">🖨️ Save as PDF / Print Pass</button>
                </div>
            </div>
        </body>
        </html>
        """

        # 6. Is E-Pass file ko Private S3 Bucket mein upload karna
        s3_file_path = f"passes/{ticket_id}.html"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_file_path,
            Body=ticket_html,
            ContentType='text/html'
        )

        # 7. S3 Presigned URL generate karna (1 hour = 3600 seconds ke liye valid)
        secure_download_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': s3_file_path},
            ExpiresIn=3600
        )

        # 8. User ko Ticket ID aur Download Link wapas bhejna
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'ticket_id': ticket_id,
                'download_url': secure_download_url
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }