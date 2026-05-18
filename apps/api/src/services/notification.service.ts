import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import twilio from "twilio";
import { AppError } from "../utils/app-error.js";
import { toE164PhoneNumber } from "../shared/phone.js";

export async function createNotification(userId: string, title: string, message: string, type: string) {
  return Notification.create({ userId, title, message, type });
}

export async function sendMail(to: string, subject: string, text: string, options?: { replyTo?: string }) {
  const user = env.EMAIL_USER || env.SMTP_USER;
  const pass = env.EMAIL_PASS || env.SMTP_PASS;
  const host = env.EMAIL_HOST || env.SMTP_HOST || "smtp.gmail.com";
  const port = env.EMAIL_PORT || env.SMTP_PORT || 587;
  const timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS ?? 10000);

  if (!host || !user || !pass) {
    console.log(`[mail] ${to}: ${subject} - ${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  });

  try {
    await transporter.sendMail({ from: env.EMAIL_FROM || env.SMTP_FROM, to, subject, text, replyTo: options?.replyTo });
  } catch (error) {
    console.error("[mail] failed to send", { to, subject, host, port, error });
    throw new AppError(502, "Email delivery is temporarily unavailable");
  }
}

export async function sendSms(to: string, message: string, opts?: { contentSid?: string; contentVariables?: any }) {
  // Allow callers to pass 'whatsapp:+91...' or plain numbers. Normalize plain numbers to E.164.
  let recipient = to;
  const isToWhatsApp = typeof to === "string" && to.startsWith("whatsapp:");
  if (!isToWhatsApp) {
    const e164 = toE164PhoneNumber(to);
    if (!e164) {
      throw new AppError(400, "Invalid phone number");
    }
    recipient = e164;
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new AppError(500, "Twilio credentials are missing");
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  // If configured sender uses WhatsApp, ensure recipient also uses the whatsapp: prefix.
  const fromIsWhatsApp = !!env.TWILIO_FROM_NUMBER && env.TWILIO_FROM_NUMBER.startsWith("whatsapp:");
  if (fromIsWhatsApp && !recipient.startsWith("whatsapp:")) {
    recipient = `whatsapp:${recipient}`;
  }

  const createParams: any = { to: recipient };

  if (env.TWILIO_MESSAGING_SERVICE_SID) {
    createParams.messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;
  } else if (env.TWILIO_FROM_NUMBER) {
    createParams.from = env.TWILIO_FROM_NUMBER;
  }

  // If a template/content SID is provided via opts or env, use template send for WhatsApp
  const contentSid = opts?.contentSid || env.TWILIO_OTP_CONTENT_SID;
  if (contentSid) {
    createParams.contentSid = contentSid;
    if (opts?.contentVariables) {
      // Twilio expects a JSON string for ContentVariables
      createParams.contentVariables = typeof opts.contentVariables === "string" ? opts.contentVariables : JSON.stringify(opts.contentVariables);
    }
  } else {
    createParams.body = message;
  }

  if (createParams.from || createParams.messagingServiceSid) {
    await client.messages.create(createParams);
    return;
  }

  throw new AppError(500, "Twilio sender is missing; set TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID");
}

export async function notifyUser(userId: string, title: string, message: string, type: string) {
  const user = await User.findById(userId).lean();
  await createNotification(userId, title, message, type);
  if (user?.email) {
    await sendMail(user.email, title, message);
  }
}
