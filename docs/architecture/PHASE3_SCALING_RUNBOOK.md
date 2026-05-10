# Phase 3 Scaling Runbook

This phase prepares pre-live scale operations for partitioning, data temperature policy, and read-replica usage.

## 1) Partition Plan (Highest-volume tables first)

Candidate order:
1. `attendance_records`
2. `mark_records`
3. `fee_transactions`
4. `fee_payments`
5. `notifications`

Use:
- `scripts/db/phase3_partition_assessment.sql` for sizing and year-distribution checks.
- `scripts/db/phase3_partition_rollout_template.sql` for shadow-table cutover template.

## 2) Hot/Warm/Cold policy hooks

Implemented:
- `DataLifecycleProperties` (`app.data-lifecycle.*`)
- `AcademicYearTemperatureService`

Policy defaults:
- HOT: current + last 1 year
- WARM: up to last 3 years
- COLD: older than warm window
- Archive candidates: older than 5 years

Usage:
- HOT paths keep aggressive caching and full index sets.
- WARM paths stay queryable with reduced cache TTL.
- COLD paths are read-only and routed to archival/reporting flows.

## 3) Read-replica-ready query path

Already present in codebase:
- `ReadReplicaDataSourceConfiguration`
- `ReadWriteRoutingDataSource`
- conditionally enabled by `app.datasource.read.url`.

Operational rule:
- Ensure query-only service methods are marked `@Transactional(readOnly = true)`.
- Keep command/write flows with default transaction mode.

## 4) Pre-live rollout sequence

1. Enable and validate read replica in staging (`READ_DATASOURCE_URL` set).
2. Load test read-heavy dashboards and report APIs.
3. Partition one table at a time using shadow-table cutover.
4. Verify query plans and p95 latency after each cutover.
5. Move cold-year reports to replica/warehouse path.

## 5) Rollback plan

- Replica issue: unset `READ_DATASOURCE_URL` to fall back to single primary.
- Partition cutover issue: use table rename rollback from template.
- Keep old tables until reconciliation and stability checks pass.

## 6) Verification checklist

- No cross-year leakage in API responses.
- All hot endpoints use `(tenant_id, academic_year_id)` index plans.
- Read-only APIs hit replica path when enabled.
- Cold-year query latency remains stable under load.
