# Phase 1 — Multi-tenant hardening & observability

## Technical

- **Async (`@Async`):** A `TaskDecorator` copies **tenant context** and **MDC** (trace, tenant, user, role) onto worker threads and clears them in `finally`, so background jobs log and query with the same isolation intent as HTTP.
- **After-commit domain listeners:** Async listeners set `TenantContext` from the **event’s `tenantId`** before publishing analytics or calling outbound HTTP clients (HTTP request context may already be cleared).
- **Import jobs:** Already set tenant explicitly; MDC is inherited from the submitting request when the task is queued.
- **Tenant purge async:** Processor sets `TenantContext` from the purge job row before running `TenantDataPurgeExecutor`.
- **WebSocket (STOMP):** On each inbound message, CONNECT may set context; **`afterSendCompletion`** clears `TenantContext` and tenant/user MDC keys to avoid broker thread leaks.

## Plain language

Background work (imports, analytics hooks, tenant deletion) now **carries the school context safely** and **cleans up** so one connection’s school doesn’t stick to the next. Logs in support tools stay **traceable** without mixing schools.
