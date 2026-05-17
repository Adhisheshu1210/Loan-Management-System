import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { sendResponse } from "../utils/response.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { sendMail } from "../services/notification.service.js";

export const landingQuerySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(120, "Email is too long"),
  query: z.string().trim().min(10, "Query should be at least 10 characters").max(2000, "Query is too long"),
});

export const landing = asyncHandler(async (_req: Request, res: Response) => {
  const data = {
    title: "Loan Management System",
    sections: [
      {
        key: "features",
        title: "Features",
        items: [
          "Role-based modules: Sales, Sanction, Disbursement, Collection",
          "Secure JWT auth with refresh tokens",
          "Full audit trail and loan timeline",
          "CSV exports and pagination",
        ],
      },
      {
        key: "workflow",
        title: "Workflow",
        steps: [
          "Lead intake → Borrower profile",
          "Application → Sanction / Reject",
          "Disbursement → Collections → Auto-close",
        ],
      },
      {
        key: "testimonials",
        title: "Testimonials",
        items: [
          { name: "Finance Team", quote: "Reliable loan processing and auditable collections." },
          { name: "Operations", quote: "Fast disbursements and accurate reconciliations." },
        ],
      },
      {
        key: "faq",
        title: "FAQ",
        items: [
          { q: "How do I register?", a: "Use the Register page or ask your admin." },
          { q: "How do I export data?", a: "Use the CSV export buttons on dashboards." },
        ],
      },
    ],
    actions: { loginLabel: "Executive Login", themeToggle: true },
  };

  sendResponse(res, 200, { message: "Landing content fetched", data });
});

export const submitLandingQuery = asyncHandler(async (req: Request, res: Response) => {
  const recipient = env.EMAIL_USER || env.SMTP_USER;
  if (!recipient) {
    throw new AppError(500, "Support email is not configured");
  }

  const payload = landingQuerySchema.parse(req.body);
  const subject = `Website query from ${payload.name}`;
  const text = [
    "New landing page query received.",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    "",
    "Query:",
    payload.query,
  ].join("\n");

  await sendMail(recipient, subject, text, { replyTo: payload.email });

  sendResponse(res, 200, {
    message: "Query sent successfully",
    data: {
      deliveredTo: recipient,
      from: payload.email,
      name: payload.name,
    },
  });
});
