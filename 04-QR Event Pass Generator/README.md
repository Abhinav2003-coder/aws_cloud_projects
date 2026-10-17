# 🎟️ QR Event Pass Generator

A simple AWS Serverless project that generates a unique QR Code Event Pass when a user fills out the registration form.

## 🛠️ Tech Stack
* **Frontend:** HTML
* **AWS Services:** AWS Lambda (Python), Amazon DynamoDB, Amazon S3, IAM

## ⚙️ How It Works
1. User enters Name, Email, and Event in the form.
2. **AWS Lambda** creates a unique Ticket ID and saves user details in **DynamoDB**.
3. Lambda generates an E-Pass with a **QR Code** and saves it in **Amazon S3**.
4. User gets a secure **S3 Presigned URL** link to view and download their pass.

## 📂 Files
* `index.html` - Registration Form UI
* `lambda_function.py` - Backend Python Code for AWS Lambda
