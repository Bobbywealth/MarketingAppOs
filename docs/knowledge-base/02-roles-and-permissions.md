# Roles + Permissions (RBAC)

MarketingOS uses **role-based access control (RBAC)** enforced on the API.

- **Roles live in**: `shared/roles.ts`
- **Default role permissions live in**: `server/rbac.ts`
- **Enforcement helpers**: `requireRole(...)` and `requirePermission(...)`

## Roles (current)

- `admin`
- `manager`
- `staff`
- `sales_agent`
- `creator_manager`
- `creator`
- `staff_content_creator`
- `client`

## Default permissions by role (system-level)

These permissions gate *server capabilities* (API access).

| Role | Users | Clients | Campaigns | Leads | Content | Invoices | Tickets | Reports | Settings |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **manager** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **staff** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **sales_agent** | ❌ | ✅* | ❌ | ✅* | ❌ | ❌ | ✅ | ❌ | ❌ |
| **creator_manager** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **creator** | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ | ✅ | ❌ | ❌ |
| **staff_content_creator** | ❌ | ✅* | ❌ | ❌ | ✅* | ❌ | ❌ | ❌ | ❌ |
| **client** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ |

\* Notes:
- **Sales Agent**: "Clients" and "Leads" should be interpreted as **assigned** scope in UI/process (the server enforces many routes via permissions; assignment scoping is handled by specific endpoints/queries).
- **Creator**: "Content" means creator self-service uploads / visit fulfillment, not full content admin.
- **Staff Content Creator**: "Clients" means access to ALL client document folders only. "Content" means access to content calendar. This is an internal role for staff video/image creators who need to access client assets but nothing else.
- **Client**: "Tickets" are *their own* tickets.

## Custom sidebar permissions (UI-level)

Users can also have `users.customPermissions` (JSON) that controls what appears in the UI navigation (feature visibility). This is **not** a substitute for server-side RBAC; it’s an additional UX layer.

## Email verification enforcement (optional)

The API can enforce verified emails via `ENFORCE_EMAIL_VERIFICATION=true` (see `server/auth.ts`).

- Admin and Manager are exempt by default.
- Other roles can be blocked until verified.

## How to request access changes

- If you need more access, request it from an **Admin** with:
  - Your username
  - What you need to do
  - Why you need it
  - Time window (permanent vs temporary)

