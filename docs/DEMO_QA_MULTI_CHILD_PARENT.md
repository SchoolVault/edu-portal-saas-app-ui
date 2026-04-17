# QA: parent with more than two children (demo seed)

Seeded by **`DemoDataSeedService`** (`attachQaMultiChildDemoParent`) when demo seed runs (`dev` / `demo-seed` with `app.demo-seed.enabled=true`).

## Credentials

**Password for all rows below:** `admin123`

| School code | Tenant ID | Email |
|-------------|-----------|-------|
| `DPS-DLH` | `tenant_dps_delhi_9x4k7m2p` | `qa.multichild.parent@parent.dps-dlh.edu.in` |
| `KV-MUM` | `tenant_kv_mumbai_7p5n3x8q` | `qa.multichild.parent@parent.kv-mum.edu.in` |

## What to test

1. Log in with **school code** + email + password (same as other demo parents).
2. Parent portal should list **four** students for this account (child switcher, dashboard, fees, attendance, etc. per child).
3. Students are chosen across **different classes where possible** so flows cover timetable/class context.

## Re-runs

If the QA user email already exists for the tenant, the seeder **skips** re-linking (idempotent). To reset, remove that user (and dependent rows) or use a fresh database.

## Implementation

Constants: `QA_MULTICHILD_STUDENT_COUNT` (4), `QA_MULTICHILD_EMAIL_LOCAL` (`qa.multichild.parent`). See `DemoDataSeedService` for linking logic (`students.parent_id`, primary `StudentGuardianMapping`).
