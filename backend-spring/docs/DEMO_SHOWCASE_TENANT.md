# Demo / production showcase org — full seed setup

## What you get

- **Flyway** creates the schema (all migrations). **Java seed** fills realistic rows for sales/E2E demos.
- **`DemoDataSeedService`** (core): two showcase schools, platform **SUPER_ADMIN**, academics, fees, attendance, timetable, exams, transport, hostel, library, payroll, documents, audit, leave, chat, communications, guardians, fee payment attempts.
- **`DemoExtendedTablesSeed`** (modular add-on): operations (**inventory**, **operational staff**, **gate passes**, **visitor logs**, **fee reminder queue**), **attendance cover** assignments — idempotent per tenant via an inventory marker SKU.

New or rarely used domain tables can follow the same pattern: add a small `@Service` under `com.school.erp.bootstrap.demo` and invoke it from `DemoDataSeedService.seedIfNeeded()`.

## Profiles and properties

| Piece | Purpose |
|--------|--------|
| `dev` | Local development; `application-dev.yml` sets `app.demo-seed.enabled=true`. |
| `showcase-seed` | Legacy alias for enabling the same beans as `demo-seed`. |
| `demo-seed` | Enables `DemoDataSeedService`, `DemoExtendedTablesSeed`, `DemoDataSeedRunner` (with `enabled=true`). |
| `app.demo-seed.enabled` | Must be `true` for the runner to execute; default `false` in root `application.yml`, forced `false` in `prod`. |

**Production-style DB, one-time load**

1. Run migrations (normal `prod` startup or `flyway migrate`).
2. Start with **both** `prod` and `demo-seed`, with seed enabled:

   ```bash
   export SPRING_PROFILES_ACTIVE=prod,demo-seed
   ```

   Put **`demo-seed` after `prod`** so `application-demo-seed.yml` overrides `app.demo-seed.enabled` to `true`.

   Or use the profile group:

   ```bash
   export SPRING_PROFILES_ACTIVE=prod-with-demo-seed
   ```

3. Wait for log: `Demo data seed complete ...`
4. Redeploy or restart with **`prod` only** (`demo-seed` off, `app.demo-seed.enabled=false`). Data stays in the database; seed beans are not loaded, so nothing re-inserts.

Use a **dedicated database or tenant namespace** for this showcase org; do not run the seed against live customer data.

## Demo logins (password `admin123` everywhere)

| Role | School / context | Email | School code |
|------|------------------|-------|-------------|
| **SUPER_ADMIN** | Platform | `super.ops@schoolvault.edu` | `PLATFORM` |
| **ADMIN** | St. Xavier's Heritage | `principal@stxheritage.edu` | `STXHER-KOL` |
| **TEACHER** | St. Xavier's | `d.sen@stxheritage.edu` (also `m.iyer`, `k.bose`) | `STXHER-KOL` |
| **PARENT** | St. Xavier's | `s.banerjee.parent@stxheritage.edu` | `STXHER-KOL` |
| **LIBRARY_STAFF** | St. Xavier's | `library@stxheritage.edu` | `STXHER-KOL` |
| **STUDENT** (preview JWT) | St. Xavier's | `student.preview@stxheritage.edu` | `STXHER-KOL` |
| **ADMIN** | Meridian Ridge | `principal@meridianridge.edu` | `MRIDGE-PN` |
| **TEACHER** | Meridian Ridge | `s.patil@meridianridge.edu`, `d.fernandes@meridianridge.edu` | `MRIDGE-PN` |
| **PARENT** | Meridian Ridge | `k.deshmukh.parent@meridianridge.edu` | `MRIDGE-PN` |
| **STUDENT** (preview JWT) | Meridian Ridge | `student.preview@meridianridge.edu` | `MRIDGE-PN` |

Tenant ids (for support): `tenant_stxaviers_heritage_k7m2n9p4`, `tenant_meridian_ridge_pn_3q8w5r1x`.

## Idempotency

- Core tenants are gated by **school codes** (`STXHER-KOL`, `MRIDGE-PN`).
- Bulk extensions use markers (e.g. announcement titles, fee structure names).
- Extended operations module uses inventory SKU `DEMO-EXT-MARKER_<school_code>` per tenant.
- **SUPER_ADMIN** platform user is created only if `super.ops@schoolvault.edu` + `PLATFORM` is absent.

Re-running the seed with `enabled=true` is safe; it fills gaps without duplicating baseline tenants.

## Frontend

Use the same API base URL as production; point the UI at the demo school code and a demo user. With **mocks off**, the UI reflects this seeded data.
