# MarketingOS

MarketingOS is a full-stack CRM + operations platform for a marketing agency and creator network.

## Knowledge base

- Start here: [`docs/knowledge-base/README.md`](./docs/knowledge-base/README.md)
- API contract: [`docs/api-spec.yaml`](./docs/api-spec.yaml)

## API access model

- API integrations can create, update, and delete records when the calling user or key has the required permissions.
- Access should be treated as role-based and scoped; use least-privilege credentials for automation and external tools.

## Local development

### Prereqs

- Node.js
- Postgres `DATABASE_URL`
- `.env` file with at least:
  - `DATABASE_URL`
  - `SESSION_SECRET`

### Commands

- Install:
  - `npm install`
- Run dev:
  - `npm run dev`
- Typecheck:
  - `npm run check`
- Test:
  - `npm test`

## Production build/run

- Build:
  - `npm run build`
- Start:
  - `npm start`
