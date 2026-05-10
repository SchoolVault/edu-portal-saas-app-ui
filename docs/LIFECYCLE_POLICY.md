# Phase 3 Lifecycle Policy (Hot / Warm / Cold)

## Objective

Keep OLTP tables lean while preserving historical traceability and report-file reliability.

## Data Temperature Model

- **Hot data**: current operational records in OLTP tables (`attendance_records`, active notifications, current audit activity).
- **Warm/Cached**: summarized dashboard/report snapshots and warehouse aggregates.
- **Cold archive**: aged records in `lifecycle_archive_records` with source metadata + payload JSON.

## Archive Flow

- Job: `WarmDataArchiveJob`
- Scope:
  - `attendance_records` older than retention
  - `audit_logs` older than retention
  - soft-deleted `notifications` older than retention
- Safety:
  - insert archive row first (`ON DUPLICATE KEY UPDATE`)
  - delete source rows only after archive insert
  - tenant-scoped execution via `TenantScopedExecution`

## Storage Reliability Flow (Report Binaries)

- Report files are stored by `ReportBinaryStorageService` in file storage.
- DB row (`report_generation_jobs`) keeps storage metadata (`storage_provider`, `file_storage_path`).
- Reconciliation endpoint compares DB references with actual files:
  - missing files (DB points to absent file)
  - orphan files (file exists but no active DB reference)

## Operational Endpoints (Super Admin)

- `GET /api/v1/platform/lifecycle/summary`
  - total archived records
  - latest archive timestamp
  - report storage tracked rows
  - report storage missing file count
- `POST /api/v1/platform/storage/reconcile?dryRun=true&deleteOrphans=false`
  - dry-run or execution mode
  - scanned/referenced/missing/orphan/deleted counts
  - sample paths for quick triage

## Recommended Runbook

1. Run reconcile in dry-run weekly.
2. If orphans are expected (manual cleanup window), run with `deleteOrphans=true`.
3. If missing files > 0, restore from backup or mark corresponding jobs for regeneration.
4. Track `report_storage_missing_files` SLO in platform health.
