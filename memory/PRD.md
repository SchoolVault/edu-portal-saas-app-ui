# SchoolVault ERP - Complete System

## Two GitHub Repositories

### 1. Backend Repo: `/app/backend-spring/`
- 127+ Java files, 18 modules, 105 API endpoints
- Spring Boot 3.2 + MySQL + Redis + RabbitMQ
- JWT auth, multi-tenant, rate limiting, Flyway migrations
- `docker-compose up --build` to run

### 2. Frontend Repo: `/app/frontend/`
- Angular 18, 18 feature modules, Bootstrap 5
- All 10 services integrated with dual-mode (mock + HTTP)
- Toggle: `src/environments/environment.ts` → `useMocks: true/false`
- `yarn start` to run

## Integration Flow
1. Push backend to GitHub repo → `docker-compose up`
2. In frontend `environment.ts`, set `useMocks: false` and `apiUrl: 'http://localhost:8080/api/v1'`
3. Push frontend to GitHub repo → `yarn start`
4. Login at http://localhost:3000 → calls http://localhost:8080/api/v1/auth/login

## All Done
- Frontend: 18 modules with mock data + HTTP integration
- Backend: 18 modules with full service layers + Swagger
- Both ready for separate GitHub pushes
