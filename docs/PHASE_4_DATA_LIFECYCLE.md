# Phase 4 — Data lifecycle (soft delete + purge)

See also **[DATA_PURGE_AND_RETENTION.md](./DATA_PURGE_AND_RETENTION.md)** (full wipe vs cron, Super Admin flow).

## Technical

- **`deleted_at`:** Added on all `BaseEntity` tables (nullable). `BaseEntity.markSoftDeleted()` sets `is_deleted` and timestamps `deleted_at`.
- **Scheduled soft-delete cleanup:** `SoftDeletedDataPurgeJob` removes **only** expired **soft-deleted** rows in **audit** + **notifications**, **per tenant**, with **`tenant_id` in SQL**. **`allow-all-tenants` defaults to false** — set **`app.lifecycle.purge.tenant-ids`** or nothing runs. **`SoftDeletedPurgeTenantRunner`** = one transaction per tenant. **`dry-run`** logs without deleting.
- **Full org wipe (legal / offboarding):** Super Admin **suspends** workspace, then **purge-data** API with school-code confirmation → `TenantDataPurgeExecutor` removes **all** listed tables for **that** `tenant_id` only, **`FOREIGN_KEY_CHECKS=0`** for the connection, then restored.
- **Archive job (stub):** `WarmDataArchiveJob` placeholder for aged OLTP → archive.

## Plain language

**Destroying an entire school’s data** is a deliberate Super Admin action (suspend, then confirm), not a silent nightly job across everyone.

**Nightly retention** only throws away **old trash** (soft-deleted audit/notifications) for **tenant ids you list in config**, unless you explicitly turn on “all tenants” for that small job only.
