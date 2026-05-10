# Backend Phase-2 Hardening Runbook

This runbook captures production hardening controls added for latency, query visibility, pool sizing, and load validation.

## 1) What was added

- API latency metrics via AOP:
  - metric: `erp.api.latency`
  - tags: `module`, `controller`, `method`, `outcome`
- SQL latency + slow-query metrics:
  - metric: `erp.db.query.latency`
  - metric: `erp.db.query.slow.count`
  - datasource-tagged
- Hikari pool preset profile support:
  - `APP_DATASOURCE_HIKARI_PRESET=none|small|medium|large`
- Prometheus histogram/SLO buckets:
  - `http.server.requests`
  - `erp.api.latency`
  - `erp.db.query.latency`
- Dashboard load smoke script:
  - `backend-spring/scripts/loadtest/dashboard_concurrency_smoke.sh`

## 2) Config knobs (ConfigMap / env)

### 2.1 API timing

- `APP_OBSERVABILITY_API_TIMING_ENABLED=true`

### 2.2 Slow-query instrumentation

- `APP_DATASOURCE_SLOW_QUERY_ENABLED=true` (recommended in staging; enable in prod for diagnosis windows)
- `APP_DATASOURCE_SLOW_QUERY_THRESHOLD_MS=1000`

### 2.3 Pool preset (optional)

- `APP_DATASOURCE_HIKARI_PRESET=small|medium|large`

Preset ranges:
- `small`: max 12 / min 3
- `medium`: max 24 / min 6
- `large`: max 48 / min 12

If you already tune `spring.datasource.hikari.*` directly, keep preset as `none`.

## 3) Top endpoint focus list (operationally heavy)

1. `/api/v1/reports/dashboard/admin`
2. `/api/v1/reports/dashboard/teacher`
3. `/api/v1/reports/dashboard/parent`
4. `/api/v1/reports/dashboard/admin/recent-activities`
5. `/api/v1/reports/dashboard/admin/upcoming-events`
6. `/api/v1/communication/inbox/*`
7. `/api/v1/communication/campaigns/*`
8. `/api/v1/fees/*` (collection + reconciliation views)
9. `/api/v1/payroll/*` (disbursement + queue)
10. `/api/v1/directory/*`
11. `/api/v1/student/*`
12. `/api/v1/teacher/*`
13. `/api/v1/settings/*`
14. `/api/v1/importexport/*`
15. `/api/v1/exams/*`
16. `/api/v1/timetable/*`
17. `/api/v1/attendance/*`
18. `/api/v1/library/*`
19. `/api/v1/notification/*`
20. `/api/v1/operations/*`

Use metrics to rank these by p95/p99 in your real tenant traffic.

## 4) Load and leak check procedure

### 4.1 Dashboard concurrency smoke

```bash
cd backend-spring
chmod +x scripts/loadtest/dashboard_concurrency_smoke.sh
BASE_URL="https://api.yourdomain.com/api/v1" \
TOKEN="<admin_jwt>" \
CONCURRENCY=20 \
ROUNDS=10 \
./scripts/loadtest/dashboard_concurrency_smoke.sh
```

### 4.2 SMS/campaign load (existing)

```bash
./scripts/loadtest/sms_campaign_burst.sh
```

### 4.3 Heap checks (JVM)

- Start with:
  - `-XX:+HeapDumpOnOutOfMemoryError`
  - `-XX:HeapDumpPath=/var/log/school-erp/`
- During load, collect:
  - `jcmd <pid> GC.heap_info`
  - `jcmd <pid> GC.class_histogram`
  - `jcmd <pid> VM.native_memory summary`

Compare snapshots between rounds to detect unbounded growth.

## 5) Query tuning workflow

1. Enable slow-query instrumentation for a controlled window.
2. Extract top SQL from logs and `erp.db.query.slow.count`.
3. Add/adjust indexes for real predicates/sorts.
4. Re-run same load pattern and compare p95/p99 + slow count.
5. Keep only bounded-cardinality metrics in production labels.

## 6) Data freshness / trust guardrails

- Keep `app.reports.snapshots.freshness-mode=strict_realtime` for trust-sensitive cards.
- Use microcache only if DB load requires it and TTL remains short.
- Keep dashboard recent/upcoming windows config-driven and scoped by role.

## 7) Rollout sequence

1. Deploy to staging with `APP_OBSERVABILITY_API_TIMING_ENABLED=true`.
2. Run dashboard + SMS load scripts.
3. Review Prometheus p95/p99 + slow query counts.
4. Tune pool preset and DB indexes.
5. Promote to prod with same settings and alert thresholds.

