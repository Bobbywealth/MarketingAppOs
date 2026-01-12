# Troubleshooting (Runbook)

## Login / session issues

### Symptoms

- “Invalid username or password”
- Login succeeds but user appears logged out immediately
- 401s on API requests after login

### Checks

- Confirm `SESSION_SECRET` is set in the environment (production will not start without it).
- Confirm `DATABASE_URL` points to the right DB and sessions table exists.
- Confirm cookies are allowed for the domain (and `COOKIE_DOMAIN` is correct if set).
- If `ENFORCE_EMAIL_VERIFICATION=true`, confirm the user is verified (or exempt role).

## Leads load then disappear

- See: [`/QUICK_FIX.md`](../../../QUICK_FIX.md)

## Push notifications not arriving (PWA)

- See: [`/diagnose-sarah-push.md`](../../../diagnose-sarah-push.md)
- Also confirm OneSignal/PWA setup:
  - [`/ONESIGNAL_SETUP.md`](../../../ONESIGNAL_SETUP.md)
  - [`/PWA_SETUP_INSTRUCTIONS.md`](../../../PWA_SETUP_INSTRUCTIONS.md)

## Twilio inbound webhooks failing

- Confirm the webhook URL is public HTTPS and matches what Twilio is calling.
- Confirm the endpoint is not behind auth.
- Review guide: [`/TWILIO_SMS_WEBHOOK_SETUP.md`](../../../TWILIO_SMS_WEBHOOK_SETUP.md)

## Dialpad webhooks failing

- Confirm Dialpad webhook URL matches deployment domain.
- Confirm DB migration for `sms_messages` is applied.
- Review guide: [`/DIALPAD_SMS_WEBHOOK_SETUP.md`](../../../DIALPAD_SMS_WEBHOOK_SETUP.md)

## SMTP email not sending

- Review guide: [`/SMTP_SETUP.md`](../../../SMTP_SETUP.md)
- Common causes:
  - wrong credentials
  - SMTP AUTH disabled
  - From address mismatch

## ScrapeCreators not updating social stats

- Confirm `SCRAPECREATORS_API_KEY` is present.
- Confirm cooldown settings (default 30 minutes).
- Review guide: [`/SCRAPECREATORS_SETUP.md`](../../../SCRAPECREATORS_SETUP.md)

