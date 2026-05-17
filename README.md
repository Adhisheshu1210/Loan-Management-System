# Loan Management System

A production-ready Loan Management System with a modern fintech landing page, borrower onboarding workflow, and role-based executive dashboards.

## 📺 Demo Video

https://www.youtube.com/watch?v=JQ278W8h_MQ

---

# 🚀 Features

## Frontend
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Framer Motion animations
- Zustand state management
- React Hook Form + Zod validation
- Responsive fintech UI
- Reusable component architecture

## Backend
- Express.js + TypeScript REST API
- JWT Authentication
- bcrypt password hashing
- Role-Based Access Control (RBAC)
- MongoDB + Mongoose
- Multer file uploads
- Cloudinary integration
- OTP verification support

## Business Features
- Borrower onboarding flow
- BRE validation engine
- Salary slip uploads
- Loan lifecycle management
- Payment collection tracking
- Dashboard analytics
- Search, filters, pagination, exports
- Executive role dashboards

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

---

# 🛠️ Tech Stack

## Frontend
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- Axios
- React Hook Form
- Zod

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

## Deployment
- Vercel (Frontend)
- Render/Railway (Backend)
- MongoDB Atlas (Database)

---

# 📁 Project Structure

```bash
apps/
 ├── web/        # Frontend application
 ├── api/        # Backend application

shared/          # Shared business logic and utilities
```

---

# ⚙️ Setup Instructions

## 1. Clone Repository

```bash
git clone https://github.com/Adhisheshu1210/Loan-Management-System.git
cd Loan-Management-System
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Create Environment File

```bash
cp .env.example .env
```

---

# 🔑 Environment Variables

## Backend Variables

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

---

## Frontend Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Loan Management System
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_AUTO_REFRESH=true
```

---

# ▶️ Run Locally

## Start Frontend

```bash
npm run dev:web
```

## Start Backend

```bash
npm run dev:api
```

---

# 🏗️ Build for Production

```bash
npm run build
```

---

# 🌱 Seed Demo Data

```bash
npm run seed
```

---

# 👤 Demo Credentials

## Admin

```txt
Email: admin@lms.com
Password: Admin@123
```

## Sales

```txt
Email: sales@lms.com
Password: Sales@123
```

## Sanction

```txt
Email: sanction@lms.com
Password: Sanction@123
```

## Disbursement

```txt
Email: disbursement@lms.com
Password: Disbursement@123
```

## Collection

```txt
Email: collection@lms.com
Password: Collection@123
```

## Borrower

```txt
Email: borrower@lms.com
Password: Borrower@123
```

---

# 🧾 BRE Rules

Loan applications are rejected if:

- Age is below 23 or above 50
- Salary is below ₹25,000
- PAN format is invalid
- Employment status is unemployed

## PAN Regex

```regex
^[A-Z]{5}[0-9]{4}[A-Z]{1}$
```

---

# 📡 API Documentation

## Auth APIs

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

---

## Borrower APIs

```http
POST /api/borrower/profile
POST /api/borrower/upload
POST /api/borrower/apply-loan
GET  /api/borrower/my-loans
```

---

## Loan APIs

```http
GET    /api/loans
GET    /api/loans/:id
PATCH  /api/loans/:id/sanction
PATCH  /api/loans/:id/reject
PATCH  /api/loans/:id/disburse
PATCH  /api/loans/:id/close
```

---

## Payment APIs

```http
POST /api/payments
GET  /api/payments/:loanId
```

---

## Dashboard APIs

```http
GET /api/dashboard/stats
GET /api/dashboard/recent-loans
```

---

# 🐳 Docker Setup

## Start Full Stack

```bash
docker-compose up --build
```

---

# 🚀 Deployment

## Frontend Deployment (Vercel)

Deploy `apps/web` and configure:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
```

---

## Backend Deployment (Render/Railway)

Deploy `apps/api` and configure:

```env
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_ORIGIN=
CORS_ORIGINS=
```

---

# 🔐 Security Features

- JWT Authentication
- Refresh Token Rotation
- Password Hashing
- RBAC Authorization
- Secure Cookies
- Helmet Protection
- CORS Protection
- Input Validation
- MongoDB Injection Prevention
- XSS Protection
- API Rate Limiting

---

# 🎨 UI Features

- Modern Fintech Landing Page
- Dark/Light Theme
- Responsive Design
- Animated UI
- Dashboard Analytics
- Charts and Graphs
- Data Tables
- Filters and Search
- Toast Notifications
- Skeleton Loaders
- Modal Dialogs

---

# 📱 SMS OTP Configuration (Twilio)

Add these variables to `apps/api/.env`:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
```

Restart the API server after updating environment variables.

---

# 📸 Screenshots

Add screenshots here:
- Landing Page
- Borrower Workflow
- Admin Dashboard
- Executive Modules
- Loan Analytics

---

# 👨‍💻 Author

Angothu Adhisheshu

GitHub:
https://github.com/Adhisheshu1210

---

# 📄 License

This project is for educational and assessment purposes.

MIT License added for public distribution.

---

# ✅ GitHub Actions Fix

Your GitHub Actions warning is because Node.js 20 actions are deprecated.

Update your workflow file:

```yaml
uses: actions/setup-node@v4
with:
  node-version: 22
```

Also add:

```yaml
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
```

---

# ✅ Lint Fix

Run:

```bash
npm run lint
```

Fix:
- unused imports
- TypeScript `any` types
- missing dependencies in hooks
- formatting issues

Then run:

```bash
npm run format
```

Commit again:

```bash
git add .
git commit -m "fix: resolved lint and github actions issues"
git push
```
