# Client Experience (Internal Reference)

This doc helps staff understand what clients can (and cannot) do in MarketingOS.

## What clients can do

- **View tasks for their client record**
  - API filters tasks by `clientId` for client-role users.
- **View campaigns for their client record**
  - Campaigns are filtered to the user’s `clientId`.
- **Create and manage support tickets**
  - Clients can only view/update/delete **their own** tickets (by `clientId`).

## What clients typically cannot do

- Manage users or system settings
- Access internal reporting dashboards
- Create/modify delivery-side entities like invoices or internal-only admin tools

## How clients should be supported

- If a client says “I can’t see my tasks/campaigns”, confirm their user account has the correct `clientId` linkage.
- If a client needs something outside their access, staff should do it on their behalf and keep them updated via tickets or agreed communication channels.

