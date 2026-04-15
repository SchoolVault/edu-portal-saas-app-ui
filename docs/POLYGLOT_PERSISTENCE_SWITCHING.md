# Polyglot persistence — how to switch backends

This guide describes **runtime switches** for chat message storage (MySQL vs MongoDB) and report/dashboard reads (OLTP vs warehouse adapter). It complements the short summary in [PHASE_6_POLYGLOT_READINESS.md](./PHASE_6_POLYGLOT_READINESS.md) and the env examples in [deploy/render.env.example](../deploy/render.env.example).

---

## Quick reference

| Concern | Default | Switch via | Required extra config |
|--------|---------|------------|------------------------|
| **Chat message bodies** | MySQL (`jpa`) | `APP_CHAT_MESSAGE_STORE=mongo` | `SPRING_DATA_MONGODB_URI` |
| **Chat conversations / participants** | MySQL only | — | Not movable by flags; always JPA |
| **Reports & dashboards** | OLTP (`oltp`) | `APP_REPORTS_BACKEND=warehouse` | Today: same behavior (delegates to OLTP); later: analytics JDBC |

All keys also map through `backend-spring/src/main/resources/application.yml` (see `app.chat`, `app.reports`, `spring.data.mongodb`).

---

## 1. Chat messages: MySQL (JPA) → MongoDB

### What moves

- **Stored in MongoDB** when `mongo` is active: documents in collection `chat_messages`, plus `chat_counters` for monotonic numeric message IDs (APIs keep `Long` ids).
- **Stays in MySQL**: `chat_conversations`, `chat_participants`, users, tenants — `ChatService` still uses JPA for those.

### Why Mongo auto-config is off globally

The main application class excludes Spring Boot’s Mongo auto-configuration so **local and default deploys do not need** a Mongo URI when `app.chat.message-store=jpa`. Mongo clients and `MongoTemplate` are created only when `message-store=mongo` (see `com.school.erp.modules.chat.mongo.ChatMongoConfiguration`).

### Steps to enable Mongo (e.g. Atlas)

1. **Atlas (or any MongoDB 4.4+)**  
   - Create a database user and a cluster.  
   - **Network access**: allow the application egress IPs (or your laptop IP for local tests).  
   - Copy the **SRV connection string** (`mongodb+srv://...`).

2. **URL-encode the password** if it contains `@`, `#`, `/`, spaces, etc.

3. **Set environment variables** (Render, Kubernetes, IDE run config, etc.):

   ```bash
   APP_CHAT_MESSAGE_STORE=mongo
   SPRING_DATA_MONGODB_URI='mongodb+srv://USER:ENCODED_PASSWORD@cluster.xxxxx.mongodb.net/DATABASE?retryWrites=true&w=majority'
   ```

   The **database name** in the URI is used as the Mongo database (if omitted, the code defaults to `school_erp_chat` — see `ChatMongoConfiguration`).

4. **Redeploy / restart** the API. No change to the Angular app is required for the switch.

5. **Indexes** are ensured on startup (`ChatMongoIndexInitializer`): tenant + conversation + soft-delete + id; sparse index on `clientMessageId` for deduplication.

### Validation and idempotency

- Shared rules live in `com.school.erp.modules.chat.validation.ChatMessagePayloadValidator` (used by both JPA and Mongo adapters).  
- **Duplicate `clientMessageId`** in the same tenant + conversation is rejected in the Mongo adapter (HTTP layer should map `BusinessException` as today).

### Operational notes

- **No cross-store transaction**: updating `last_message_at` / preview on MySQL and inserting the row in Mongo are **not** one atomic transaction. Brief inconsistency is possible if the process crashes between the two; retries/idempotency on the client help.  
- **Existing MySQL `chat_messages`**: historical rows are **not** migrated automatically. Plan a one-off ETL or accept “new messages only” in Mongo until you run a migration.  
- **Flyway** may still create an empty `chat_messages` table in MySQL; with `mongo`, new message writes go to Mongo only.

### Switch back to MySQL

```bash
APP_CHAT_MESSAGE_STORE=jpa
# Omit or ignore SPRING_DATA_MONGODB_URI for jpa-only processes
```

Redeploy. New messages then go to MySQL again; Mongo data remains until you purge it.

### Relevant classes

| Role | Class |
|------|--------|
| Port | `ChatMessageStorePort` |
| MySQL | `JpaChatMessageStoreAdapter` |
| MongoDB | `MongoChatMessageStoreAdapter` |
| Wiring | `ChatMongoConfiguration`, `ChatMongoSequenceService`, `ChatMongoIndexInitializer` |
| Domain API | `ChatService` (unchanged) |

---

## 2. Reports & dashboards: OLTP → warehouse adapter

### Intent

Report HTTP endpoints stay on `ReportService`, but **data loading** is behind `ReportQueryPort`:

| Implementation | Property | Behavior |
|----------------|----------|----------|
| **OLTP (JPA)** | `app.reports.backend=oltp` (default) | `OltpReportQueryAdapter` — same queries as before refactor. |
| **Warehouse** | `app.reports.backend=warehouse` | `WarehouseReportQueryAdapter` is `@Primary`; **currently delegates every call to `OltpReportQueryAdapter`**. |

So flipping to `warehouse` today is a **routing test** only; it does **not** reduce MySQL load until you implement JDBC (or another client) inside `WarehouseReportQueryAdapter` for heavy aggregates and optionally fall back to OLTP for rare paths.

### Steps

**Default (production today):**

```bash
APP_REPORTS_BACKEND=oltp
```

**Prepare for analytics DB (no behavior change yet):**

```bash
APP_REPORTS_BACKEND=warehouse
```

Restart the API. Controllers are unchanged.

### Future work (not automated here)

- Provision an analytics database (read replica, star schema, ClickHouse, etc.).  
- Add a dedicated `DataSource` / `JdbcTemplate` (see `app.analytics.datasource.*` and [PHASE_5_ANALYTICS_WAREHOUSE.md](./PHASE_5_ANALYTICS_WAREHOUSE.md)).  
- Replace method bodies in `WarehouseReportQueryAdapter` with warehouse SQL where beneficial; keep OLTP delegation for reports you have not migrated.

### Read replica (same schema, different host)

If you only need **read scaling** on MySQL with **identical** schema, you can still use the existing read-replica routing (`READ_DATASOURCE_URL` / `app.datasource.read.*`) together with `@Transactional(readOnly = true)` on read paths — that is separate from `APP_REPORTS_BACKEND=warehouse` but pairs well with OLTP-backed reports.

### Relevant classes

| Role | Class |
|------|--------|
| Port | `ReportQueryPort` |
| OLTP | `OltpReportQueryAdapter` |
| Warehouse façade | `WarehouseReportQueryAdapter` |
| HTTP façade | `ReportService` |

---

## 3. Render / production checklist

- [ ] Chat: if using Mongo, set `SPRING_DATA_MONGODB_URI` as a **secret**; never commit URIs.  
- [ ] Chat: Atlas **Network Access** matches Render outbound IPs (or temporary `0.0.0.0/0` only for non-production trials).  
- [ ] Reports: leave `APP_REPORTS_BACKEND=oltp` until warehouse SQL exists.  
- [ ] CORS and WebSocket origins still point at the real UI host after URL changes.  

Copy-paste oriented variable names and comments: **[deploy/render.env.example](../deploy/render.env.example)**.

---

## 4. Related documentation

- [PHASE_6_POLYGLOT_READINESS.md](./PHASE_6_POLYGLOT_READINESS.md) — high-level polyglot goals.  
- [PHASE_5_ANALYTICS_WAREHOUSE.md](./PHASE_5_ANALYTICS_WAREHOUSE.md) — analytics datasource and ETL stub.  
- [PHASE_3_REPOSITORY_PORTS.md](./PHASE_3_REPOSITORY_PORTS.md) — other persistence ports (student, attendance).
