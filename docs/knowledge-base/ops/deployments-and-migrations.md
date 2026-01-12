# Deployments & Migrations

This is the operational runbook for building, migrating, and running MarketingOS.

## Local development

### Prereqs

- Node.js (project uses modern ESM + TSX)
- Postgres database + `DATABASE_URL`
- `.env` file (local) with at least:
  - `DATABASE_URL`
  - `SESSION_SECRET`

### Commands

- Install dependencies:
  - `npm install`
- Run dev server:
  - `npm run dev`
- Typecheck:
  - `npm run check`
- Run tests:
  - `npm test`

## Production build/run

- Build:
  - `npm run build`
- Start (runs migrations first):
  - `npm start`

## Database migrations

### Standard migration command

- `npm run migrate`

### Important notes

- The server also runs a “minimum schema” safety routine at boot (to prevent obvious 500s), but **do not rely on that** as a replacement for real migrations.
- Keep migrations idempotent and additive where possible.

## Creating admin users (operational)

Scripts exist for creating admin accounts:

- `npm run admin:create`
- `npm run admin:create2`

Never commit real credentials. Example output reference:

- `client-credentials.example.txt`

## Deployment checklist (high level)

- [ ] Environment variables set (DB, session, integrations)
- [ ] Migrations applied successfully
- [ ] App boots without 500s on health-critical routes (login, user fetch)
- [ ] Role-based access verified for Admin/Staff/Client/Creator
- [ ] Webhooks validated (Twilio/Dialpad) if enabled

