# Integrations & Setup (Operations)

This doc is the “map” of external systems MarketingOS integrates with.

## Authentication / sessions

- Session-based auth requires `SESSION_SECRET` (server will refuse to start in production if missing).

## Database (Postgres)

- Required: `DATABASE_URL`
- Migrations live in `migrations/`

## Email (SMTP notifications)

Used for reminders and admin alerts.

- Setup guide: [`/SMTP_SETUP.md`](../../../SMTP_SETUP.md)
- Key env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `APP_URL` (and optional From/Reply-To vars)

## Email (Microsoft / Graph inbox integration)

MarketingOS includes Microsoft Graph integration for company email accounts.

- Key concept: users can connect email accounts; background sync runs periodically.
- If adding this to a new environment, document tenant/app registration details internally.

## SMS (Twilio)

Two concerns:

- **Outbound** (sending): requires Twilio account env vars.
- **Inbound** (receiving): Twilio webhook endpoints must be configured publicly.

Guide: [`/TWILIO_SMS_WEBHOOK_SETUP.md`](../../../TWILIO_SMS_WEBHOOK_SETUP.md)

## SMS (Dialpad webhook)

Captures Dialpad SMS events into `sms_messages`.

Guide: [`/DIALPAD_SMS_WEBHOOK_SETUP.md`](../../../DIALPAD_SMS_WEBHOOK_SETUP.md)

## Push notifications (Web/PWA)

If you are using OneSignal for web push:

- Guide: [`/ONESIGNAL_SETUP.md`](../../../ONESIGNAL_SETUP.md)

PWA install requirements and icons:

- Guide: [`/PWA_SETUP_INSTRUCTIONS.md`](../../../PWA_SETUP_INSTRUCTIONS.md)

## Calendar (Google Calendar sync)

Guide: [`/GOOGLE_CALENDAR_SETUP.md`](../../../GOOGLE_CALENDAR_SETUP.md)

## Social analytics (ScrapeCreators)

Replaces manual social stats with automated snapshots.

- Guide: [`/SCRAPECREATORS_SETUP.md`](../../../SCRAPECREATORS_SETUP.md)
- Key env vars: `SCRAPECREATORS_API_KEY`, `SOCIAL_REFRESH_COOLDOWN_MINUTES`

## Payments / billing (Stripe)

- Clients can link to Stripe via `stripeCustomerId` / `stripeSubscriptionId`.
- Admin dashboards and subscription endpoints exist for monitoring.

## App stores (iOS/Android wrapper)

MarketingOS can be shipped as a native wrapper via Capacitor.

- Guide: [`/APP_STORE_READY.md`](../../../APP_STORE_READY.md)
- Key env var: `VITE_API_BASE_URL` (required inside native webviews)

