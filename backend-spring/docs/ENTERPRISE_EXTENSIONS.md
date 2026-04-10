# Enterprise extensions (directory chat, fees, attendance audit, payments, scoping)

## Directory search + chat (implemented)

- **DTO:** `DirectoryDTOs.Entry` includes `chatUserId`, `chatTargetRole`, `contextType`, `contextId`.
- **Rules:** Teachers expose chat when `teachers.user_id` is set. Students expose parent chat when `students.parent_id` references a `users` row with role `PARENT`. Staff rows with `user_id` expose chat as `STAFF`.
- **Deep links:** Teacher profile view uses `/app/teachers/{id}` (edit remains `/edit`).

## Fee auto-reminders (queue contract)

Suggested REST (aligns with operations fee-reminders and future schedulers):

- `POST /api/v1/operations/fee-reminders/auto/sweep` — body `{ "withinDays": 14, "channels": ["SMS","WHATSAPP"] }`; returns `{ "scheduled": n }`.
- `GET /api/v1/operations/fee-reminders?status=PENDING` — existing list.
- Persist rows with unique `(tenant_id, fee_payment_id, channel, status)` for idempotent scheduling.

## Attendance audit (past-date corrections)

Suggested REST:

- `GET /api/v1/attendance/audit?classId=&sectionId=&date=` — read-only sheet for admins.
- `PUT /api/v1/attendance/audit` — body: date, classId, sectionId, rows[], `reason` (required), `correlationId`; response echoes version/etag for optimistic locking.
- Log to `audit_log` with actor, tenant, before/after JSON.

## Payment gateway (Razorpay / Stripe)

- **Live:** `POST /api/v1/payments/checkout/orders` (see `PaymentCheckoutController`) returns `clientOptionsJson` for browser SDKs.
- **Next steps:** Persist attempts in `fee_payment_attempts`, verify signatures on webhook, map `provider_payment_id` → fee ledger posting.
- **Payroll / teacher payout:** Reuse same controller with `purpose=PAYROLL_PAYOUT` and `payeeUserId`.

## Academic-year scoping (policy)

- All roster, attendance, exams, and fee postings should filter by **current** `academic_year_id` unless an explicit archived-year report role is granted.
- After student promotion, prior-year class enrollments remain historical; APIs must default to **active enrollment** for the current year only.

## Role matrix & verification checklist

| Role        | Typical access |
|------------|----------------|
| SUPER_ADMIN | Cross-tenant platform screens only; no school PII without impersonation audit. |
| ADMIN      | Full tenant CRUD; fee structures; operations; past attendance audit; payments. |
| TEACHER    | Scoped classes/roster; attendance for assigned/covered classes; directory search within policy. |
| PARENT     | Linked children only; fee pay; chat with class teacher / school. |

**Isolation:** Every repository query must include `tenant_id` from `TenantContext` (already enforced on services using tenant-scoped repositories).

**Logging:** MDC carries `traceId`, `tenantId`, `userId`, `role` (see `application.yml` logging pattern).

**Indexes / uniqueness:** Prefer composite uniques on `(tenant_id, business_key)` — e.g. `uk_student_admission`, `uk_user_tenant_email`, fee reminder dedupe as above.

**Caching:** `application.yml` documents TTL namespaces (`app.cache.ttl.*`). Use `@Cacheable` for read-mostly reference data (subject catalog, transport routes) with Redis in production.

**Redis:** Already on classpath for rate limits / future cache; keep cache keys prefixed with `app.redis.key-namespace`.

## Seed data

- `V26__demo_tenant_academic_seed.sql` provisions Class 8 · Section A, teacher linked to `teacher@school.com`, student Emma Chen linked to `parent@school.com` for demos and sales tenants.
