# Phase 0 — Standards (technical + plain language)

## For developers

### Module boundaries

- **Rule:** A feature package under `com.school.erp.modules.<name>` may call **only**:
  - Its own code, **shared** packages (`common`, `tenant`, `config`, `security`, `platform/port`), and **explicit port interfaces** published for cross-cutting behavior (notifications, audit, files, analytics).
- **Do not** inject another module’s `@Service` or `*Repository` from a different feature package unless that dependency is expressed as a **port** in `platform/port` or a small `*.api` style interface.
- **Platform / super-admin** flows live under `modules/platform` and may access tenant-scoped data with documented exceptions (`TenantQueryPolicy`).

### API conventions

- **Pagination:** List endpoints return `ApiResponse<PageResponse<T>>` with `page`, `size`, `totalElements`, `content` (existing `PageResponse`).
- **Errors:** Use `ApiResponse` / global exception handler; avoid leaking stack traces or tenant existence via 404 vs 403 where IDOR is a risk.
- **Idempotency:** Mutations that repeat safely accept `Idempotency-Key` (existing filter); document which routes support it.
- **Tenant:** Primary tenant resolution is **JWT** (`tenantId` claim). No separate `X-Tenant-Id` header for school users unless documented for platform tools; super-admin flows use role checks.

### Event catalog (domain → analytics / webhooks)

| Event name (analytics string) | When | Payload keys (no raw PII in logs) |
|-------------------------------|------|-------------------------------------|
| `fee_payment_recorded` | Fee payment applied | `paymentId`, `studentId`, `feeStatus`, `amountApplied` |
| `student_enrollment_changed` | Class/section change | `studentId`, `priorClassId`, `newClassId`, `priorSectionId`, `newSectionId` |
| `student_admitted` | New student | `studentId`, `classId`, `sectionId`, `admissionNumber` |

### PII policy

- Do **not** put phone numbers, full addresses, or child names into **analytics** attributes or **structured logs** at INFO.
- **Audit** rows may store descriptions; prefer entity IDs over copying PII.
- **Outbox** may hold message body for delivery; restrict access and retention per policy.

---

## For product / sales (plain language)

We wrote **rules for how product areas talk to each other** so one school’s data never “bleeds” into another and we can swap SMS/email providers later without rewriting fees or payroll.

**APIs** are consistent: lists are paginated, errors are user-safe, and repeat clicks don’t double-charge when idempotency is enabled.

**Events** (like “fee paid” or “student moved class”) feed **analytics and integrations** without putting private student data in those feeds.
