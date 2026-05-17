import crypto from "crypto";
import { Request, Response } from "express";
import { TwilioMessageStatus } from "../models/TwilioMessageStatus.js";
import twilio from "twilio";
import { env } from "../config/env.js";

// Controller responsibilities:
// - `handleMessageStatusWebhook`: handle Twilio form-encoded delivery/status callbacks.
// - `handleIncomingWhatsAppMessageWebhook`: handle JSON `message.received` events from
//    third-party providers (WireWeb, etc.).
// - `handleCombinedWebhook`: convenience handler that routes form-encoded callbacks
//    or JSON events to the appropriate handler. Prefer the public `/api/webhooks/messages/received`
//    endpoint for incoming JSON messages; `/message-status` remains for Twilio callbacks.

// Twilio will POST form-encoded parameters like MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage
export async function handleMessageStatusWebhook(req: Request, res: Response) {
  try {
    // Validate Twilio signature if possible
    const signature = req.header("X-Twilio-Signature");
    const authToken = env.TWILIO_WEBHOOK_AUTH_TOKEN || env.TWILIO_AUTH_TOKEN;
    if (authToken && signature) {
      // Determine the full URL Twilio called. Allow override via env.EXTERNAL_WEBHOOK_URL for proxy/ngrok.
      const fullUrl = env.EXTERNAL_WEBHOOK_URL || `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      // twilio.validateRequest takes (authToken, signature, url, params)
      const isValid = (twilio as any).validateRequest(authToken, signature, fullUrl, req.body);
      if (!isValid) {
        console.warn("Invalid Twilio signature for webhook", { url: fullUrl });
        return res.status(403).send("Invalid signature");
      }
    }

    const sid = req.body.MessageSid || req.body.SmsSid || req.body.SmsMessageSid;
    const status = req.body.MessageStatus || req.body.SmsStatus || req.body.MessageStatus;
    const to = req.body.To || req.body.to;
    const from = req.body.From || req.body.from;
    const errorCode = req.body.ErrorCode ? Number(req.body.ErrorCode) : null;
    const errorMessage = req.body.ErrorMessage || null;

    if (!sid) {
      return res.status(400).json({ success: false, message: "Missing MessageSid" });
    }

    await TwilioMessageStatus.create({
      sid,
      from: from || "",
      to: to || "",
      status: status || "unknown",
      errorCode,
      errorMessage,
      raw: req.body,
    });

    // Respond with 200 quickly; Twilio expects a 200 response.
    res.type("text/plain").send("OK");
  } catch (err) {
    console.error("twilio webhook error", err);
    res.status(500).json({ success: false, message: "webhook error" });
  }
}

function normalizeWhatsAppAddress(value?: string | null) {
  if (!value) return "";
  if (value.includes("@whatsapp.net")) {
    return value.replace("@whatsapp.net", "");
  }
  return value;
}

export async function handleIncomingWhatsAppMessageWebhook(req: Request, res: Response) {
  try {
    const payload = req.body ?? {};
    // Validate presence of WireWeb token if configured
    const wireToken = env.WIREWEB_WEBHOOK_TOKEN;
    if (wireToken) {
      const headerToken = (req.header("X-Wire-Webhook-Token") || req.header("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!headerToken || headerToken !== wireToken) {
        console.warn("Rejected incoming webhook: invalid WireWeb token");
        return res.status(403).json({ success: false, message: "Invalid webhook token" });
      }
    }
    const event = typeof payload.event === "string" ? payload.event : "message.received";
    const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : "";
    const messageId = typeof payload.messageId === "string" ? payload.messageId : "";
    const chat = normalizeWhatsAppAddress(typeof payload.chat === "string" ? payload.chat : "");
    const sender = normalizeWhatsAppAddress(typeof payload.sender === "string" ? payload.sender : "");
    const from = typeof payload.from === "string" ? payload.from : chat || sender;
    const text = typeof payload.text === "string" ? payload.text : "";
    const type = typeof payload.type === "string" ? payload.type : "text";
    const pushName = typeof payload.pushName === "string" ? payload.pushName : "";
    const isGroup = Boolean(payload.isGroup);
    const timestamp = typeof payload.timestamp === "string" ? payload.timestamp : new Date().toISOString();

    // Persist incoming message event so your app can process it later. Use the
    // `notification.service` to forward into the app flow if desired.
    await TwilioMessageStatus.create({
      sid: messageId || sessionId || crypto.randomUUID(),
      from,
      to: chat,
      status: event,
      errorCode: null,
      errorMessage: null,
      raw: {
        ...payload,
        chat,
        sender,
        from,
        text,
        type,
        pushName,
        isGroup,
        timestamp,
      },
    });

    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (err) {
    console.error("incoming whatsapp webhook error", err);
    res.status(500).json({ success: false, message: "webhook error" });
  }
}

// Combined handler: accept either Twilio form-encoded status callbacks or
// JSON "message.received" style payloads posted to the same endpoint.
export async function handleCombinedWebhook(req: Request, res: Response) {
  // If JSON and looks like an incoming WhatsApp event, forward to the
  // incoming handler; otherwise treat as a status callback.
  const contentType = (req.get("content-type") || "").toLowerCase();
  const body = req.body ?? {};
  const isJsonEvent = contentType.includes("application/json") && typeof body.event === "string";

  if (isJsonEvent) {
    return handleIncomingWhatsAppMessageWebhook(req, res);
  }

  return handleMessageStatusWebhook(req, res);
}

export async function listRecentStatuses(_req: Request, res: Response) {
  const items = await TwilioMessageStatus.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, data: items });
}
