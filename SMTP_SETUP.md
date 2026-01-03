# SMTP Setup (Email Notifications)

This app can send email notifications via **SMTP** using `nodemailer`.

## What SMTP is used for in this repo

- Task due/overdue reminders (background automation)
- Other email notifications (templates exist in `server/emailService.ts`)

## Required environment variables

Set these in your production environment (or local `.env`):

- `SMTP_HOST`: SMTP server hostname (example: `smtp.sendgrid.net`)
- `SMTP_PORT`: usually `587` (STARTTLS) or `465` (TLS)
- `SMTP_SECURE`: `true` for port `465`, `false` for `587`
- `SMTP_USER`: SMTP username (sometimes an email address)
- `SMTP_PASS`: SMTP password / API key

## Optional but recommended variables

- `SMTP_FROM_NAME`: display name in the From header
- `SMTP_FROM_EMAIL`: visible From email address (can differ from `SMTP_USER` depending on provider)
- `SMTP_REPLY_TO`: Reply-To address
- `SMTP_TLS_REJECT_UNAUTHORIZED`: set to `false` only if your SMTP provider uses a self-signed certificate (not recommended)
- `APP_URL`: used in email templates for links (example: `https://www.marketingteam.app`)

## How to test SMTP (end-to-end)

1) Confirm SMTP is configured:

- `GET /api/email/test` (admin-only)

2) Send a real test email:

- `POST /api/email/send-test` (admin-only)

Body:

```json
{ "to": "you@yourdomain.com", "subject": "SMTP test" }
```

If it returns `{ success: true, messageId: "..." }` and you receive the email, SMTP is working.


