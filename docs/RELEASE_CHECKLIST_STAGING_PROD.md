# Release Checklist (Staging -> Production)

## Staging Checklist

- [ ] Pull latest code and verify clean migration order (`V*` scripts).
- [ ] Apply DB migrations in staging.
- [ ] Run backend build (`mvn clean -DskipTests compile`).
- [ ] Run frontend build (`npm run build`).
- [ ] Validate core APIs:
  - [ ] `/api/v1/reports/dashboard/admin`
  - [ ] `/api/v1/reports/performance-metrics`
  - [ ] `/api/v1/platform/health`
  - [ ] `/api/v1/platform/lifecycle/summary`
  - [ ] `/api/v1/platform/lifecycle/observability`
  - [ ] `/api/v1/platform/storage/reconcile?dryRun=true`
- [ ] Run snapshot warmup and confirm no deserialization fallback errors.
- [ ] Run storage reconcile dry-run and review missing/orphan sample paths.
- [ ] Run archive job dry-run and validate expected row volumes.
- [ ] Execute `docs/SANITY_TEST_PHASES_1_4.md` (UI + API).

## Pre-Prod Gate

- [ ] SLO thresholds tuned for production capacity.
- [ ] Alerts configured for:
  - [ ] report read p95
  - [ ] snapshot hit rate
  - [ ] archive lag days
  - [ ] report storage missing files
- [ ] DB backup + report storage backup verified.
- [ ] On-call owner assigned for release window.

## Production Rollout Plan

1. Deploy backend with feature toggles conservative (dry-run where applicable).
2. Deploy frontend.
3. Enable canary tenant and monitor for 24h.
4. Expand rollout by tenant tiers (small -> medium -> large).
5. Keep rollback package ready through completion window.

## Rollback Trigger Conditions

- Critical regression in report generation/download.
- Sudden spike in `report_storage_missing_files`.
- `archive_lag_days` critical and persistent.
- Snapshot refresh backlog escalating without recovery.

## Rollback Steps

- [ ] Disable risky jobs:
  - [ ] `APP_LIFECYCLE_ARCHIVE_ENABLED=false`
- [ ] Revert app release artifact.
- [ ] Re-validate report + dashboard endpoints.
- [ ] Run storage reconcile dry-run to verify integrity.
- [ ] Publish incident and recovery notes.
