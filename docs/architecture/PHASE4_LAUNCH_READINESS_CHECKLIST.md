# Phase 4 Launch Readiness Checklist (Target: May 15)

Use this checklist daily until go-live. A failed item blocks release.

## A) Performance Benchmark Harness

- Run: `BASE_URL=<api-url> AUTH_TOKEN=<jwt> ./scripts/perf/phase4_benchmark_harness.sh`
- Archive report under `test_reports/phase4/`.
- Acceptance:
  - Dashboard/report endpoints p95 within target budget.
  - Failure count is zero for benchmarked endpoints.
  - No sustained latency regression across 3 consecutive runs.

## B) Query Plan and Index Verification

- Run: `mysql ... < scripts/db/phase4_query_plan_verification.sql`
- Validate `EXPLAIN` output:
  - no `type=ALL` on hot query paths.
  - index key includes `tenant_id` + `academic_year_id`.
  - estimated rows are bounded for paging queries.

## C) SLO Dashboard Verification Checklist

Track on your monitoring stack (Prometheus/Grafana/Datadog):

- API latency:
  - p95 and p99 for `/api/v1/reports/**`, `/api/v1/notifications/**`, `/api/v1/students/**`
- Error budget:
  - 5xx rate below threshold.
- DB health:
  - pool pending/active wait under configured SLO.
  - no sustained slow query spikes for hot endpoints.
- Scope safety:
  - no academic-year context missing errors.
  - no cross-tenant/cross-year leakage in audit checks.
- Read scaling:
  - replica lag (if enabled) acceptable.
  - read-only routes successfully serving from replica.

## D) Hard Go/No-Go Script

- Run:
  - `BASE_URL=<api-url> AUTH_TOKEN=<jwt> DB_URL=<...> DB_USERNAME=<...> DB_PASSWORD=<...> ./scripts/prelive/phase4_go_live_gate.sh`
- Script output file:
  - `test_reports/phase4/go_live_gate_<timestamp>.txt`
- Release decision:
  - all checks pass => **GO**
  - any failed check => **NO-GO**

## E) Final Pre-Live Sign-off

- Schema migrated to latest (`V41` + Phase 3 ops validated).
- Partition plan executed for at least highest-volume table set (or signed defer-with-risk memo).
- Cold-data and archival policy documented for operations team.
- Rollback plan rehearsed once in staging.
- Ownership matrix finalized (backend, DBA, SRE, support on-call).
