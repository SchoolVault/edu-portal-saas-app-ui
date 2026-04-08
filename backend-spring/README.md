# SchoolVault ERP Backend

## Enterprise Multi-Tenant School ERP System

### Tech Stack
- Java 17 + Spring Boot 3.2
- MySQL 8 (Aiven-compatible)
- Redis (Upstash-compatible)
- RabbitMQ
- Flyway (DB migrations)
- JWT Authentication
- SpringDoc OpenAPI (Swagger)

### Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d mysql redis rabbitmq

# 2. Build
mvn clean package -DskipTests

# 3. Run
java -jar target/school-erp-1.0.0.jar --spring.profiles.active=dev

# Or use docker-compose for everything
docker-compose up --build
```

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
