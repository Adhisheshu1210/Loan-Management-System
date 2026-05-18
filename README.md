# Loan Management System

A production-ready loan management platform with a modern fintech landing page, borrower onboarding workflows, and role-based executive dashboards.

## Demo

Watch the product walkthrough on YouTube:

https://www.youtube.com/watch?v=JQ278W8h_MQ

## Highlights

- Next.js 15 App Router frontend with a responsive fintech UI
- Express.js + TypeScript REST API with JWT authentication and RBAC
- Borrower onboarding, document upload, and loan application flows
- Loan lifecycle management from application through closure
- Payment collection tracking, dashboard analytics, filters, and exports
- OTP verification support with email, SMS, and Twilio integration
- Docker, Vercel, Render, and Railway deployment ready

## Architecture

This repository uses an npm workspaces monorepo:

- `apps/web` for the customer-facing Next.js application
- `apps/api` for the Express API and backend services
- `shared` for business rules and utilities shared across apps

## Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- React Hook Form
- Zod
- Axios

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- Cloudinary

### Tooling

- npm workspaces
- ESLint
- Prettier
- Docker

## Core Features

### Frontend Experience

- Modern fintech landing page
- Borrower registration and login flows
- Role-based navigation and dashboards
- Reusable component architecture
- Animated UI with Framer Motion
- Dark and light theme support

### Backend Capabilities

- JWT access and refresh token authentication
- Password hashing with bcrypt
- Role-based access control for ADMIN, SALES, SANCTION, DISBURSEMENT, COLLECTION, and BORROWER
- MongoDB-backed persistence with Mongoose models
- File uploads via Multer and Cloudinary or local storage
- OTP and verification workflows

### Business Workflows

- Borrower onboarding and profile management
- BRE validation engine
- Salary slip and identity document uploads
- Loan review, sanction, disbursement, and closure flows
- Payment collection tracking and repayment views
- Dashboard analytics, search, pagination, and exports

## Loan Lifecycle

```txt
APPLIED
   ↓
SANCTIONED
   ↓
DISBURSED
   ↓
CLOSED
```

Rejected applications move to:

```txt
REJECTED
```

## Repository Structure

```bash
apps/
├── api/   # Express API application
└── web/   # Next.js frontend application

shared/    # Shared business logic and utilities
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB Atlas or a local MongoDB instance
- Optional: Cloudinary, SMTP, and Twilio credentials for full production functionality

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment files

Copy the root sample environment file and fill in the values required for your setup.

```bash
cp .env.example .env
```

If you prefer app-specific env files, you can also refer to the app-level examples where provided.

### 3. Start the app locally

```bash
npm run dev:web
npm run dev:api
```

## Available Scripts

Run these from the repository root:

```bash
npm run dev:web   # Start the web app
npm run dev:api   # Start the API server
npm run build     # Build web and API
npm run lint      # Lint web and API
npm run seed      # Seed demo data through the API workspace
```

## Environment Variables

Use `.env.example` as the source of truth for required configuration.

### Backend

```env
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
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Loan Management System
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_AUTO_REFRESH=true
```

## API Surface

### Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/secondary-email/start
POST /api/auth/secondary-email/verify
GET  /api/auth/me
```

### Borrower

```http
POST /api/borrower/profile
POST /api/borrower/upload
POST /api/borrower/apply-loan
GET  /api/borrower/my-loans
```

### Loans

```http
GET    /api/loans
GET    /api/loans/:id
PATCH  /api/loans/:id/sanction
PATCH  /api/loans/:id/reject
PATCH  /api/loans/:id/disburse
PATCH  /api/loans/:id/close
```

### Payments

```http
POST /api/payments
GET  /api/payments/:loanId
```

### Dashboard

```http
GET /api/dashboard/stats
GET /api/dashboard/recent-loans
```

## Demo Credentials

These credentials are intended for local development and demos.

- Admin: `admin@lms.com` / `Admin@123`
- Sales: `sales@lms.com` / `Sales@123`
- Sanction: `sanction@lms.com` / `Sanction@123`
- Disbursement: `disbursement@lms.com` / `Disbursement@123`
- Collection: `collection@lms.com` / `Collection@123`
- Borrower: `borrower@lms.com` / `Borrower@123`

## BRE Rules

Loan applications are rejected if any of the following fail:

- Age is below 23 or above 50
- Salary is below ₹25,000
- PAN format is invalid
- Employment status is unemployed

### PAN Regex

```regex
^[A-Z]{5}[0-9]{4}[A-Z]{1}$
```

## Docker

Start the full stack locally with:

```bash
docker-compose up --build
```

## Deployment

### Frontend: Vercel

Deploy `apps/web` and configure:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
```

### Backend: Render or Railway

Deploy `apps/api` and configure:

```env
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_ORIGIN=
CORS_ORIGINS=
```

### Database: MongoDB Atlas

Use MongoDB Atlas for managed production storage, or point `MONGODB_URI` to a trusted MongoDB deployment.

## SMS OTP Setup

If you enable Twilio-based OTP delivery, add these variables to your API environment:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
```

Restart the API server after updating the values.

## Screenshots

Add screenshots here as the UI is finalized:

- Landing page
- Borrower onboarding flow
- Admin dashboard
- Executive dashboards
- Loan analytics

## Author

Angothu Adhisheshu

GitHub: https://github.com/Adhisheshu1210

## License

MIT License. See [LICENSE](LICENSE) for the full text.