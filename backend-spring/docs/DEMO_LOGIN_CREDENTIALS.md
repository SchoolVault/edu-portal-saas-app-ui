# Demo & default login credentials

Use this sheet when testing against **seeded databases** or the **Angular mock** login. Passwords are for **non-production** demo use only.

---

## Which set applies on what?

| Scenario | Use section |
|----------|-------------|
| API + DB after **Flyway `V2__seed_data`** only (tenant `t1`, school `SCH001`) | [Default tenant `t1`](#default-tenant-t1-flyway-v2) |
| API + DB after **demo seed** (`DemoDataSeedService`, profiles `dev` / `demo-seed` with `app.demo-seed.enabled=true`) | [Showcase schools](#showcase-schools-demo-data-seed) |
| Angular **`useMocks: true`** (no backend auth) | [Frontend mock logins](#frontend-mock-logins-usemocks-true) |

Related: [DEMO_SHOWCASE_TENANT.md](./DEMO_SHOWCASE_TENANT.md) (how to run the seed).

---

## Showcase schools (demo data seed)

**Password for every user below:** `admin123`

Seeding is implemented by **`DemoDataSeedService`** (profiles `dev` / `demo-seed` with `app.demo-seed.enabled=true`). It creates **DPS-DLH** and **KV-MUM** plus related academics, fees, transport, etc. It does **not** pre-populate purely **runtime** tables (e.g. **`refresh_tokens`**). After each deploy, run the **one-time** profile described in [DEMO_SHOWCASE_TENANT.md](./DEMO_SHOWCASE_TENANT.md), then return to **`prod`** only.

Full tables, parent email pattern, and SQL helpers: **[DEMO_CREDENTIALS.md](../../DEMO_CREDENTIALS.md)** (repo root).

### Platform

| Role | Email | School code | Tenant ID |
|------|-------|-------------|-----------|
| SUPER_ADMIN | `superadmin@schoolerp.com` | `PLATFORM` | `PLATFORM` |

### School 1 — Delhi Public School (DPS-DLH)

| Tenant ID | `tenant_dps_delhi_9x4k7m2p` |
|-----------|-----------------------------|
| School code | `DPS-DLH` |

| Role | Email | Notes |
|------|-------|--------|
| ADMIN | `admin@dpsdel.edu.in` | From office email `office@dpsdel.edu.in` |
| TEACHER | `aarav.sharma@dps-dlh.edu.in` | Librarian flag (1 of 10 teachers) |
| TEACHER | `ananya.verma@dps-dlh.edu.in` | Library assistant flag |
| PARENT | *(see root `DEMO_CREDENTIALS.md`)* | Pattern `{name}.father.{token}@parent.dps-dlh.edu.in` etc. |
| PARENT (QA, multi-child) | `qa.multichild.parent@parent.dps-dlh.edu.in` | Same password `admin123`; see [DEMO_QA_MULTI_CHILD_PARENT.md](../../docs/DEMO_QA_MULTI_CHILD_PARENT.md) |

### School 2 — Kendriya Vidyalaya (KV-MUM)

| Tenant ID | `tenant_kv_mumbai_7p5n3x8q` |
|-----------|-----------------------------|
| School code | `KV-MUM` |

| Role | Email | Notes |
|------|-------|--------|
| ADMIN | `admin@kvmumbai1.gmail.com` | Domain from `kvmumbai1@gmail.com` in seeder |
| TEACHER | `aarav.sharma@kv-mum.edu.in` | Same 10-name pattern as DPS, different domain |
| PARENT | *(see root `DEMO_CREDENTIALS.md`)* | `@parent.kv-mum.edu.in` + admission token |
| PARENT (QA, multi-child) | `qa.multichild.parent@parent.kv-mum.edu.in` | Same password `admin123`; see [DEMO_QA_MULTI_CHILD_PARENT.md](../../docs/DEMO_QA_MULTI_CHILD_PARENT.md) |

**Library:** use teacher emails above (library flags on teacher **#1** and **#2**); there is no separate `LIBRARY_STAFF` user in this seed.

---

## Default tenant `t1` (Flyway baseline seed)

Inserted by **`V1__core_schema_reference_seed.sql`** (users + `tenant_configs` + default admin rows). **Password for all:** `admin123`

| Role | Email | School code | Tenant ID (DB) |
|------|-------|-------------|----------------|
| ADMIN | `admin@school.com` | `SCH001` | `t1` |
| TEACHER | `teacher@school.com` | `SCH001` | `t1` |
| PARENT | `parent@school.com` | `SCH001` | `t1` |

Extra **`t1`** academics (classes, Emma Chen, timetable samples, etc.) come from **`V7__demo_academic_outbox_import_jobs.sql`** (merged former V7 + V8 demo/outbox SQL), not from the showcase Java seed.

**Showcase vs `t1`:** DPS-DLH / KV-MUM are **only** created when you run the app with **`demo-seed`** (or equivalent) and **`app.demo-seed.enabled=true`**. Flyway alone does **not** insert those orgs.

---

## Frontend mock logins (`useMocks: true`)

Configured in `frontend/src/app/core/services/auth.service.ts`. **Not used** when the UI talks to the real `/api/v1/auth/login`.

| Role | Email | School code | Password |
|------|-------|-------------|----------|
| ADMIN | `admin@school.com` | `SCH001` | `admin123` |
| TEACHER | `teacher@school.com` | `SCH001` | `teacher123` |
| PARENT | `parent@school.com` | `SCH001` | `parent123` |
| SUPER_ADMIN | `superadmin@schoolvault.com` | `PLATFORM` | `super123` |

> **Note:** Mock passwords differ from the seeded DB for teacher, parent, and super admin. With **mocks off**, use **`admin123`** and the **backend** emails (showcase or `t1` tables above).

---

## Quick copy — showcase seed (`DemoDataSeedService`)

```
SUPER_ADMIN   superadmin@schoolerp.com           / admin123  / PLATFORM
ADMIN         admin@dpsdel.edu.in                / admin123  / DPS-DLH
TEACHER       aarav.sharma@dps-dlh.edu.in        / admin123  / DPS-DLH
ADMIN         admin@kvmumbai1.gmail.com          / admin123  / KV-MUM
TEACHER       aarav.sharma@kv-mum.edu.in         / admin123  / KV-MUM
PARENT        (run SQL in DEMO_CREDENTIALS.md)   / admin123  / DPS-DLH or KV-MUM
```

---

## Security reminder

Rotate or remove these accounts in any environment that holds real data. Do not reuse `admin123` in production for human users.
