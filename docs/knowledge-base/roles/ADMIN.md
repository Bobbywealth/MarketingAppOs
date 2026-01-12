# Admin Playbook

Admins own **system integrity**, **access control**, **billing/commercial operations**, and **escalations**.

## Daily / weekly checklist

- **Daily**
  - Review: overdue tasks, overdue creator uploads, critical tickets
  - Review: new creator applications
  - Review: failed logins / security notifications (if enabled)
- **Weekly**
  - Review: lead pipeline health + assignment distribution
  - Review: billing status + Stripe dashboard signals
  - Review: marketing broadcast performance (if using Marketing Center)

## Access control & security

- **Creating internal users**
  - Self-signup (`/api/register`) forces role to **client** for safety.
  - Create Admin/Manager/Staff/Sales Agent/Creator Manager accounts as Admin.
  - Repo scripts exist (see `package.json`): `npm run admin:create`, `npm run admin:create2`.
- **Role changes**
  - Role changes are restricted to Admin via API.
- **Email verification**
  - Optional enforcement via `ENFORCE_EMAIL_VERIFICATION=true`.

## Core admin operations

### Users & roles

- Add or update users
- Audit who has access to what (RBAC + custom sidebar permissions)
- Disable access quickly if needed (role change or reset credentials)

### Clients & commercial

- Validate client records: owner assignments, billing status, package selection
- Stripe monitoring:
  - Subscriptions and customer linkage (client has `stripeCustomerId` / `stripeSubscriptionId`)
- Discounts:
  - Create/update discount codes; monitor redemptions

### Leads & assignment

- Create or import leads (see `LEAD_IMPORT_GUIDE.md`)
- Assign leads to sales agents
- Audit lead source + opt-in flags (`optInEmail`, `optInSms`) before outreach

### Creators & visits (fulfillment)

- Review creator applications; approve/decline
- Monitor visit lifecycle: scheduled → completed → upload → approval → payout
- Release payouts (Admin-only)

### Marketing Center (broadcasts)

Marketing Center is **Admin-only**.

- Create broadcast campaigns (email/SMS)
- Use audience filters (tags/industries/opt-in)
- Investigate recipient-level errors in broadcast history

### Integrations & infrastructure

The following integrations are commonly configured by Admin:

- **SMTP email**: see [`/SMTP_SETUP.md`](../../../SMTP_SETUP.md)
- **Twilio inbound webhook**: see [`/TWILIO_SMS_WEBHOOK_SETUP.md`](../../../TWILIO_SMS_WEBHOOK_SETUP.md)
- **Dialpad inbound webhook**: see [`/DIALPAD_SMS_WEBHOOK_SETUP.md`](../../../DIALPAD_SMS_WEBHOOK_SETUP.md)
- **Google Calendar sync**: see [`/GOOGLE_CALENDAR_SETUP.md`](../../../GOOGLE_CALENDAR_SETUP.md)
- **Push notifications**
  - Web push setup: see [`/ONESIGNAL_SETUP.md`](../../../ONESIGNAL_SETUP.md) (if using OneSignal)
  - PWA requirements: see [`/PWA_SETUP_INSTRUCTIONS.md`](../../../PWA_SETUP_INSTRUCTIONS.md)
- **ScrapeCreators social analytics**: see [`/SCRAPECREATORS_SETUP.md`](../../../SCRAPECREATORS_SETUP.md)
- **App store wrappers**: see [`/APP_STORE_READY.md`](../../../APP_STORE_READY.md)

## Incident response (quick)

- **User cannot log in**
  - Confirm username exists + role is correct
  - Confirm `SESSION_SECRET` is set in environment
  - If email verification enforcement is on, confirm user is verified
- **Leads “disappear”**
  - See [`/QUICK_FIX.md`](../../../QUICK_FIX.md)
- **Push notifications not arriving**
  - See [`/diagnose-sarah-push.md`](../../../diagnose-sarah-push.md)

