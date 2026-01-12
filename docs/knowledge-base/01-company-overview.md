# Company + System Overview

MarketingOS is our internal operating system for running a digital marketing agency and its related creator network.

## What MarketingOS is

- **Internal CRM + delivery platform** for managing clients, campaigns, tasks, leads, content workflows, support, communications, billing signals, and reporting.
- **Creator network platform** for creator applications, visit scheduling, uploads, approvals, and payouts.
- **Marketing Center** for compliant outbound broadcasts (email/SMS) to leads/clients (opt-in based).

## Who uses it

- **Admin**: owns system configuration, user management, billing operations, security, and escalations.
- **Manager / Staff**: owns day-to-day client delivery, tasks, content operations, and support.
- **Sales Agent**: owns assigned lead pipeline, outreach, and conversion workflows.
- **Creator Manager**: owns creator lifecycle (applications, approvals, performance).
- **Creator**: manages their availability, visits, uploads, and payout details.
- **Client**: views relevant items and creates support tickets (client capabilities are intentionally limited).

## How the system is built (high level)

- **Frontend**: React + TypeScript + Vite (UI lives in `client/`)
- **Backend API**: Express + TypeScript (API lives in `server/`)
- **Database**: Postgres (schema in `shared/schema.ts`, migrations in `migrations/`)
- **Auth**: session-based login (username + password) via Passport Local Strategy (`server/auth.ts`)
- **RBAC**: role-based access control with explicit permissions (`server/rbac.ts`)

## Major product areas (modules)

MarketingOS is “one system” but it’s easier to think of it as these modules:

- **Authentication & accounts**
  - User accounts with roles (admin/manager/staff/sales_agent/creator_manager/creator/client)
  - Email verification + password reset flows
- **Clients**
  - Client records, assignments (sales agent, account manager), billing status, notes, documents
- **Leads (pipeline)**
  - Lead stages (prospect → qualified → proposal → closed_won / closed_lost)
  - Activities (call/email/sms/meeting/notes) and automations (email/sms)
  - Import pipeline (CSV import guide exists)
- **Tasks**
  - Task list + spaces + comments + recurring tasks + due date automation
- **Content**
  - Content posts (calendar-like) with approval status lifecycle
- **Creators & Visits (Fulfillment)**
  - Creator applications, approvals/declines, assignments to clients
  - Visits scheduling → completion → upload → review/approval → payout release
- **Support**
  - Tickets (client-facing support + internal handling)
- **Comms**
  - Messages (internal) + group conversations
  - Email integration (Microsoft/Graph) + email sync jobs
  - SMS ingestion (Dialpad webhook) and SMS sending (Twilio)
- **Marketing Center**
  - Broadcast creation, audience targeting, delivery reporting
- **Analytics**
  - Client analytics metrics storage
  - Social analytics via ScrapeCreators snapshots
- **Billing / Commercial**
  - Stripe-linked client records
  - Subscription packages + discounts
  - Sales agent commissions + quotas
- **Calendar**
  - Company calendar events + optional Google Calendar sync
- **Second Me (AI)**
  - Admin-managed AI avatar workflow for clients (setup + content)
- **Courses (Learning)**
  - Courses/modules/lessons/enrollments (supports “document/text/video” content types)

## What “good” looks like

- **One source of truth**: client status, lead pipeline, tasks, and content should all be reflected in MarketingOS.
- **Opt-in compliance**: outbound marketing respects `optInEmail` / `optInSms` on leads/clients.
- **Least privilege**: roles and permissions restrict access to only what’s needed.
- **Every workflow has an owner**: each checklist in this KB states the responsible role.

