# Workflow: Marketing Center (Broadcasts)

**Owner role**: Admin

Marketing Center is designed for compliant outbound communication to leads/clients based on opt-in flags.

## Goal

Send the right message to the right audience while maintaining consent and visibility into delivery results.

## Before you send anything (compliance checklist)

- Confirm intended audience (leads vs clients)
- Confirm opt-in requirements:
  - email sends should require `optInEmail=true`
  - SMS sends should require `optInSms=true`
- Confirm content includes required disclaimers (when applicable)
- Avoid sending to “unknown” contacts without permission

## Create a broadcast

- Choose type: email or SMS
- Choose audience: all / leads / clients / specific / individual
- Apply filters where possible (industry, tags)
- Optional: schedule it for later

## Monitor results

- Review broadcast history
- If there are failures, inspect recipient-level error details

## Diagnostics (Twilio)

Marketing Center includes admin-only endpoints for diagnosing outbound SMS:

- `/twilio/status`: confirms configuration presence (no secrets)
- `/twilio/test-sms`: sends a single test SMS and returns provider error details

## Common failure modes

- Missing environment variables for the provider
- Invalid recipient formatting (E.164 issues)
- Opt-in mismatch (audience too broad)
- Provider-side blocks (toll-free verification, carrier filtering)

