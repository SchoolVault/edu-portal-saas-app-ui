# Phase 1 — Foundation seams (what changed)

This phase adds **optional** infrastructure seams so you can scale reads, plug analytics/search/messaging, protect mutating APIs, correlate logs, and enforce migration hygiene—without rewriting feature modules.

## 1. Read-replica routing (optional)

| Item | Detail |
|------|--------|
| **Behavior** | When a non-blank read JDBC URL is configured, the primary `DataSource` becomes a router: writes use the primary pool; connections opened inside `@Transactional(readOnly = true)` use the read pool. |
| **Code** | `com.school.erp.config.datasource.ReadReplicaDataSourceConfiguration`, `ReadWriteRoutingDataSource`, `ReadReplicaEnabledCondition` |
| **Flyway** | Migrations run only against the **write** datasource (`@FlywayDataSource` on the write pool). |

**Environment / properties**

| Variable / property | Purpose |
|---------------------|---------|
| `READ_DATASOURCE_URL` → `app.datasource.read.url` | Replica JDBC URL; **unset = feature off** (normal single-DB mode). |
| `READ_DB_USERNAME`, `READ_DB_PASSWORD` | Optional; default to primary `spring.datasource` credentials. |
| `READ_DB_DRIVER` → `app.datasource.read.driver-class-name` | Optional JDBC driver class. |
| `READ_DB_POOL_MAX`, `READ_DB_POOL_MIN_IDLE` | Optional Hikari sizing for the read pool. |

**Usage:** Add `@Transactional(readOnly = true)` on **service** methods that are query-only. Repositories alone do not set transaction boundaries unless you enable that pattern explicitly.

---

## 2. Platform ports (analytics, search, domain events)

| Port | Interface | Default bean |
|------|-----------|--------------|
| Analytics | `com.school.erp.platform.port.AnalyticsEventPublisher` | No-op (trace logging only at TRACE). |
| Search | `com.school.erp.platform.port.SearchIndexService` | No-op. |
| Domain events | `com.school.erp.platform.port.DomainEventPublisher` | `SpringDomainEventPublisher` → `ApplicationEventPublisher`. |

**Configuration:** `com.school.erp.platform.PlatformPortConfiguration` registers defaults with `@ConditionalOnMissingBean`. Replace any interface with your own `@Bean` to wire ClickHouse, OpenSearch, Kafka/outbox, etc., without touching modules.

---

## 3. Idempotency filter (Redis)

| Item | Detail |
|------|--------|
| **Behavior** | For `POST` / `PUT` / `PATCH` under `/api/**`, if the client sends `Idempotency-Key`, the first **2xx** response body (up to a size limit) is stored in Redis and replayed for duplicate requests. Concurrent duplicates while the first is running receive **409 Conflict**. |
| **Scope hash** | Tenant id, user id, HTTP method, request URI, query string, and idempotency key. **Request body is not hashed** (avoids buffering); clients must not reuse a key for different payloads on the same endpoint. |
| **Placement** | Servlet filter **after** `JwtAuthenticationFilter` (see `SecurityConfig`). |
| **Skips** | `multipart/*`, bodies larger than `max-body-bytes` (bypass idempotency for that request). |

**Environment / properties**

| Variable / property | Default | Purpose |
|---------------------|---------|---------|
| `APP_IDEMPOTENCY_ENABLED` → `app.idempotency.enabled` | `true` | Master switch. |
| `APP_IDEMPOTENCY_FAIL_OPEN` → `app.idempotency.fail-open-on-redis-error` | `true` | If Redis fails, continue the request (availability). Set `false` for strict safety (returns 503). |
| `APP_IDEMPOTENCY_RESPONSE_TTL` | `86400` | Seconds to keep cached success responses. |
| `APP_IDEMPOTENCY_LOCK_TTL` | `120` | In-flight lock TTL (seconds). |
| `APP_IDEMPOTENCY_MAX_BODY` | `262144` | Max response body size stored (bytes). |
| `APP_IDEMPOTENCY_MAX_KEY_LEN` | `128` | Max `Idempotency-Key` length. |
| `REDIS_KEY_NAMESPACE` / `app.redis.key-namespace` | `sv` | Prefix for Redis keys (`…::idem:v1:…`). |

**Requires:** `StringRedisTemplate` (Spring Data Redis). If Redis is not available in an environment, set `APP_IDEMPOTENCY_ENABLED=false` or rely on fail-open.

---

## 4. MDC: traceId, correlationId, tenantId, userId

| Item | Detail |
|------|--------|
| **Change** | `CorrelationMdcFilter` now sets **both** `traceId` and `correlationId` MDC keys to the same value (from `X-Request-Id` / `X-Correlation-Id` or a generated UUID). |
| **Removed** | `HttpRequestLoggingInterceptor` no longer generates a second correlation id (it was diverging from the servlet filter). |
| **JWT** | `JwtAuthenticationFilter` still sets `tenantId`, `userId`, `userRole` in MDC for authenticated requests. |

Log pattern in `application.yml` already references `correlationId`, `traceId`, `tenantId`, `userId`.

---

## 5. Flyway policy (startup + health)

| Item | Detail |
|------|--------|
| **Component** | `com.school.erp.bootstrap.FlywaySchemaPolicy` implements `ApplicationRunner` and `HealthIndicator`. |
| **Startup** | After Flyway runs, if `app.flyway.policy.fail-on-pending` is `true`, the app fails fast when any migration is **FAILED** or still **PENDING**. |
| **Health** | Actuator health includes this contributor (bean name drives the key in the composite health JSON). |

**Environment / properties**

| Variable / property | Default | Purpose |
|---------------------|---------|---------|
| `FLYWAY_VALIDATE_ON_MIGRATE` → `spring.flyway.validate-on-migrate` | `true` | Validates applied migrations vs classpath (checksums). |
| `APP_FLYWAY_FAIL_ON_PENDING` → `app.flyway.policy.fail-on-pending` | `true` | Strict post-migrate policy; set `false` only if you intentionally run migrations out-of-band and accept looser checks. |

---

## 6. Deferred (by design)

Repository → domain interface rewrites stay **out of scope** until a second persistence style or bounded context justifies the cost.

---

## Quick reference — new / touched files

| Area | Files |
|------|--------|
| Read replica | `config/datasource/*` |
| Ports | `platform/PlatformPortConfiguration.java`, `platform/port/*`, `platform/port/internal/*` |
| Idempotency | `common/idempotency/*`, `config/IdempotencyConfiguration.java`, `security/SecurityConfig.java` |
| Flyway policy | `bootstrap/FlywaySchemaPolicy.java` |
| MDC | `common/logging/MdcKeys.java`, `CorrelationMdcFilter.java`, `HttpRequestLoggingInterceptor.java` |
| Config | `application.yml` (`spring.flyway.validate-on-migrate`, `app.datasource.read`, `app.flyway.policy`, `app.idempotency`) |
