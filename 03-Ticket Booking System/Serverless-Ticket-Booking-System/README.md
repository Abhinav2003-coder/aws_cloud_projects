# 🎟️ Serverless Ticket Booking System

An event-driven serverless backend system designed to handle event listings and seat bookings efficiently.

## 🚀 Tech Stack & Services
* **API Layer:** Amazon API Gateway
* **Compute:** AWS Lambda (Node.js)
* **Database:** Amazon DynamoDB (`EventsTable` & `BookingsTable`)
* **Frontend:** HTML & JavaScript web interface

## ✨ Key Highlights
* Prevents race conditions and overbooking during high-concurrency requests using DynamoDB Conditional Expressions.

## 📂 Project Structure
* `frontend/` - Event dashboard and ticket booking interface
* `backend/` - Node.js Lambda router handler
