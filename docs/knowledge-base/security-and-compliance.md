# Security & Compliance

This document sets minimum expectations for operating MarketingOS safely.

## Core principles

- **Least privilege**: only grant access needed for the role.
- **Auditability**: key actions should be traceable (tickets/tasks/activity logs).
- **No secrets in Git**: never commit `.env` or real credentials.
- **Consent-first outbound**: respect opt-in for email/SMS and honor opt-outs immediately.

## Accounts & authentication

- Passwords are stored as hashed values (server-side hashing).
- Sessions are server-backed (Postgres sessions table).
- Public self-registration is forced to **client** role to prevent privilege escalation.

## Email verification

- Email verification is supported and can be enforced via `ENFORCE_EMAIL_VERIFICATION=true`.
- Admin/Manager are exempt by default; all others may be required depending on settings.

## Handling client credentials (critical)

MarketingOS contains fields that can store credential-like data (e.g., “social credentials” JSON).

Policy:

- **Do not store plaintext passwords** in MarketingOS whenever possible.
- Prefer a secure password manager/vault and store only references (who has access + where it lives).
- If you must store sensitive access details temporarily:
  - restrict access to Admin/Manager
  - remove it as soon as it’s no longer needed

## Marketing compliance (email/SMS)

- Only contact recipients who have opted in (`optInEmail`, `optInSms`).
- Keep proof of consent where required (especially for SMS).
- Follow provider requirements (Twilio toll-free verification, STOP handling, etc.).

## Operational hygiene

- Rotate secrets on schedule (session secret, API keys).
- Restrict webhook endpoints to signature-validated providers when possible.
- Keep dependencies updated and monitor for vulnerabilities.

