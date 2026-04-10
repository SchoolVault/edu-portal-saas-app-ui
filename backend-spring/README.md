# SchoolVault ERP Backend

## Enterprise Multi-Tenant School ERP System

### Tech Stack
- Java 17 + Spring Boot 3.2
- MySQL 8 (Aiven-compatible)
- Redis / Valkey (TLS via `rediss://` or `REDIS_SSL=true`; Aiven-compatible)
- RabbitMQ
- Flyway (DB migrations)
- JWT Authentication
- SpringDoc OpenAPI (Swagger)

### Local development (two profiles)

| Profile | When to use | Infra | Notes |
|--------|-------------|--------|--------|
| **`dev`** (default) | Fastest IDE debugging | **MySQL only** | Redis & Rabbit autoconfig **off** — no Docker for cache/broker. Set `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` (local or Aiven). |
| **`local`** | Full stack like prod, on your machine | **Docker Desktop** | Start DB + Redis + Rabbit, then run the JVM on the host with defaults that match `docker-compose.yml`. |

**Option A — minimal (profile `dev`, default)**

```bash
# MySQL only: local install or Docker on 3306, database you configure via DB_*.
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Option B — Docker Desktop parity (profile `local`)**

```bash
cd backend-spring
./scripts/run-local-with-docker-infra.sh   # or: docker compose up -d mysql redis rabbitmq
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Defaults for `local`: `school_erp` @ `localhost:3306`, `root` / `rootpassword`, Redis `localhost:6379`, RabbitMQ `localhost:5672` (`guest`/`guest`). Override with `DB_*`, `REDIS_*`, `RABBITMQ_*` if needed.

**Run everything in containers (no local JVM)**

```bash
docker compose up --build
```

**Production** uses `SPRING_PROFILES_ACTIVE=prod` and Aiven (or any) MySQL / Valkey / Rabbit — see `deploy/render.env.example`.

### Redis cache (tenant isolation + TTL)

Spring Cache uses Redis when `CACHE_TYPE=redis` (default in `application.yml`). Cache keys are **never global**:

- **`tenantKeyGenerator`** — key = current `TenantContext` tenant id (transport routes, payroll structures).
- **`tenantUserRoleKeyGenerator`** — key = `tenantId:userId:role` (announcement previews).

Redis key prefix defaults to `sv::` (override `CACHE_REDIS_KEY_PREFIX`). Rate-limit counters use `REDIS_KEY_NAMESPACE` (default `sv`).

**Aiven Valkey:** set `SPRING_DATA_REDIS_URL` to the console **Service URI** (`rediss://...`) in secrets only, or set `REDIS_HOST` / `REDIS_PORT` / `REDIS_USERNAME` / `REDIS_PASSWORD` / `REDIS_SSL=true`. Tune TTLs with `CACHE_TTL_*` env vars (see `application.yml`).

### Swagger UI
- Local: http://localhost:8080/swagger-ui.html
- API Docs: http://localhost:8080/api-docs

### Default Credentials
| Role | Email | Password | School Code |
|------|-------|----------|-------------|
| Admin | admin@school.com | admin123 | SCH001 |
| Teacher | teacher@school.com | admin123 | SCH001 |
| Parent | parent@school.com | admin123 | SCH001 |

### API Modules (18 modules, 120+ endpoints)

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Login, Register, Profile |
| Students | `/api/v1/students` | CRUD, Bulk Upload, Promotion |
| Teachers | `/api/v1/teachers` | CRUD, Subject Assignment |
| Academic | `/api/v1/academic` | Years, Classes, Sections |
| Attendance | `/api/v1/attendance` | Mark, Reports, Statistics |
| Timetable | `/api/v1/timetable` | Schedule Management |
| Exams | `/api/v1/exams` | Exams, Marks, Grades |
| Fees | `/api/v1/fees` | Structures, Payments, Receipts |
| Communication | `/api/v1/communication` | Announcements |
| Notifications | `/api/v1/notifications` | User Notifications |
| Reports | `/api/v1/reports` | Dashboard KPIs, Analytics |
| Transport | `/api/v1/transport` | Routes, Stops, Vehicles |
| Library | `/api/v1/library` | Books, Issues, Returns |
| Hostel | `/api/v1/hostel` | Rooms, Allocations |
| Payroll | `/api/v1/payroll` | Salary, Payslips |
| Documents | `/api/v1/documents` | File Management |
| Audit | `/api/v1/audit` | Action Trail |
| Settings | `/api/v1/settings` | Tenant Configuration |

### Architecture
```
Controller -> Service -> Repository -> MySQL
     |            |
    DTO      TenantContext (ThreadLocal)
     |            |
  Swagger    JWT Filter -> Tenant Isolation
                  |
             Redis Cache + RabbitMQ Events
```

### Multi-Tenant
- Every table has `tenant_id` column
- JWT token contains `tenantId`, extracted by filter
- TenantContext (ThreadLocal) auto-injected into all queries

### Environment Variables
```env
DB_URL=jdbc:mysql://host:3306/school_erp
DB_USERNAME=root
DB_PASSWORD=secret
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
RABBITMQ_HOST=localhost
JWT_SECRET=your-base64-encoded-secret
CORS_ORIGINS=http://localhost:4200
```
