# SchoolVault ERP - Product Requirements Document

## Original Problem Statement
Build an Enterprise Multi-Tenant SaaS School ERP system (Angular-based) with mock API services, fully functional modules with sample data for all features.

## Architecture
- **Frontend**: Angular 18 (standalone components, lazy-loaded routes)
- **UI Framework**: Bootstrap 5 + Custom CSS (earthy theme)
- **State Management**: BehaviorSubject-based services
- **Mock API**: In-memory data with Observable+delay pattern (ready for Spring Boot replacement)
- **Auth**: JWT token flow (mock) with role-based routing

## What's Been Implemented (Feb 2026, Iteration 2)
### Core System
- [x] Auth (login/logout with 3 roles, JWT mock)
- [x] Role-based dashboards (Admin with Chart.js, Teacher, Parent)
- [x] Responsive sidebar navigation with role filtering
- [x] Notification system with bell icon dropdown
- [x] Profile dropdown with logout

### Student Management
- [x] Student CRUD (list, add, edit, delete)
- [x] Student profile with tabs (Exam Results, Fee History, Attendance)
- [x] Search, filter by class/status, sorting, pagination
- [x] 22 mock students across classes 5-10

### Teacher Management
- [x] Teacher CRUD (list, add, edit, delete)
- [x] 8 mock teachers with specializations

### Academic
- [x] Academic year management
- [x] 12 classes (1-12) with sections
- [x] **Class Promotion** workflow (bulk promote with eligibility status)

### Attendance
- [x] Class/section/date selection
- [x] Interactive marking (Present/Absent/Late)
- [x] Real-time status counters

### Timetable
- [x] Auto-loads Class 8-A timetable
- [x] Timetable data for Class 5, 8, and 9
- [x] Grid view: Day x Period with teacher/room

### Exams
- [x] 4 exams (Unit Tests, Midterm, Final)
- [x] Marks data for 3 exams
- [x] **Marks Entry Form** (select subject, enter marks, auto-grade)
- [x] Create new exam modal

### Fees
- [x] 3 fee structures with component breakdown
- [x] 8 payment records with varied statuses
- [x] Status filtering

### Reports (Comprehensive)
- [x] **Student Performance** - Class rank, grades, subject marks, pass rate
- [x] **Attendance Report** - Student-wise attendance %, at-risk alerts
- [x] **Fee Collection** - Collected/pending, overdue, class filters
- [x] **Class Summary** - All classes overview with attendance, performance, fee %
- [x] **Teacher Workload** - Periods/week, subjects, workload status

### Other Modules
- [x] Communication (announcements with create modal)
- [x] Transport (3 routes with stops)
- [x] Library (book catalog + issued books)
- [x] Hostel (room allocation with stats)
- [x] Payroll (salary structures)
- [x] Documents (file management)
- [x] Audit Log (action tracking with filters)
- [x] Settings (general, branding, roles, feature toggles)

## Backend Integration Guide
Each mock service in `src/app/core/services/` follows this pattern:
```typescript
// Replace mock: change of(data).pipe(delay()) → this.http.get<T>(apiUrl)
getStudents(): Observable<Student[]> {
  return of([...this.students]).pipe(delay(400));
  // → return this.http.get<Student[]>('/api/students');
}
```

## Next Tasks (P0)
1. Replace mock services with HTTP calls to Spring Boot
2. Add CSV/Excel bulk student import
3. Report card PDF generation
4. Teacher-Parent chat functionality
5. SMS/Email notification integration
