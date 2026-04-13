# Data purge vs retention (multi-tenant safety)

## Two different mechanisms

| Mechanism | Who triggers | What it deletes | Touches other schools? |
|-----------|----------------|-----------------|-------------------------|
| **Full org wipe** | Super Admin API | **All** application rows for **one** `tenant_id` (see `TenantDataPurgeExecutor` table list) | **No** — every SQL has `WHERE tenant_id = ?` |
| **Scheduled soft-delete cleanup** | Cron (`SoftDeletedDataPurgeJob`) | Only **old soft-deleted** rows in **audit** + **in-app notifications** (extend later if needed) | **No** — each delete includes `tenant_id`; targets are **explicit** tenant ids |

Full legal erasure after retention is modeled as the **full org wipe**, not as “run cron on everyone.”

## Super Admin workflow (full wipe — one school)

1. **Suspend** the workspace: `POST .../platform/schools/{tenantId}/suspend` — sets workspace inactive and deactivates users (no logins).
2. When policy allows, **request purge**: `POST .../platform/schools/{tenantId}/purge-data` with body confirming **school code** — queues `PlatformTenantPurgeJob`.
3. Async worker runs **`TenantDataPurgeExecutor.purgeTenantData(tenantId)`** — deletes that tenant from all listed tables, with MySQL `FOREIGN_KEY_CHECKS` disabled for that connection to avoid ordering errors.

No other tenant is included. There is **no** default “wipe all schools.”

## Scheduled job (soft-delete retention — not full wipe)

- **Default:** `app.lifecycle.purge.allow-all-tenants=false` → you **must** set `app.lifecycle.purge.tenant-ids` (comma-separated). If it is empty, the job **does nothing** (safe).
- **Optional bulk (e.g. private single-tenant cloud):** set `allow-all-tenants=true` **only** if you intentionally want the retention job to iterate every row in `tenant_configs`. This still only removes **soft-deleted** audit/notification rows past retention — it does **not** call the full table wipe.

## Why we do not default to “all tenants”

Iterating every school for **any** destructive job is risky in SaaS: a misconfiguration could affect many customers. Explicit **tenant-ids** (or an explicit opt-in flag) keeps production defaults safe; **per-school full wipe** stays on the **Super Admin** API with **suspend + confirmation**.
