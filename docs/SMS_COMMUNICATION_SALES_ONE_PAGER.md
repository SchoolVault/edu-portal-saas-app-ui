# SMS Communication - Sales One Pager

This page is for Sales and customer-facing teams.
It explains what the platform can do, in plain language.

For technical setup details, see:
- `docs/SMS_COMMUNICATION_PRODUCTION_HANDOVER.md`

---

## What schools get

The platform now supports production-grade communication for:
- Parents
- Teachers
- Staff
- Class/section-specific groups

Messages can be sent as:
- instant notices,
- scheduled events,
- and timed reminders.

---

## Key business capabilities

### 1) Smart audience targeting

Schools can send messages to:
- everyone,
- only parents,
- only teachers/staff,
- one class,
- one section.

This avoids unnecessary spam and keeps communication relevant.

### 2) Event-first communication

Admins can create events like:
- PTM,
- sports day,
- festival,
- staff meeting,
- exam updates,
- fee-related events.

Each event can include:
- date/time,
- location,
- publish now or later,
- reminder notifications.

### 3) Role-based dashboards

- **Admin dashboard** shows Recent Activity + Upcoming Events with filters and pagination.
- **Parent dashboard** shows only events relevant to their child/class/section.
- **Teacher dashboard** remains role-scoped for teacher workflows.

### 4) Reliable message delivery

Delivery is asynchronous and production-safe:
- large broadcasts do not block UI,
- retries are handled automatically,
- failed items are traceable,
- campaign drill-down is available from dashboard links.

---

## Why this matters for customers

- Better parent engagement with timely communication.
- Lower manual follow-up for schools.
- Better visibility for admins on what was communicated and when.
- Scales from small schools to large institutions.

---

## Go-live readiness (non-technical summary)

Before enabling for a school, confirm:
1. Real SMS provider is activated (not mock mode).
2. Security callbacks/webhooks are configured.
3. Scheduled reminders are enabled.
4. Dashboard filters and role views are verified.
5. Retention policy is set (default 6 months, configurable).

---

## Future growth path

The system is ready to expand into:
- multi-provider smart routing,
- per-tenant template control,
- advanced SLA/cost analytics,
- stronger compliance workflows.

This means schools can start now and scale safely later.

