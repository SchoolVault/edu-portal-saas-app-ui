# Phase 2: SLO Metrics + Alerting + Operational Observability

This phase introduces operator-facing SLO signals and alert-ready health payloads so super-admins can detect degradation before user-facing impact.

## What Was Implemented

- Enriched `/api/v1/platform/health` response with:
  - `sloSignals[]` (metric value, warn/critical thresholds, status)
  - `alerts[]` (severity, code, title, detail, suggested action)
- Added SLO evaluation for:
  - report read `p95` latency (from in-process report metrics)
  - snapshot cache hit rate
  - dashboard snapshot refresh backlog
  - JVM heap usage
  - DB pool pending threads (Hikari)
- Added configurable thresholds in `application.yml` under `app.observability.slo.*`.
- Updated platform health UI to render:
  - SLO signal table
  - operational alerts list with severity badges
- Kept mock and real contracts aligned so runtime mock mode can be switched off without UI contract breakage.

## Threshold Configuration (Env-overridable)

- `APP_OBS_SLO_REPORT_P95_WARN_MS` (default `800`)
- `APP_OBS_SLO_REPORT_P95_CRITICAL_MS` (default `1500`)
- `APP_OBS_SLO_SNAPSHOT_HIT_WARN_PCT` (default `70`)
- `APP_OBS_SLO_SNAPSHOT_HIT_CRITICAL_PCT` (default `50`)
- `APP_OBS_SLO_SNAPSHOT_BACKLOG_WARN` (default `50`)
- `APP_OBS_SLO_SNAPSHOT_BACKLOG_CRITICAL` (default `120`)
- `APP_OBS_SLO_DB_PENDING_WARN` (default `5`)
- `APP_OBS_SLO_DB_PENDING_CRITICAL` (default `12`)
- `APP_OBS_SLO_JVM_HEAP_WARN_PCT` (default `85`)
- `APP_OBS_SLO_JVM_HEAP_CRITICAL_PCT` (default `93`)

## Operations Runbook (Quick)

When `report_read_p95_ms` is WARN/CRITICAL:
1. Inspect slow-query logs.
2. Run `EXPLAIN ANALYZE` on top report queries.
3. Validate index usage and rows examined.

When `snapshot_hit_rate_pct` is low:
1. Verify snapshot invalidation is not over-triggering.
2. Run snapshot warmup for key tenants.
3. Review snapshot TTL and refresh cadence.

When `snapshot_refresh_backlog` is high:
1. Verify scheduler execution and job logs.
2. Increase refresh batch safely.
3. Check DB pressure around snapshot writes.

When `db_pool_pending_connections` is high:
1. Check long-running transactions.
2. Validate pool sizing and DB saturation.
3. Correlate with slow query spikes.

When `jvm_heap_usage_pct` is high:
1. Check GC pressure and memory-intensive jobs.
2. Reduce heavy concurrent workloads.
3. Tune JVM heap settings per environment.
