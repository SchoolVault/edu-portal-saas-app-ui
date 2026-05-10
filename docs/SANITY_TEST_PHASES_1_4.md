# Sanity Test Checklist (Phases 1-4)

Use this checklist in QA/UAT to verify scalability and reliability upgrades delivered across Phase 1 to Phase 4.

## 0) Environment Setup

- [ ] Start backend with demo + warehouse flags:
  - `spring.profiles.active=demo-seed`
  - `DEMO_SEED_ENABLED=true`
  - `DEMO_SEED_WAREHOUSE_ENABLED=true`
  - `APP_REPORTS_BACKEND=warehouse`
  - `APP_ANALYTICS_ETL_ENABLED=true`
- [ ] Confirm application boots successfully.
- [ ] Confirm Flyway applies migrations without failure.

## 1) Phase 1 - OLTP Stabilization

- [ ] Call `GET /api/v1/reports/class-summary/paged?page=0&size=20`.
- [ ] Call `GET /api/v1/reports/section-summary/paged?page=0&size=20`.
- [ ] Call `GET /api/v1/reports/teacher-workload/paged?page=0&size=20`.
- [ ] Verify paged payload shape is correct and stable.
- [ ] Verify no API errors or timeout spikes.
- [ ] Verify report read timing logs are present in application logs.

## 2) Phase 2 - Snapshot and Cache Architecture

- [ ] Call `GET /api/v1/reports/dashboard` twice.
- [ ] Call `GET /api/v1/reports/dashboard/admin` twice.
- [ ] Verify second call is faster (snapshot/cache path).
- [ ] Trigger a data mutation (attendance mark or fee payment).
- [ ] Re-call dashboard endpoints and verify values refresh correctly.
- [ ] Check `dashboard_snapshots` rows exist and `refresh_required` behavior is correct.

## 3) Phase 2.1 - Warmup and Performance Metrics

- [ ] Trigger snapshot warmup:
  - `POST /api/v1/reports/dashboard/snapshots/warmup?tenantLimit=10`
- [ ] Fetch metrics:
  - `GET /api/v1/reports/performance-metrics`
- [ ] Verify metrics include:
  - operation counts
  - p95/p99 latency
  - snapshot hit/miss counters

## 4) Phase 3 - Warehouse and OLAP Offload

- [ ] Ensure `APP_REPORTS_BACKEND=warehouse`.
- [ ] Call `GET /api/v1/reports/dashboard`.
- [ ] Call `GET /api/v1/reports/class-summary/paged`.
- [ ] Call `GET /api/v1/reports/section-summary/paged`.
- [ ] Call `GET /api/v1/reports/teacher-workload/paged`.
- [ ] Call `GET /api/v1/reports/attendance-summary?classId=<id>&month=YYYY-MM`.
- [ ] Verify response DTO contracts are unchanged.
- [ ] Verify data returns from warehouse aggregates when present.
- [ ] Verify fallback to OLTP still works when warehouse rows are absent.

## 5) Phase 4 - Lifecycle Archive Flow

- [ ] Run archive in dry-run mode:
  - `APP_LIFECYCLE_ARCHIVE_ENABLED=true`
  - `APP_LIFECYCLE_ARCHIVE_DRY_RUN=true`
- [ ] Verify logs show archive candidates and no destructive action.
- [ ] In test environment only, run non-dry mode:
  - `APP_LIFECYCLE_ARCHIVE_DRY_RUN=false`
- [ ] Verify aged rows move to `lifecycle_archive_records`.
- [ ] Verify source tables are trimmed only for eligible old rows.
- [ ] Verify current/hot operational data remains intact.

## 6) Phase 4 - Report Blob Offload

- [ ] Generate report: `POST /api/v1/reports/generate`.
- [ ] Download generated report: `GET /api/v1/reports/jobs/{id}/download`.
- [ ] Verify DB fields on `report_generation_jobs`:
  - `storage_provider` is set.
  - `file_storage_path` is set.
  - `file_content` is null when DB copy is disabled.
- [ ] Verify download works from offloaded storage path.
- [ ] Verify fallback behavior works when DB copy is enabled.

## 7) UI Responsive Validation (Touched Modules)

- [ ] Open dashboard in desktop viewport.
- [ ] Open dashboard in tablet viewport (~768px).
- [ ] Open dashboard in mobile viewport (~390px).
- [ ] Open fees module in desktop viewport.
- [ ] Open fees module in tablet viewport (~768px).
- [ ] Open fees module in mobile viewport (~390px).
- [ ] Verify no clipping/overlap and table horizontal scrolling is usable.

## 8) i18n Validation

- [ ] Switch to English and verify dashboard + fees labels/messages.
- [ ] Switch to Hindi and verify dashboard + fees labels/messages.
- [ ] Verify no broken translation keys or placeholder artifacts.

## 9) Data Integrity and Constraint Validation

- [ ] Attempt duplicate report generation with same `requestId` for same tenant.
- [ ] Verify duplicate is rejected and no duplicate DB rows are created.
- [ ] Perform concurrent report-generation calls and verify uniqueness holds.

## Sign-Off

- [ ] QA pass complete
- [ ] Product validation complete
- [ ] Ready for staged rollout
