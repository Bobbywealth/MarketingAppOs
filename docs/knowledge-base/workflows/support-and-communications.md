# Workflow: Support + Communications (Tickets, Messages, Inbox)

**Owner roles**: Staff (primary), Manager (escalations), Admin (system/integration issues)

## Goal

Handle requests quickly, document decisions, and keep a single traceable record inside MarketingOS.

## Support tickets

### Who can create tickets

- **Clients**: can create/manage tickets for their own client record
- **Creators**: can create tickets for clients they have visited
- **Internal team**: can create/manage tickets as part of delivery

### Triage checklist (for new tickets)

- Confirm priority (normal vs urgent)
- Assign owner
- Ask for missing details up front (screenshots, links, steps to reproduce)
- Post an internal note if sensitive (so client-facing wording stays clean)

### Resolution checklist

- Record what was done
- Confirm with requester
- Close the ticket and note any follow-up tasks

## Internal messaging

- Use internal messages for quick coordination.
- Prefer tickets/tasks when:
  - a request needs an SLA
  - work needs tracking
  - there’s a client impact

## Email

- Email notifications (SMTP) power reminders and system alerts when configured.
- If email delivery is failing, see: [`/SMTP_SETUP.md`](../../../SMTP_SETUP.md)

## SMS

MarketingOS supports two SMS concerns:

- **Inbound capture** (webhooks)
  - Twilio inbound: [`/TWILIO_SMS_WEBHOOK_SETUP.md`](../../../TWILIO_SMS_WEBHOOK_SETUP.md)
  - Dialpad inbound: [`/DIALPAD_SMS_WEBHOOK_SETUP.md`](../../../DIALPAD_SMS_WEBHOOK_SETUP.md)
- **Outbound** (Twilio)
  - Admin diagnostics exist in Marketing Center (`/marketing-center/twilio/*`)

## Push notifications (PWA/Web)

- If push notifications aren’t arriving, see: [`/diagnose-sarah-push.md`](../../../diagnose-sarah-push.md)

