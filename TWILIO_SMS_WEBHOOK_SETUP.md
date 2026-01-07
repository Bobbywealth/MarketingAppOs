# 📲 Twilio SMS/MMS Webhook Setup (Marketing Team App)

This app exposes a **public** webhook endpoint that accepts **Twilio Messaging** `POST` requests and responds with **valid TwiML XML**.

## ✅ Webhook endpoint

- **Incoming messages (SMS/MMS)** (any of these):
  - `POST /api/webhooks/twilio` (recommended if your app standardizes on `/api`)
  - `POST /api/webhooks/twilio/sms`
  - `POST /webhooks/twilio/sms`

Example full URL:
- `https://YOUR_PUBLIC_DOMAIN/api/webhooks/twilio`

## ✅ Configure in Twilio Console

1. Go to **Twilio Console → Phone Numbers → Manage → Active numbers**
2. Click your Twilio phone number
3. Scroll to **Messaging**
4. Set **A MESSAGE COMES IN** to:
   - **Webhook**
   - **URL**: `https://YOUR_PUBLIC_DOMAIN/api/webhooks/twilio`
   - **Method**: `HTTP POST`
5. Save

## ✅ Environment variables

Set these in your hosting provider (Render/Replit/etc.):

- **Outbound SMS (already used by the app)**:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

- **Inbound webhook signature validation (recommended)**:
  - `TWILIO_WEBHOOK_BASE_URL=https://YOUR_PUBLIC_DOMAIN`
    - This should match your public origin (scheme + host). The server will append the incoming path for validation.
  - `TWILIO_SIGNATURE_VALIDATION=true` (optional)
    - When set to `true`, the server will **require** signature validation for inbound webhooks (returns `403` if missing/invalid).

If `TWILIO_AUTH_TOKEN` + `X-Twilio-Signature` are present, the server will validate the webhook request and return `403` if invalid.

## ✅ Response behavior

The endpoint returns **HTTP 200** with **valid TwiML XML** (even when downstream systems fail) to prevent Twilio retry storms.

Signature validation failures return **HTTP 403**.

## ✅ “Accessible from the internet” checklist

Twilio cannot reach `localhost` or private networks. Ensure:

- Your server is deployed to a **public HTTPS** URL (Render/Replit/etc.)
- Your platform routes inbound traffic to `process.env.PORT` (**this app listens on `PORT`**, not `APP_PORT`)
- The path `POST /webhooks/twilio/sms` is not blocked by auth or IP restrictions

## 🧪 Quick verification

1. In Twilio, use **Messaging Logs** to view webhook delivery attempts.
2. On the server, you should see logs like:
   - `📨 Twilio SMS/MMS Webhook received: {...}`

---

Implementation: `server/routes.ts` → `app.post("/webhooks/twilio/sms", ...)`

## ✅ Toll-free verification (submission details)

These are the details submitted in Twilio Console → **Messaging → Toll-Free Verification**:

- **Email for Notifications**: `business@marketingteam.app`
- **Estimated Monthly Volume**: `10`
- **Opt-In Type**: `Web Form`
- **Messaging Use Case Categories**: `Marketing`
- **Proof of Consent URL**: `https://www.marketingteam.app/privacy`
- **Use Case Description**: “Marketing Team App sends marketing and promotional messages to users who have opted in through our web platform. Messages include campaign updates, special offers, and account notifications.”
- **Sample Message**: “Hi! Your campaign is live! Check out exclusive offers and updates. Reply STOP to opt out.”
- **Privacy Policy URL**: `https://www.marketingteam.app/privacy`
- **Terms & Conditions URL**: `https://www.marketingteam.app/terms`
- **Terms of Service Agreement**: checked ✅

Recommended production webhook URL to paste into Twilio:
- `https://www.marketingteam.app/api/webhooks/twilio`

