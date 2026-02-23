# Official API Documentation

This document is the **official API guide** for MarketingAppOs. It covers authentication, environments, conventions, and the canonical endpoint groups.

## Quick links

- Official API docs (repo): `docs/OFFICIAL_API_DOCS.md`
- OpenAPI spec (repo): `docs/api-spec.yaml`
- Production API base URL: `https://www.marketingteam.app/api`

> Source of truth: `docs/api-spec.yaml` for OpenAPI schema details and endpoint-level request/response definitions.

## 1) Environments

- **Local**: `http://localhost:5000/api`
- **Production**: `https://www.marketingteam.app/api`

## 2) Authentication

MarketingAppOs supports two authentication modes:

1. **Session authentication (web app):**
   - Login through the app and send cookies (`credentials: include` in browser fetch).
2. **API key authentication (programmatic):**
   - Send `X-API-Key: <your_api_key>` on requests.

### API key lifecycle endpoints (admin)

- `GET /api/api-keys` — list API keys (masked metadata).
- `POST /api/api-keys` — create a new API key.
- `DELETE /api/api-keys/:id` — revoke an API key.

### Auth and security notes

- Treat API keys like passwords. Never commit them to source control.
- Prefer least-privilege scopes and short expirations for integrations.
- Rotate keys immediately if leaked and monitor `lastUsedAt` metadata.
- For browser clients, use session auth with secure cookies instead of embedding API keys in frontend code.

## 3) Security and platform defaults

- Rate limiting is applied globally under `/api`.
- Stricter limiters are applied to login/auth routes (`/api/login`, `/api/auth`, etc.).
- JSON body limit is `1mb`.
- Upload limit is `200MB` for supported image/video media on `/api/upload`.

## 4) Request/response conventions

### Request

- Content type: `application/json` unless the endpoint explicitly requires multipart form data.
- Pagination (where supported): `limit` and `offset` query parameters.
- Common headers:
  - `Accept: application/json`
  - `Content-Type: application/json` (for JSON request bodies)
  - `X-API-Key: <key>` (when using API key auth)

### Response

- Success responses typically return JSON payloads with resource fields.
- Validation failures return `400`.
- Unauthorized/forbidden requests return `401`/`403`.
- Not-found responses return `404`.
- Unhandled server errors return `500`.
- Error responses generally include a `message` string and may include `errors` for validation details.

## 5) Canonical endpoint groups

Use this section as a quick map. For full schemas, examples, and parameters, use the OpenAPI file.

| Domain | Base path / examples |
|---|---|
| Authentication | `/api/login`, `/api/logout`, `/api/auth/*`, `/api/callback` |
| API Keys | `/api/api-keys` |
| Clients | `/api/clients`, `/api/clients/:id`, `/api/clients/:clientId/documents` |
| Campaigns | `/api/campaigns`, `/api/campaigns/:id` |
| Tasks | `/api/tasks`, `/api/tasks/:id`, `/api/tasks/templates` |
| Leads | `/api/leads`, `/api/leads/:id`, `/api/leads/:leadId/activities`, `/api/leads/:leadId/automations` |
| Marketing Center | `/api/marketing-center/*` |
| Social | `/api/social/accounts`, `/api/social/metrics` |
| Blog / Content | `/api/blog-posts`, `/api/admin/blog-posts` |
| Analytics | `/api/analytics/website`, `/api/analytics/metrics`, `/api/dashboard/stats` |
| Billing | `/api/invoices`, `/api/create-checkout-session` |
| Messaging | `/api/messages`, `/api/messages/conversation/:userId` |
| Tickets | `/api/tickets` |
| Files | `/api/upload`, `/uploads/:filename` |

## 6) Quickstart examples

### Session-authenticated request

```bash
curl -X GET "http://localhost:5000/api/clients" \
  -H "Accept: application/json" \
  -b "connect.sid=<session-cookie>"
```

### API key-authenticated request

```bash
curl -X GET "https://www.marketingteam.app/api/clients" \
  -H "Accept: application/json" \
  -H "X-API-Key: mka_xxxxx_xxxxx"
```

### Create an API key (admin session)

```bash
curl -X POST "http://localhost:5000/api/api-keys" \
  -H "Content-Type: application/json" \
  -b "connect.sid=<session-cookie>" \
  -d '{
    "name": "integration-key",
    "expiresInDays": 90,
    "scopes": ["api:full"]
  }'
```

## 7) OpenAPI usage

The full machine-readable contract is maintained in:

- `docs/api-spec.yaml`

You can preview it with Swagger UI:

```bash
docker run --rm -p 8080:8080 \
  -e SWAGGER_JSON=/app/api-spec.yaml \
  -v "$(pwd)/docs:/app" swaggerapi/swagger-ui
```

Then open `http://localhost:8080`.

## 8) Documentation maintenance policy

When adding or changing endpoints:

1. Update route handlers.
2. Update `docs/api-spec.yaml`.
3. Update this file if endpoint groups, auth model, limits, or global behavior changed.

