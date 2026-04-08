# SchoolVault ERP - Angular Frontend

## Enterprise Multi-Tenant School ERP System

### Tech Stack
- Angular 18 (Standalone Components, Lazy-Loaded Routes)
- Bootstrap 5 + Custom CSS (Earthy Theme)
- Chart.js for Dashboard Visualizations
- RxJS for State Management (BehaviorSubject pattern)

### Quick Start
```bash
yarn install
yarn start
# App runs at http://localhost:3000
```

### Environment Configuration

**File:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  useMocks: true,   // true = standalone with mock data, false = calls Spring Boot backend
  apiUrl: 'http://localhost:8080/api/v1'  // Spring Boot backend URL
};
```

**To switch to real backend:** Set `useMocks: false` and ensure Spring Boot is running on port 8080.

### Demo Credentials
| Role | Email | Password | School Code |
|------|-------|----------|-------------|
| Admin | admin@school.com | admin123 | SCH001 |
| Teacher | teacher@school.com | teacher123 | SCH001 |
| Parent | parent@school.com | parent123 | SCH001 |

### Module Structure
```
src/app/
  core/           # Services, Guards, Interceptors, Models
  layout/         # Sidebar, Header, Layout Shell
  features/       # 18 Feature Modules (lazy-loaded)
    auth/         # Login
    dashboard/    # Role-based KPI dashboards
    student/      # CRUD + Profile + Promotion
    teacher/      # CRUD
    academic/     # Years, Classes, Sections, Promotion
    attendance/   # Mark & Report
    timetable/    # Grid View
    exams/        # Marks Entry, Report Cards
    fees/         # Structures, Payments, Receipts
    communication/# Announcements
    reports/      # 5 Detailed Reports
    transport/    # Routes & Stops
    library/      # Books & Circulation
    hostel/       # Rooms & Allocation
    payroll/      # Salary & Payslips
    documents/    # File Management
    audit/        # Action Trail
    settings/     # Branding & Feature Flags
```

### API Integration Pattern
Every service supports dual mode (mock + HTTP):
```typescript
getStudents(): Observable<Student[]> {
  if (!environment.useMocks) {
    return this.api.getPage<Student>('/students').pipe(map(p => p.content));
  }
  return of([...this.students]).pipe(delay(400)); // Mock fallback
}
```

### Backend API Mapping
| Frontend Method | Backend Endpoint |
|----------------|-----------------|
| `AuthService.login()` | `POST /api/v1/auth/login` |
| `StudentService.getStudents()` | `GET /api/v1/students` |
| `StudentService.addStudent()` | `POST /api/v1/students` |
| `TeacherService.getTeachers()` | `GET /api/v1/teachers` |
| `AcademicService.getClasses()` | `GET /api/v1/academic/classes` |
| `AttendanceService.saveAttendance()` | `POST /api/v1/attendance` |
| `TimetableService.getByClassAndSection()` | `GET /api/v1/timetable` |
| `ExamService.getExams()` | `GET /api/v1/exams` |
| `ExamService.saveMarks()` | `POST /api/v1/exams/marks` |
| `FeeService.getPayments()` | `GET /api/v1/fees/payments` |
| `FeeService.recordPayment()` | `POST /api/v1/fees/payments` |
| `CommunicationService.getAnnouncements()` | `GET /api/v1/communication/announcements` |
| `NotificationService.getNotifications()` | `GET /api/v1/notifications` |
