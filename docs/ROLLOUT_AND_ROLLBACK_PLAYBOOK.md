# Rollout and Rollback Playbook (Phase 4)

## Goal

Ship lifecycle + storage + observability changes safely across school tiers with low production risk.

## Rollout Sequence

1. **Staging smoke checks**
   - Run Flyway migrations.
   - Verify `/api/v1/platform/health`, `/platform/lifecycle/summary`, `/platform/lifecycle/observability`.
   - Verify report download still works for old + new jobs.
2. **Canary tenant rollout**
   - Enable in one low-risk tenant first.
   - Monitor SLO signals for at least 24h:
     - report read p95
     - snapshot hit rate
     - archive lag days
     - storage missing files
3. **Progressive rollout**
   - Expand in batches by tenant size (small → medium → large).
   - Pause rollout if any critical alert remains > 30 minutes.
4. **Full rollout**
   - Enable for all tenants once no unresolved criticals remain.

## Pre-Production Checklist

- [ ] Backups for DB + report binary directory completed.
- [ ] Archive dry-run completed and reviewed.
- [ ] Storage reconcile dry-run completed and reviewed.
- [ ] Alert thresholds configured per environment.
- [ ] Super-admin users trained on new lifecycle observability screens.

## Rollback Conditions

Trigger rollback if any condition is true:

- Critical API regression in report generation or report download.
- `report_storage_missing_files` spikes after release.
- Archive job causes unacceptable OLTP load.
- Repeated critical DB pool pending alerts linked to new release.

## Rollback Steps

1. Disable new lifecycle/storage scheduling toggles via env:
   - `APP_LIFECYCLE_ARCHIVE_ENABLED=false`
2. Keep read-only observability endpoints enabled for diagnosis.
3. Revert application artifact to previous release.
4. Re-run smoke tests on:
   - report generation/download
   - dashboard endpoints
   - platform health endpoint
5. Execute post-rollback incident note with root cause and recovery actions.

## Post-Rollout Weekly Operations

- Run storage reconciliation dry-run weekly.
- Review archive lag and missing-file trends.
- Track threshold tuning opportunities by tenant tier.
