# Demo & default login credentials

Use this sheet when testing against **seeded databases** or the **Angular mock** login. Passwords are for **non-production** demo use only.

---

## Which set applies?

| Scenario | Use section |
|----------|-------------|
| API + DB after **Flyway `V2__seed_data`** only (tenant `t1`, school `SCH001`) | [Default tenant `t1`](#default-tenant-t1-flyway-v2) |
| API + DB after **demo seed** (`DemoDataSeedService`, profiles `dev` / `demo-seed` with `app.demo-seed.enabled=true`) | [Showcase schools](#showcase-schools-demo-data-seed) |
| Angular **`useMocks: true`** (no backend auth) | [Frontend mock logins](#frontend-mock-logins-usemocks-true) |

Related: [DEMO_SHOWCASE_TENANT.md](./DEMO_SHOWCASE_TENANT.md) (how to run the seed).

---

## Showcase schools (demo data seed)

**Password for every user below:** `admin123`

Seeding fills **most** domain tables used by the ERP (academics, fees, transport, hostel, library, payroll, chat, import jobs, operations extensions, etc.). It does **not** pre-populate purely **runtime** tables (e.g. **`refresh_tokens`**) or **platform purge** jobs. After each deploy, run the **one-time** profile described in [DEMO_SHOWCASE_TENANT.md](./DEMO_SHOWCASE_TENANT.md), then return to **`prod`** only.

### Platform

| Role | Email | School code |
|------|-------|-------------|
| SUPER_ADMIN | `super.ops@schoolvault.edu` | `PLATFORM` |

### St. Xavier’s Heritage School

| Tenant ID | `tenant_stxaviers_heritage_k7m2n9p4` |
|-----------|--------------------------------------|
| School code | `STXHER-KOL` |

| Role | Email |
|------|-------|
| ADMIN | `principal@stxheritage.edu` |
| TEACHER | `d.sen@stxheritage.edu` |
| TEACHER | `m.iyer@stxheritage.edu` |
| TEACHER | `k.bose@stxheritage.edu` |
| PARENT | `s.banerjee.parent@stxheritage.edu` |
| PARENT | `a.khanna.parent@stxheritage.edu` |
| LIBRARY_STAFF | `library@stxheritage.edu` |
| STUDENT (preview JWT) | `student.preview@stxheritage.edu` |

### Meridian Ridge Academy

| Tenant ID | `tenant_meridian_ridge_pn_3q8w5r1x` |
|-----------|---------------------------------------|
| School code | `MRIDGE-PN` |

| Role | Email |
|------|-------|
| ADMIN | `principal@meridianridge.edu` |
| TEACHER | `s.patil@meridianridge.edu` |
| TEACHER | `d.fernandes@meridianridge.edu` |
| PARENT | `k.deshmukh.parent@meridianridge.edu` |
| STUDENT (preview JWT) | `student.preview@meridianridge.edu` |

---

## Default tenant `t1` (Flyway baseline seed)

Inserted by **`V1__core_init_seed.sql`** (users + `tenant_configs` + default admin rows). **Password for all:** `admin123`

| Role | Email | School code | Tenant ID (DB) |
|------|-------|-------------|----------------|
| ADMIN | `admin@school.com` | `SCH001` | `t1` |
| TEACHER | `teacher@school.com` | `SCH001` | `t1` |
| PARENT | `parent@school.com` | `SCH001` | `t1` |

Extra **`t1`** academics (classes, Emma Chen, timetable samples, etc.) come from later baseline scripts (e.g. **`V8__outbox_import_demo_jobs.sql`** and related demo inserts), not from the showcase Java seed.

**Showcase vs `t1`:** St. Xavier / Meridian are **only** created when you run the app with **`demo-seed`** (or **`prod-with-demo-seed`**) and **`app.demo-seed.enabled=true`**. Flyway alone does **not** insert those orgs.

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

## Quick copy — showcase (most complete demo)

```
SUPER_ADMIN   super.ops@schoolvault.edu     / admin123  / PLATFORM
ADMIN         principal@stxheritage.edu     / admin123  / STXHER-KOL
TEACHER       d.sen@stxheritage.edu        / admin123  / STXHER-KOL
PARENT        s.banerjee.parent@stxheritage.edu / admin123 / STXHER-KOL
```

---

## Security reminder

Rotate or remove these accounts in any environment that holds real data. Do not reuse `admin123` in production for human users.
