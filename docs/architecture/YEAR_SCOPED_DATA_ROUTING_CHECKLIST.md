# Year-Scoped Data Routing Checklist

Use this checklist when enabling archival and reporting flows per tenant.

## 1) Current Year -> OLTP
- All online write APIs (attendance, exams, fees, leave, library, communication) use current `academic_year_id`.
- Service methods rely on context filters, not request payload year override.
- New school onboarding creates one `academic_year` with `is_current = true` before admin starts operations.

## 2) Historical Years -> Archive
- Archive scheduler runs only for non-current years whose `end_date` is older than policy grace window.
- Data movement is tenant + academic-year scoped.
- Scheduler remains safe no-op when there are no tenants or no eligible years.

## 3) Read Routing
- Operational dashboards and mutation APIs hit OLTP tables.
- Long-range/historical reports should prefer archive tables or warehouse adapter.
- Keep historical endpoints read-only by policy.

## 4) Rollback Readiness
- `phase3_archive_execute.sql` and `phase3_archive_restore.sql` are tested in staging.
- Before/after row counts are validated per table per tenant/year.
- Restore path is documented and approved before production archive enablement.
