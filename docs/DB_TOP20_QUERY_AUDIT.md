# DB Top-20 Query Audit (Phase 1)

This document captures the Phase-1 process for finding and fixing slow OLTP report queries with evidence.

## Scope Completed In This Phase

- Replaced class-summary N+1 style loops with batched aggregate queries in `OltpReportQueryAdapter`.
- Added repository-level aggregate methods for:
  - student count by class
  - section count by class
  - attendance (present/total) by class/day
  - marks performance average by class
  - fee collected/total/overdue by class
- Added Flyway migration `V25__phase1_query_path_indexes.sql` with query-path composite indexes.

## Target Endpoints

The top report endpoints to profile in staging:

1. `GET /api/v1/reports/class-summary`
2. `GET /api/v1/reports/class-summary/paged`
3. `GET /api/v1/reports/teacher-workload`
4. `GET /api/v1/reports/teacher-workload/paged`
5. `GET /api/v1/reports/attendance-summary`

## Query Evidence Playbook

For each endpoint:

1. Run load with realistic tenant size (recommended: 2,500 students demo tenant).
2. Capture slow SQL from MySQL slow log / performance schema.
3. Run `EXPLAIN ANALYZE` for top statements.
4. Record rows scanned, actual time, and chosen index.
5. Keep only indexes with measured impact.

## Evidence Table (fill during staging run)

| Endpoint | SQL shape | Before p95 | After p95 | Rows scanned before | Rows scanned after | Index used |
|---|---|---:|---:|---:|---:|---|
| `/reports/class-summary` | class aggregates | TBD | TBD | TBD | TBD | `idx_*` |
| `/reports/teacher-workload` | teacher + timetable + assignment | TBD | TBD | TBD | TBD | `idx_*` |
| `/reports/attendance-summary` | class + month attendance | TBD | TBD | TBD | TBD | `idx_*` |

## Exit Criteria

- No broad `findAll` style class-summary path in runtime-critical report endpoints.
- All top report endpoints have query evidence (`EXPLAIN ANALYZE`) documented.
- Index additions are validated with measured improvements and no major write regression.
