# SchoolVault ERP - Product Requirements Document

## Original Problem Statement
Build an Enterprise Multi-Tenant SaaS School ERP system (Angular-based) with mock API services. The system supports multiple roles (Admin, Teacher, Parent), 15+ modules, and is designed for 2,000-10,000+ students per tenant.

## Architecture
- **Frontend**: Angular 18 (standalone components, lazy-loaded routes)
- **UI Framework**: Bootstrap 5 + Custom CSS (earthy theme)
- **State Management**: BehaviorSubject-based services
- **Mock API**: In-memory data with Observable+delay pattern
- **Auth**: JWT token flow (mock) with role-based routing
- **Backend**: To be replaced with Java Spring Boot (user's own backend)

## User Personas
1. **School Admin** - Full system access, manages all modules
2. **Teacher** - Academics, attendance, grades, communication
3. **Parent** - View child info, fees, communication

## Core Requirements
- Multi-tenant auth (school code + email + password)
- Role-based dashboards with KPI cards and charts
- Student/Teacher CRUD with search, filter, pagination
- Academic year, class, and section management
- Attendance marking system
- Timetable grid view
- Exam management with marks and grades
- Fee structure and payment tracking
- Communication/announcements system
- Reports generation
- Transport route management
- Library book catalog and circulation
- Hostel room allocation
- Payroll and salary management
- Document management
- Audit trail logging
- Settings with feature toggles and branding

## What's Been Implemented (Feb 2026)
- [x] Angular 18 project with standalone components
- [x] Complete auth flow (login/logout with 3 roles)
- [x] Role-based dashboards (Admin with charts, Teacher, Parent)
- [x] Student module (list, add, edit, profile, delete)
- [x] Teacher module (list, add, edit, delete)
- [x] Academic module (years, classes, sections)
- [x] Attendance marking system
- [x] Timetable grid view
- [x] Exam management with marks
- [x] Fee structure and payments
- [x] Communication/announcements
- [x] Reports module with filter UI
- [x] Transport routes
- [x] Library catalog and book issues
- [x] Hostel room management
- [x] Payroll/salary structures
- [x] Document management
- [x] Audit log with filters
- [x] Settings (general, branding, roles, feature toggles)
- [x] Notification dropdown
- [x] Profile dropdown with logout
- [x] Responsive sidebar navigation
- [x] Earthy design theme (Forest Green, Terracotta, Bone White)

## Prioritized Backlog
### P0 (Critical)
- Spring Boot backend integration (user's responsibility)
- Real authentication with JWT validation

### P1 (High)
- Dynamic form engine (JSON-config driven)
- CSV/Excel bulk import for students
- Report card generation (PDF)
- Chat functionality (Teacher-Parent)

### P2 (Medium)
- Student promotion workflow
- Multi-tenant branding per school
- SMS/Email notification integration
- Online payment gateway
- Advanced search with filters across modules

### P3 (Low)
- Dashboard widget customization
- Dark mode theme
- Localization/multi-language support
- Advanced analytics/BI dashboards

## Next Tasks
1. Replace mock services with HTTP calls to Spring Boot backend
2. Implement dynamic form engine for config-driven forms
3. Add bulk student import (CSV/Excel upload)
4. Build report card PDF generation
5. Add real-time chat between teacher and parent
