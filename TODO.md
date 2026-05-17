# TODO - Loan Management System (Deployment Ready)

## Plan confirmation
- [ ] Gather existing repo state (workspace appears empty)

## Project scaffolding (create from scratch)
- [ ] Create monorepo folder structure:
  - apps/web (Next.js 15 + TS + Tailwind + ShadCN + Zustand + RHF + Zod + Framer Motion)
  - apps/api (Express + TS + JWT auth + RBAC + Mongoose)
  - shared/ (optional shared types)
- [ ] Add root tooling/config (package.json + tsconfig/base + eslint/prettier)

## Backend implementation
- [ ] Setup Express server, config, helmet/cors/rate-limit, Mongo connection
- [ ] Implement auth:
  - register/login/logout
  - forgot/reset password
  - refresh token flow
  - JWT cookies (or Authorization) + RBAC
- [ ] Implement Mongoose models: Users, BorrowerProfiles, Loans, Documents, Payments
- [ ] Implement loan lifecycle routes (sanction/reject/disburse/close)
- [ ] Implement payment routes with UTR uniqueness + auto-close rules
- [ ] Implement Dashboard routes (stats + recent loans)
- [ ] Implement BRE rules engine (age, salary, PAN format, employment mode)
- [ ] Implement notifications (stub: email + in-app) for lifecycle events
- [ ] Implement multer + Cloudinary (support local fallback)
- [ ] Add seed script to create demo users

## Frontend implementation
- [ ] Landing page per requirements (SEO, dark/light toggle, Framer Motion)
- [ ] Auth pages: login/register/forgot/reset, JWT guarded routes, role-based layout
- [ ] Borrower multi-step wizard:
  - step 2 BRE validation + clear rejection reasons
  - step 3 file upload with progress + preview
  - step 4 loan config + live SI calc
- [ ] Executive/admin dashboards:
  - SALES, SANCTION, DISBURSEMENT, COLLECTION, ADMIN modules
  - tables, search, pagination, filters, export CSV, badges
- [ ] Reusable components, error/loading/empty states, toasts, modals

## Deployment readiness
- [ ] Add .env.example for frontend and backend
- [ ] Add Dockerfile + docker-compose.yml
- [ ] Add GitHub Actions CI workflow
- [ ] Add README with full setup, API docs, demo credentials, screenshots section

## Final verification
- [ ] Run backend and frontend locally (dev build)
- [ ] Basic smoke test of auth + loan flow + RBAC

