# Workflow: Lead Management (Import → Outreach → Close)

**Owner roles**: Sales Agent (primary), Staff/Manager (support), Admin (oversight)

## Goal

Maintain a clean, compliant lead pipeline and convert qualified leads into clients.

## Lead creation paths

- **Manual add** (in-app)
- **CSV import**
  - See: [`/LEAD_IMPORT_GUIDE.md`](../../../LEAD_IMPORT_GUIDE.md)

## Required / important lead fields

- **Required**
  - `company` (always required)
- **Strongly recommended**
  - decision maker name
  - primary location address
  - phone + email
  - website
  - industry + tags (for filtering and broadcasts)
  - opt-ins (`optInEmail`, `optInSms`)

## Pipeline stages (what they mean)

- **prospect**: not yet qualified; research and first touches
- **qualified**: fit confirmed; needs identified; next step defined
- **proposal**: proposal sent / negotiating
- **closed_won**: converted to client (handoff to onboarding)
- **closed_lost**: closed without conversion (must log close reason)

## Sales hygiene rules (required)

- **Every touch gets logged**
  - Add a Lead Activity: call/email/sms/meeting/note
  - Include outcome and next step
- **Next follow-up must be set**
  - Keep `nextFollowUpDate` and `nextFollowUpType` current
- **Do not spam**
  - Respect opt-in and suppression requests immediately

## Contact tracking fields (use them)

Use these so anyone can understand the current state instantly:

- last contact method/date/notes
- contact status (`not_contacted`, `contacted`, `in_discussion`, `proposal_sent`, `follow_up_needed`, `no_response`)

## Assignment

- Leads can be assigned to sales agents.
- Ownership should match reality (if someone else is working the lead, reassign it).

## Automations (email/SMS)

MarketingOS supports lead automations (e.g., stage-change triggered sequences).

Rules:

- Only automate where we have clear opt-in and value.
- Keep message templates on-brand and compliant.

## Converting a lead to a client

Definition of done for **closed-won**:

- Lead fields are complete enough for delivery to start
- Package selection + start expectations recorded
- Client record created/linked
- Ownership assigned (sales agent + account manager)
- Onboarding tasks created and scheduled

## Troubleshooting

- If leads appear and then “disappear” in UI, see: [`/QUICK_FIX.md`](../../../QUICK_FIX.md)

