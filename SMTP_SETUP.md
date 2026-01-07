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
- `EMAIL_LOGO_URL`: optional override for the logo used in email templates. If not set, the app will try to embed `logo.png` inline (best for Outlook) and fall back to `${APP_URL}/logo.png`.
- `ENFORCE_EMAIL_VERIFICATION`: when set to `true`, authenticated API routes will require `emailVerified=true` for non-exempt roles (admins/managers are exempt). Useful as a temporary safety switch while tightening auth/security.

## How to test SMTP (end-to-end)

1) Confirm SMTP is configured and check admin emails:

- `GET /api/email/test` (admin-only)
- **Check the `adminsWithEmails` field**: If your username isn't in this list, you won't receive admin alerts (like "New Client Added"). Go to your **Profile/Settings** and ensure your email is saved.

2) Send a real test email:

- `POST /api/email/send-test` (admin-only)

Body:

```json
{ "to": "you@yourdomain.com", "subject": "SMTP test" }
```

## Troubleshooting Outlook / M365

- **SMTP AUTH Enabled**: Ensure you followed the steps to enable SMTP AUTH in the M365 Admin Center.
- **App Passwords**: If you have Multi-Factor Authentication (MFA) enabled, you **must** use an App Password, not your regular password.
- **From Address**: Outlook typically requires the `SMTP_FROM_EMAIL` to match your `SMTP_USER` exactly.
- **Port 587 vs 465**: 
  - For port `587`: Set `SMTP_SECURE=false` (this app uses STARTTLS automatically).
  - For port `465`: Set `SMTP_SECURE=true`.
- **Render Logs**: Check your Render service logs for `❌ Email send error`. If you see "Authentication unsuccessful", it's almost always an incorrect password or SMTP AUTH being disabled for that specific mailbox.


