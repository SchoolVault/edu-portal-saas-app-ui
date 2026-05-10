# Archive Observability Dashboard Notes

## API Sources

- `/api/v1/platform/health`
  - Includes SLO signals and alerts.
  - Includes `archive_lag_days` and `report_storage_missing_files`.
- `/api/v1/platform/lifecycle/summary`
  - High-level archive + report storage counters.
- `/api/v1/platform/lifecycle/observability`
  - Source-table breakdown and 7-day archive trend.
- `/api/v1/platform/storage/reconcile`
  - Dry-run or execution reconciliation result for report binaries.

## Suggested Dashboard Sections

1. **Lifecycle KPIs**
   - Total archived records
   - Latest archive timestamp
   - Archive lag days
2. **Storage Integrity**
   - Tracked report rows
   - Missing file count
   - Orphan file count (latest reconcile run)
3. **Archive Throughput Trend**
   - 7-day daily archived count line chart
4. **Source Breakdown**
   - Archived rows by source table (`attendance_records`, `audit_logs`, `notifications`)

## Alert Recommendations

- `archive_lag_days >= 2` → warning
- `archive_lag_days >= 5` → critical
- `report_storage_missing_files >= 10` → warning
- `report_storage_missing_files >= 30` → critical

## Operator Actions

- For archive lag alert: check scheduler logs and tenant archive execution.
- For missing files: run reconcile dry-run, then recover files or regenerate reports.
