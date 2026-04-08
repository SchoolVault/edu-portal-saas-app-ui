# SchoolVault ERP - Complete Project

## Two Repositories
1. **Backend** (Spring Boot) - `/app/backend-spring/` → Push to GitHub backend repo
2. **Frontend** (Angular 18) - `/app/frontend/` → Push to GitHub frontend repo

## Backend Stats
- 111 Java files, 2 SQL migrations, 3 config profiles
- 18 modules: Auth, Student, Teacher, Academic, Attendance, Timetable, Exams, Fees, Communication, Notification, Reports, Transport, Library, Hostel, Payroll, Documents, Audit, Settings
- 85+ REST API endpoints with Swagger annotations
- 25+ database tables with proper indexes

## Architecture
- Multi-tenant (tenant_id + TenantContext ThreadLocal)
- JWT + BCrypt + RBAC (@PreAuthorize)
- Redis rate limiting (120 req/min per tenant)
- RabbitMQ events (notifications, audit)
- Flyway migrations
- Docker + docker-compose

## Next: Push backend to GitHub, then integrate frontend
