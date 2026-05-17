Twilio OTP setup

This project now uses Twilio SMS only for phone OTP delivery.

Required env vars
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- One of:
  - `TWILIO_FROM_NUMBER`
  - `TWILIO_MESSAGING_SERVICE_SID`

Local test
```powershell
$body = @{
  phone = "917702603872"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/debug/send-otp" -Method Post -ContentType "application/json" -Body $body
```

Notes
- Set either `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`.
- If sender config is missing, the API falls back to email only.

SMS (curl) examples

Use your Account SID and Auth Token from `apps/api/.env` (don't commit secrets).

Basic SMS send (curl):

```bash
curl 'https://api.twilio.com/2010-04-01/Accounts/ACc2890e6c346536645947e4c3f8d3c280/Messages.json' -X POST \
  --data-urlencode 'To=+917702603872' \
  --data-urlencode 'From=+19894480961' \
  --data-urlencode 'Body=Your verification code is 123456' \
  -u 'ACc2890e6c346536645947e4c3f8d3c280:YOUR_AUTH_TOKEN'
```

If you are on a Twilio trial account, messages will include a "Sent from your Twilio trial account" prefix and may only deliver to verified numbers. For WhatsApp template sends use the ContentSid flow described earlier.

Webhook testing (ngrok)

1. Install and start ngrok: `ngrok http 5000`
2. In the Twilio Console, set the **Status Callback URL** for your number or messaging service to:

  `https://<your-ngrok-id>.ngrok.io/api/webhooks/twilio/message-status`

3. If your machine's external URL differs from `req.protocol://req.get('host')`, set `EXTERNAL_WEBHOOK_URL` in `apps/api/.env` to the full public URL so signature validation uses the same URL Twilio calls.

Webhook validation

- The API validates Twilio's `X-Twilio-Signature` header using `TWILIO_WEBHOOK_AUTH_TOKEN` if set; otherwise it falls back to `TWILIO_AUTH_TOKEN` from `.env`.
- To enable validation, either set `TWILIO_WEBHOOK_AUTH_TOKEN` (recommended) or ensure `TWILIO_AUTH_TOKEN` matches Twilio's auth token in your account.
