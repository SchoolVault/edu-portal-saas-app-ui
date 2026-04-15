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

### Demo / showcase tenant (production)

Use one dedicated tenant in the **live** database for prospects (admin / teacher / parent logins). The UI is identical to customer schools; only data and credentials differ. Seed that tenant with realistic, rich records (classes, students, fees, etc.) via Flyway SQL or a controlled admin import — keep it isolated by `tenant_id` / school code so it never mixes with paying customers’ data.

### Profiles (dev, prod-shaped staging, production)

| Profile | When to use | Infra | Notes |
|--------|-------------|--------|--------|
| **`dev`** (default) | Fastest IDE debugging | **MySQL only** | Redis & Rabbit autoconfig **off**. Set `DEV_DB_*` or cloud `DB_*` per `application.yml` / `application-dev.yml`. |
| **`ml`** | Dev / integration testing (e.g. Render “ml”, Docker full stack) | **MySQL + Redis + RabbitMQ** | Same **shape** as `prod`: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, Valkey/Redis (`REDIS_SSL` as appropriate), Flyway `clean-disabled`, Swagger/actuator locked down by default. Optional demo seed: `ml-with-demo-seed` or `ml,demo-seed`. |
| **`rel`** | QA sign-off / pre-prod (e.g. Render “rel”) | **Same as `ml`** | Identical YAML to `ml`; use a **separate** DB/Redis/CORS/JWT secret namespace in env so QA never collides with `ml`. Optional demo seed: `rel-with-demo-seed` or `rel,demo-seed`. |
| **`prod`** | Live customers | **Managed MySQL + Valkey + RabbitMQ** | `SPRING_PROFILES_ACTIVE=prod`. Demo seed: `prod-with-demo-seed` or `prod,demo-seed` (one-time), then `prod` only. |

**Option A — minimal (profile `dev`, default)**

```bash
# MySQL only: local install or Docker on 3306, database you configure via DB_*.
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Option B — Docker Desktop parity (profile `ml`, prod-shaped)**

```bash
cd backend-spring
./scripts/run-local-with-docker-infra.sh   # or: docker compose up -d mysql redis rabbitmq
export DB_URL='jdbc:mysql://localhost:3306/school_erp?useSSL=false&serverTimezone=UTC&createDatabaseIfNotExist=true'
export DB_USERNAME=root
export DB_PASSWORD=rootpassword
export REDIS_HOST=localhost
export REDIS_SSL=false
export RABBITMQ_HOST=localhost
mvn spring-boot:run -Dspring-boot.run.profiles=ml
```

Compose `app` service sets `SPRING_PROFILES_ACTIVE=ml`, `REDIS_SSL=false`, and service hostnames for Redis/Rabbit. Override `DB_*`, `REDIS_*`, `RABBITMQ_*`, `JWT_SECRET`, `CORS_ORIGINS` in Render for **`ml`** / **`rel`** services.

**Run everything in containers (no local JVM)**

```bash
docker compose up --build
```

**Production** uses `SPRING_PROFILES_ACTIVE=prod` and managed MySQL / Valkey / Rabbit. **Render / staging:** set `SPRING_PROFILES_ACTIVE=ml` or `=rel` with the same env contract as prod (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, Redis, Rabbit, `JWT_SECRET`, `CORS_ORIGINS`, etc.).

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
