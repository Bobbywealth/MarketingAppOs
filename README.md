# MarketingOS

MarketingOS is a full-stack CRM + operations platform for a marketing agency and creator network.

## Documentation

- Official API docs: [`docs/OFFICIAL_API_DOCS.md`](./docs/OFFICIAL_API_DOCS.md)
- Official API base URL: `https://www.marketingteam.app/api`
- OpenAPI spec: [`docs/api-spec.yaml`](./docs/api-spec.yaml)
- Knowledge base: [`docs/knowledge-base/README.md`](./docs/knowledge-base/README.md)

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

