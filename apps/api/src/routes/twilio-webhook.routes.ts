import { Router } from "express";
import { handleIncomingWhatsAppMessageWebhook, handleMessageStatusWebhook, handleCombinedWebhook, listRecentStatuses } from "../controllers/twilio-webhook.controller.js";

export const twilioWebhookRouter = Router();

// Twilio will POST form-urlencoded webhooks; ensure body parser supports urlencoded (app.ts does)
// Accept both Twilio form callbacks and JSON "message.received" payloads
// on the same webhook URL for easier integration with external providers.
// Preferred: receive both delivery callbacks and third-party JSON "message.received"
// events on the single `/message-status` endpoint via the combined handler.
// Some providers post JSON to a dedicated path; keep `/message-received` for
// backwards compatibility but prefer `/api/webhooks/messages/received` (see app.ts).
twilioWebhookRouter.post("/message-status", handleCombinedWebhook);

// NOTE: `/message-received` is kept for backward compatibility with earlier
// integrations that posted JSON directly to the Twilio router. New integrations
// (WireWeb, etc.) should use `/api/webhooks/messages/received` instead.
twilioWebhookRouter.post("/message-received", handleIncomingWhatsAppMessageWebhook);

// Optional: list recent statuses for debugging
twilioWebhookRouter.get("/recent", listRecentStatuses);
