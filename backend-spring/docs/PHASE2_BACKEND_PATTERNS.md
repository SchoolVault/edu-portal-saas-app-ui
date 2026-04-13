# Phase 2 — Backend & frontend patterns (incremental)

Summary of what was added in this pass: domain events after commit, Resilience4j on external-style calls, richer API errors, cache façade + regions, optional slow-query JDBC proxy, CORS exposure for trace headers, and lightweight frontend i18n + support trace UI.

## Domain events (`@TransactionalEventListener(AFTER_COMMIT)`)

- **Events** (immutable records under `com.school.erp.events.domain`):
  - `FeePaymentRecordedEvent` — published from `FeeService.recordPayment` after `save`.
  - `StudentEnrollmentChangedEvent` — published when `StudentService.updateStudent` changes class or section.
  - `StudentAdmittedEvent` — published when `StudentService.createStudent` completes.
- **Listener** `DomainEventAfterCommitListener`: `@Async` + `TransactionPhase.AFTER_COMMIT`. Logs, forwards to `AnalyticsEventPublisher`, and optionally POSTs to HTTP hooks (below). Swap the analytics bean for Segment/Kafka later without touching modules.

## Resilience4j (payment, email hook, webhook hook)

- **Dependency**: `io.github.resilience4j:resilience4j-spring-boot3` (requires existing `spring-boot-starter-aop`).
- **Configuration**: `resilience4j.circuitbreaker.instances` / `resilience4j.retry.instances` for `paymentGateway`, `emailProvider`, `partnerWebhook` in `application.yml`.
- **Payment**: `@CircuitBreaker` + `@Retry` on `RazorpayPaymentGatewayClient.create` / `confirm` (real HTTP to Razorpay).
- **Email / webhooks**: `OutboundEmailHttpClient` and `OutboundWebhookHttpClient` — **no HTTP** until URLs are set; annotations apply when you do call out. Intended for future SendGrid/worker bridges and tenant subscriber URLs.

### Env / properties (integration)

| Variable / property | Purpose |
|---------------------|--------|
| `APP_INTEGRATION_EMAIL_TRIGGER_URL` / `app.integration.email.trigger-url` | Optional POST target for domain-event notification triggers. |
| `APP_INTEGRATION_WEBHOOK_URL` / `app.integration.webhook.url` | Optional partner webhook URL (JSON body: `eventType`, `tenantId`, `attributes`). |

## API errors: stable `errorCode` + `traceId`

- `ApiResponse` adds optional `errorCode` and `traceId` (same value as MDC `traceId` / response header `X-Request-Id`).
- `ApiErrorCode` enum values used by `GlobalExceptionHandler` (e.g. `RESOURCE_NOT_FOUND`, `VALIDATION_FAILED`, `INTERNAL_ERROR`).
- Frontend `UserFacingHttpError` and `mapHttpErrorResponseToUserMessage` parse `errorCode` / `traceId` for support and future i18n keys.

## CORS

- `SecurityConfig`: `exposedHeaders` includes `X-Request-Id`, `X-Correlation-Id` so browsers can read them for the support footer.

## Cache façade (`CacheService`)

- `com.school.erp.cache.CacheService` with `CacheRegion` enum aligned to Spring cache names.
- **New Redis cache names** (TTLs via `app.cache.ttl.*` / env `CACHE_TTL_*`): `referenceData`, `permissions`, `tenantConfig`, `reportResults` (plus existing transport / announcements / payroll).
- **Conditional**: `@ConditionalOnBean(CacheManager.class)` — absent when `spring.cache.type=none` (e.g. local `dev` profile without Redis).

### Env / properties (cache TTL)

| Env | Maps to |
|-----|---------|
| `CACHE_TTL_REFERENCE_DATA` | `reference-data` |
| `CACHE_TTL_PERMISSIONS` | `permissions` |
| `CACHE_TTL_TENANT_CONFIG` | `tenant-config` |
| `CACHE_TTL_REPORT_RESULTS` | `report-results` |

## Slow-query logging (datasource-proxy)

- **Dependency**: `net.ttddyy:datasource-proxy`.
- **Config**: `app.datasource.slow-query.enabled`, `app.datasource.slow-query.threshold-ms`.
- **Behaviour**: `SlowQueryDataSourceWrapConfiguration` wraps each `HikariDataSource` with `SLF4JSlowQueryListener` when enabled.
- **`application-dev.yml`**: enables slow-query logging at **500 ms** by default for local profiling.

### Env

| Env | Purpose |
|-----|--------|
| `APP_DATASOURCE_SLOW_QUERY_ENABLED` | `true` to wrap pools (prod only when diagnosing). |
| `APP_DATASOURCE_SLOW_QUERY_THRESHOLD_MS` | Threshold in milliseconds. |

## Frontend

- **`I18nService`**: in-memory `en` / `hi` strings (no new npm packages). Layout footer includes language selector; extend `MESSAGES` for more keys.
- **`SupportContextService`** + **`traceResponseInterceptor`**: stores last `X-Request-Id` from successful responses; errors also push `traceId` from JSON body when present.
- **Layout footer**: shows reference id and copy button for support.

## Operational notes

- Circuit breakers surface on Actuator if you add `circuitbreakers` to `management.endpoints.web.exposure.include` (optional).
- Domain events are in-process today; for multiple app instances use the same listener pattern on an outbox or message bus.
