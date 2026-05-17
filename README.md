# Loan Management System

A production-ready loan management platform with a modern Next.js frontend, a TypeScript Express API, and shared business logic for loan workflows, borrower onboarding, OTP verification, and executive dashboards.

## Overview

This repository contains a monorepo-based loan management system designed for small to medium lending operations. It includes a public landing page, role-based dashboards, borrower workflows, loan lifecycle management, payment tracking, and deployment-ready configuration for Vercel and Render.

## Key Features

- Modern landing page and authenticated dashboard experiences
- Role-based access control for ADMIN, SALES, SANCTION, DISBURSEMENT, COLLECTION, and BORROWER users
- Borrower onboarding, document upload, and loan application flow
- Loan lifecycle support for applied, sanctioned, disbursed, closed, and rejected states
- OTP-based verification and secure JWT authentication
- Dashboard analytics, tables, filters, pagination, export, and review flows
- Cloudinary or local file upload support
- Docker, Vercel, and Render deployment configuration

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Hook Form, Zod
- Backend: Node.js, Express.js, TypeScript, MongoDB, Mongoose, JWT, Multer, Cloudinary
- Tooling: Docker, ESLint, Prettier, npm workspaces

## Project Structure

- `apps/web` - Next.js frontend application
- `apps/api` - Express API application
- `shared` - shared business logic and utilities

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB Atlas or a local MongoDB instance
- Optional: Cloudinary, SMTP, and Twilio credentials for full production functionality

## Local Setup

1. Install dependencies from the repository root.
2. Copy `.env.example` to `.env`.
3. Fill in the required values for MongoDB, JWT secrets, email, and API URLs.
4. If needed, copy `apps/api/.env.example` and `apps/web/.env.example` for app-specific references.
5. Start the frontend and backend locally.

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run dev:web
npm run dev:api
```

### Build for Production

```bash
npm run build
```

### Seed Demo Data

```bash
npm run seed
```

## Environment Variables

Use `.env.example` as the source of truth for required configuration.

### Backend Variables

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CLIENT_ORIGIN`
- `CORS_ORIGINS`
- `SERVER_ORIGIN`
- `COOKIE_SECURE`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_OTP_CONTENT_SID`
- `TWILIO_FROM_NUMBER`
- `TWILIO_MESSAGING_SERVICE_SID`
- `TWILIO_WEBHOOK_AUTH_TOKEN`
- `EXTERNAL_WEBHOOK_URL`
- `WIREWEB_WEBHOOK_TOKEN`
- `LOCAL_UPLOAD_DIR`

### Frontend Variables

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ENABLE_AUTO_REFRESH`

## Deployment

### Frontend Deployment: Vercel

Deploy `apps/web` to Vercel and set:

- `NEXT_PUBLIC_API_URL` to your production API URL
- `NEXT_PUBLIC_SITE_URL` to your Vercel domain

### Backend Deployment: Render

Deploy `apps/api` to Render and configure:

- `MONGODB_URI` from MongoDB Atlas
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- `CLIENT_ORIGIN` and `CORS_ORIGINS` to your frontend domain
- Email, Cloudinary, and Twilio variables as required

### Docker

Use `docker-compose.yml` to run the full stack locally with MongoDB, API, and web services.

## Demo Credentials

The repository includes seed data support for local demonstration and testing. Check `apps/api/src/scripts/seed.ts` for the current seeded accounts and roles.

## API Notes

The backend exposes authentication, borrower, loan, payment, dashboard, admin, and webhook routes under `/api`.

## Screenshots

Add final screenshots of the landing page, borrower flow, and dashboards here after UI review.

## Author

Angothu Adhisheshu

## License

MIT explicit license is included in this repository. Add one before public distribution if needed.

