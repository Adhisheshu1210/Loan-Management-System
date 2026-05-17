import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { join } from "path";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { borrowerRouter } from "./routes/borrower.routes.js";
import { loanRouter } from "./routes/loan.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { debugRouter } from "./routes/debug.routes.js";
import { twilioWebhookRouter } from "./routes/twilio-webhook.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { handleIncomingWhatsAppMessageWebhook } from "./controllers/twilio-webhook.controller.js";

export const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = Array.from(new Set([...(env.corsOrigins ?? []), env.CLIENT_ORIGIN].filter(Boolean)));
      // allow non-browser requests (like curl) with no origin header
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      console.warn("CORS blocked origin:", origin, "allowed:", allowed);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(join(process.cwd(), env.LOCAL_UPLOAD_DIR)));
// Apply rate limiting: strict in production, relaxed in development.
if (env.NODE_ENV === "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 150,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
} else {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
}

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Loan Management System API is healthy" });
});

app.use("/api/auth", authRouter);
app.use("/api/borrower", borrowerRouter);
app.use("/api/loans", loanRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/debug", debugRouter);
app.use("/api/webhooks/twilio", twilioWebhookRouter);
app.use("/api/public", publicRouter);

// Public endpoint for providers that send `message.received` events to a
// dedicated URL. This accepts JSON payloads like the WireWeb example and
// delegates to the existing incoming handler.
app.post("/api/webhooks/messages/received", express.json(), handleIncomingWhatsAppMessageWebhook);

app.use(notFound);
app.use(errorHandler);
