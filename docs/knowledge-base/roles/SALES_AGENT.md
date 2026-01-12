# Sales Agent Playbook

Sales Agents own **pipeline execution** and **conversion** on assigned leads.

## Daily checklist

- Review assigned leads by **stage** and **next follow-up date**
- Log every touchpoint as a **Lead Activity** (call/email/sms/meeting/note)
- Move stages forward (or close lost with a reason) so forecasting stays accurate
- Keep opt-in compliant (only market to opted-in contacts)

## Lead stages (expected meaning)

- **prospect**: newly added; research/initial qualification
- **qualified**: confirmed fit; decision maker and needs identified
- **proposal**: proposal delivered / negotiating
- **closed_won**: converted to client (required fields must be complete)
- **closed_lost**: closed without conversion (include a close reason)

## Outreach compliance (non-negotiable)

- Respect `optInEmail` and `optInSms` for leads.
- If a lead opts out, update the record immediately.
- When in doubt, escalate to Admin before sending a broadcast or automated outreach.

## How to work in MarketingOS

- **Every outreach event becomes an activity**
  - Type: call/email/sms/meeting/note
  - Include outcome + next step
- **Use follow-up fields**
  - Set next follow-up date/type so nothing is missed
- **Conversion**
  - When a lead is closed-won:
    - Ensure company + primary location + package selection + expected start date (as required by the flow)
    - Convert to client and ensure assignments are set (sales agent + account manager)

## Commissions & quotas

- MarketingOS stores commission/quota data for reporting.
- Keep deal value and expected close date updated; it impacts forecasting.

## SOPs you use most

- Lead management: [`workflows/lead-management.md`](../workflows/lead-management.md)
- Client onboarding handoff: [`workflows/client-onboarding-and-account-management.md`](../workflows/client-onboarding-and-account-management.md)

