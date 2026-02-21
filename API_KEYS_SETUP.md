# API Keys Setup

MarketingAppOs now supports API keys for programmatic access to protected `/api/*` endpoints that use `isAuthenticated` middleware.

## Security model

- API keys are generated once and shown **only at creation time**.
- The server stores only a SHA-256 hash of each key (`key_hash`), never plaintext.
- Keys can be scoped (`scopes` array), expired (`expires_at`), and revoked (`revoked_at`).
- API key auth maps to a real user, so existing RBAC rules still apply (`requireRole`, `requirePermission`).

## Endpoints (admin only)

All endpoints below require an authenticated admin session:

- `GET /api/api-keys` — list your API keys (metadata only).
- `POST /api/api-keys` — create a key.
  - Body:
    ```json
    {
      "name": "Automation Key",
      "expiresInDays": 30,
      "scopes": ["api:full"]
    }
    ```
- `DELETE /api/api-keys/:id` — revoke a key.

## Using API keys

Send the key using either header:

- `X-API-Key: mka_<prefix>_<secret>`
- `Authorization: Bearer mka_<prefix>_<secret>`

Example:

```bash
curl -H "X-API-Key: mka_xxxxx_xxxxx" https://www.marketingteam.app/api/clients
```

## Notes

- API keys authenticate as the owner user.
- If the key owner lacks RBAC permissions for an endpoint, requests are still denied.
- Existing session-based login continues to work unchanged.
