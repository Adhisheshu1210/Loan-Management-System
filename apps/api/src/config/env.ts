import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiEnvPath = path.resolve(__dirname, "../../.env");

// Always load apps/api/.env regardless of where the server process is started from.
dotenv.config({ path: apiEnvPath });

const toList = (value: string | undefined, fallback: string[]) => {
  if (!value) return fallback;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const PORT = Number(process.env.PORT ?? 5000);

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT,
  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/lms",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "refresh_secret",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  corsOrigins: toList(process.env.CORS_ORIGINS, ["http://localhost:3000"]),
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM: process.env.RESEND_FROM ?? "",
  EMAIL_USER: process.env.EMAIL_USER ?? process.env.SMTP_USER ?? "",
  EMAIL_PASS: process.env.EMAIL_PASS ?? process.env.SMTP_PASS ?? "",
  EMAIL_HOST: process.env.EMAIL_HOST ?? process.env.SMTP_HOST ?? "smtp.gmail.com",
  EMAIL_PORT: Number(process.env.EMAIL_PORT ?? process.env.SMTP_PORT ?? 587),
  EMAIL_FROM: process.env.EMAIL_FROM ?? process.env.SMTP_FROM ?? "Loan Management System <no-reply@lms.com>",
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? "Loan Management System <no-reply@lms.com>",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
  TWILIO_OTP_CONTENT_SID: process.env.TWILIO_OTP_CONTENT_SID ?? "",
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER ?? "",
  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID ?? "",
  TWILIO_WEBHOOK_AUTH_TOKEN: process.env.TWILIO_WEBHOOK_AUTH_TOKEN ?? "",
  EXTERNAL_WEBHOOK_URL: process.env.EXTERNAL_WEBHOOK_URL ?? "",
  WIREWEB_WEBHOOK_TOKEN: process.env.WIREWEB_WEBHOOK_TOKEN ?? "",
  LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR ?? "uploads",
  SERVER_ORIGIN: process.env.SERVER_ORIGIN ?? `http://localhost:${PORT}`,
};
