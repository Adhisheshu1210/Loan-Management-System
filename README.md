# Loan Management System

A production-ready Loan Management System built with a modern fintech UI, scalable monorepo architecture, and secure role-based workflows for borrowers and internal loan operations teams.

This platform enables borrowers to apply for loans online while internal executives manage the complete loan lifecycle from application to repayment and closure.

---

# Features

## Borrower Portal
- User registration and login
- JWT authentication with refresh tokens
- OTP verification support
- Multi-step borrower onboarding flow
- Business Rule Engine (BRE) eligibility validation
- Salary slip upload (PDF/JPG/PNG)
- Loan application with live interest calculation
- Loan tracking dashboard
- Responsive borrower experience

## Executive Dashboard

##Role-based dashboard modules for:
- ADMIN
- SALES
- SANCTION
- DISBURSEMENT
- COLLECTION

## Features include:

- Loan review workflows
- Approval and rejection management
- Disbursement processing
- Payment collection
- Outstanding balance tracking
- Dashboard analytics
- Search, filters, pagination, and exports

## Loan Lifecycle

Supported statuses:
- APPLIED
- SANCTIONED
- DISBURSED
- CLOSED
- REJECTED

## Security
- JWT authentication
- bcrypt password hashing
- Role-Based Access Control (RBAC)
- Protected API routes
- Helmet security middleware
- Rate limiting
- Input validation and sanitization
- Secure file upload handling

## Deployment Ready
- Vercel frontend deployment
- Render/Railway backend deployment
- MongoDB Atlas integration
- Docker and Docker Compose support
- CI/CD ready structure

---

# Tech Stack

## Frontend
- Next.js 15 (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- React Hook Form
- Zod
- Axios
- ShadCN UI

## Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- Cloudinary

## DevOps & Tooling
- Docker
- Docker Compose
- ESLint
- Prettier
- npm Workspaces

---

# Project Structure

```bash
loan-management-system/
│
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Express backend
│
├── shared/                   # Shared business logic/types
│
├── docker-compose.yml
├── package.json
├── .env.example
└── README.md
```
# Prerequisites

## Before starting, ensure you have:

Node.js 20+
npm 10+
MongoDB Atlas or local MongoDB
Cloudinary account (optional)
SMTP credentials (optional)
Twilio credentials (optional)

# Installation

## Clone Repository

git clone https://github.com/your-username/loan-management-system.git
cd loan-management-system
Install Dependencies
npm install

## Environment Setup

Create a .env file from .env.example.

cp .env.example .env

#Environment Variables

## Backend Variables

MONGODB_URI=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_ORIGIN=
CORS_ORIGINS=
SERVER_ORIGIN=

COOKIE_SECURE=false

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_USER=
EMAIL_PASS=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_FROM=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=

LOCAL_UPLOAD_DIR=uploads

## Frontend Variables

NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Loan Management System
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_AUTO_REFRESH=true

Running the Project
Start Frontend
npm run dev:web
Start Backend
npm run dev:api
Build for Production
npm run build
Seed Demo Accounts
npm run seed
Demo Credentials
Admin
Email: admin@lms.com
Password: Admin@123
Sales
Email: sales@lms.com
Password: Sales@123
Sanction
Email: sanction@lms.com
Password: Sanction@123
Disbursement
Email: disbursement@lms.com
Password: Disbursement@123
Collection
Email: collection@lms.com
Password: Collection@123
Borrower
Email: borrower@lms.com
Password: Borrower@123
Borrower Workflow
Register/Login
Complete Personal Details
BRE Eligibility Validation
Upload Salary Slip
Configure Loan
Apply for Loan
BRE Rules

# Loan application is rejected if:

Age is below 23 or above 50
Salary is below ₹25,000
PAN format is invalid
Employment status is unemployed

## PAN Regex:

^[A-Z]{5}[0-9]{4}[A-Z]{1}$

# Loan Lifecycle

APPLIED
   ↓
SANCTIONED
   ↓
DISBURSED
   ↓
CLOSED

# Rejected applications move to:

## REJECTED

API Documentation
Auth APIs
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me

## Borrower APIs

POST /api/borrower/profile
POST /api/borrower/upload
POST /api/borrower/apply-loan
GET  /api/borrower/my-loans

## Loan APIs

GET    /api/loans
GET    /api/loans/:id
PATCH  /api/loans/:id/sanction
PATCH  /api/loans/:id/reject
PATCH  /api/loans/:id/disburse
PATCH  /api/loans/:id/close

## Payment APIs

POST /api/payments
GET  /api/payments/:loanId

## Dashboard APIs
GET /api/dashboard/stats
GET /api/dashboard/recent-loans

## Docker Setup

Start Full Stack
docker-compose up --build

## Deployment

Frontend Deployment (Vercel)

# Deploy apps/web and configure:

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
Backend Deployment (Render/Railway)

# Deploy apps/api and configure:

MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_ORIGIN=
CORS_ORIGINS=
Security Features
JWT Authentication
Refresh Token Rotation
Password Hashing
RBAC Authorization
Secure Cookies
Helmet Protection
CORS Protection
Input Validation
MongoDB Injection Prevention
XSS Protection
API Rate Limiting
UI Features
Modern Fintech Landing Page
Dark/Light Theme
Responsive Design
Animated UI
Dashboard Analytics
Charts and Graphs
Data Tables
Filters and Search
Toast Notifications
Skeleton Loaders
Modal Dialogs
Future Improvements
AI Credit Scoring
Real-time Notifications
Razorpay/Stripe Integration
Audit Logs
Multi-language Support
Mobile App
WebSocket Updates
Screenshots

# Add screenshots here:

Landing Page
Borrower Flow
Admin Dashboard
Executive Modules
Loan Analytics

# Author

Angothu Adhisheshu

# License

This project is for educational and assessment purposes.

Add an MIT License before public distribution if required.
