# Enterprise rollout documentation

| Phase | Doc | Summary |
|-------|-----|---------|
| 0 | [PHASE_0_STANDARDS.md](./PHASE_0_STANDARDS.md) | Module rules, API conventions, events, PII |
| 1 | [PHASE_1_MULTITENANT_OBSERVABILITY.md](./PHASE_1_MULTITENANT_OBSERVABILITY.md) | Async/WebSocket tenant + logging |
| 2 | [PHASE_2_CROSS_CUTTING_PORTS.md](./PHASE_2_CROSS_CUTTING_PORTS.md) | Notifications, audit, files, analytics ports |
| 3 | [PHASE_3_REPOSITORY_PORTS.md](./PHASE_3_REPOSITORY_PORTS.md) | Student & attendance persistence ports |
| 4 | [PHASE_4_DATA_LIFECYCLE.md](./PHASE_4_DATA_LIFECYCLE.md) | `deleted_at`, purge & archive jobs |
| — | [DATA_PURGE_AND_RETENTION.md](./DATA_PURGE_AND_RETENTION.md) | Full wipe (Super Admin) vs scheduled soft-delete cleanup |
| 5 | [PHASE_5_ANALYTICS_WAREHOUSE.md](./PHASE_5_ANALYTICS_WAREHOUSE.md) | Optional analytics DB + ETL stub |
| 6 | [PHASE_6_POLYGLOT_READINESS.md](./PHASE_6_POLYGLOT_READINESS.md) | Chat store + notification queue flexibility |
| 6b | [POLYGLOT_PERSISTENCE_SWITCHING.md](./POLYGLOT_PERSISTENCE_SWITCHING.md) | **How to switch** chat (JPA↔Mongo) & reports (OLTP↔warehouse) |

Frontend: keep `runtimeConfig.useMocks` aligned with backend `PageResponse` / `ApiResponse` shapes (see `frontend/src/app/core/config/runtime-config.ts`).
