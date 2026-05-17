
# Loan Management System

A production-ready loan management system with a modern fintech landing page, borrower onboarding flow, and role-based executive dashboards.

# Youtube demo link: https://www.youtube.com/watch?v=JQ278W8h_MQ 

## Features

- Next.js 15 App Router frontend with Tailwind CSS, Framer Motion, and reusable UI components
- Express.js + TypeScript REST API with JWT auth, bcrypt, RBAC, and Mongoose
- MongoDB-backed borrower profiles, loans, documents, payments, notifications, and refresh sessions
- BRE validation on the backend and mirrored frontend UX validation
- Loan lifecycle support: APPLIED → SANCTIONED → DISBURSED → CLOSED, plus REJECTED
- Email OTP verification for registration and login
- Salary slip upload with Cloudinary or local storage fallback
- Dashboard analytics with tables, charts, filters, search, pagination, export, and modals
- Docker, CI, Vercel, and Render-ready configuration

## Tech Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Hook Form, Zod, Axios
- Backend: Node.js, Express.js, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Multer, Cloudinary
- Deployment: Vercel for web, Render/Railway for API, MongoDB Atlas for database

## Project Structure

- `apps/web` - frontend application
- `apps/api` - backend application
- `shared` - shared pure business logic

## Setup

1. Install dependencies at the repository root.
2. Create the root environment file by copying `.env.example` to `.env`.
3. Fill in the values in `.env`, especially MongoDB, JWT, email, and SMS settings.
4. If you prefer per-app env files, copy `apps/api/.env.example` and `apps/web/.env.example` too.
5. Start MongoDB locally or use MongoDB Atlas.
6. Run the web and API apps.

### How to create the `.env` file

1. Copy the sample file:

```bash
cp .env.example .env
```

2. Open `.env` and set these values:
	- `MONGODB_URI`
	- `JWT_ACCESS_SECRET`
	- `JWT_REFRESH_SECRET`
	- `CLIENT_ORIGIN`
	- `CORS_ORIGINS`
	- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM`
	- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

3. Save the file and restart the API server.

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev:web
npm run dev:api
```

### Build

```bash
npm run build
```

### Seed demo data

```bash
npm run seed
```

## Environment Variables

Use the root `.env.example` as the canonical sample. Important variables:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_ORIGIN`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CLOUDINARY_*`
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `SMTP_*`

## API Documentation

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/secondary-email/start`
- `POST /api/auth/secondary-email/verify`
- `GET /api/auth/me`

### Borrower

- `POST /api/borrower/profile`
- `POST /api/borrower/upload`
- `POST /api/borrower/apply-loan`
- `GET /api/borrower/my-loans`

### Loans

- `GET /api/loans`
- `GET /api/loans/:id`
- `PATCH /api/loans/:id/sanction`
- `PATCH /api/loans/:id/reject`
- `PATCH /api/loans/:id/disburse`
- `PATCH /api/loans/:id/close`

### Payments

- `POST /api/payments`
- `GET /api/payments/:loanId`

### Dashboard

- `GET /api/dashboard/stats`
- `GET /api/dashboard/recent-loans`

## Demo Credentials

- Admin: `admin@lms.com` / `Admin@123`
- Sales: `sales@lms.com` / `Sales@123`
- Sanction: `sanction@lms.com` / `Sanction@123`
- Disbursement: `disbursement@lms.com` / `Disbursement@123`
- Collection: `collection@lms.com` / `Collection@123`
- Borrower: `borrower@lms.com` / `Borrower@123`

## Deployment

### Frontend

- Deploy `apps/web` to Vercel.
- Set `NEXT_PUBLIC_API_URL` to the Render/Railway API URL.

### Backend

- Deploy `apps/api` to Render or Railway.
- Set MongoDB Atlas, JWT secrets, client origin, CORS origins, and SMTP values.

### Docker

- Build and run the full stack with `docker-compose.yml`.

## Screenshots

Add screenshots of the landing page, borrower wizard, and dashboards here after final visual QA.

## SMS OTP configuration (Twilio)

Add these environment variables to `apps/api/.env` or your deployment environment and restart the API:

- `TWILIO_ACCOUNT_SID` — Twilio Account SID.
- `TWILIO_AUTH_TOKEN` — Twilio Auth Token.
- `TWILIO_FROM_NUMBER` — Twilio sender number, or set `TWILIO_MESSAGING_SERVICE_SID` instead.
- `TWILIO_MESSAGING_SERVICE_SID` — Optional Twilio messaging service SID.


# Author

Angothu Adhisheshu

# License

This project is for educational and assessment purposes.

Added an MIT License for public distribution.
