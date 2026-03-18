# UI Vibe Migration Checklist

## Goal
Roll out the updated UI vibe across all app pages in staged batches while enforcing consistent layout patterns, token usage, and mobile spacing quality.

## Global requirements (apply to every page)
- [ ] Use consistent shell, header, and surface patterns shared across the app.
- [ ] Replace raw, one-off gradient/shadow utility classes when an approved design token exists.
- [ ] Complete mobile spacing review at common breakpoints (`sm`, `md`, `lg`) and resolve regressions.

---

## Batch 1 — Foundation: shared components/tokens

### Shared UI foundation
- [ ] `AppShell` / page shell primitives standardized and documented.
- [ ] Header primitives standardized (page title area, actions area, responsive collapse behavior).
- [ ] Surface primitives standardized (card/panel/background hierarchy).
- [ ] Gradient tokens defined (or confirmed) for approved visual accents.
- [ ] Shadow tokens defined (or confirmed) for elevation levels in use.
- [ ] Utility lint/review checklist added for banning one-off gradient/shadow classes where token is available.
- [ ] Breakpoint QA checklist established for `sm`, `md`, `lg` spacing verification.

---

## Batch 2 — Pilot pages: leads, clients, tickets/campaigns

### Leads page
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

### Clients page
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

### Tickets/Campaigns page
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

---

## Batch 3 — Secondary pages: messages, marketing-center, analytics

### Messages page
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

### Marketing Center page
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

### Analytics page
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

---

## Batch 4 — Remaining pages

### Remaining page inventory
- [ ] Enumerate all pages not covered in Batches 1–3.
- [ ] Group by priority (high traffic, high churn, low risk).

### Per-page checklist (apply to each remaining page)
- [ ] Consistent shell/header/surface usage.
- [ ] No raw one-off gradient/shadow classes when token exists.
- [ ] Mobile spacing review at common breakpoints (`sm`, `md`, `lg`).

### Completion gates
- [ ] Visual QA sign-off for each page.
- [ ] Spot-check token consistency against shared foundation.
- [ ] Final regression sweep across representative device widths.
