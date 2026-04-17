# Phase 5 — Analytics / OLAP path

## Technical

- **Optional second datasource:** `app.analytics.datasource.url` (and standard username/password). When unset, analytics components use the **primary** datasource so local dev stays simple.
- **`AnalyticsWarehouseEtlJob`:** Scheduled stub that records ETL heartbeat / placeholder aggregation when `app.analytics.etl.enabled=true`. Extend to copy from `notification_outbox` / domain events into fact tables.
- **Heavy reports:** Operational dashboards stay on OLTP; **batch or replica-backed** reporting should read via `analyticsJdbcTemplate` when configured.

## Plain language

We can attach a **separate reporting database** when report load grows. A small **nightly job** can summarize activity for leadership dashboards without slowing down day-to-day school operations.
