import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'students', loadComponent: () => import('./features/student/student-list.component').then(m => m.StudentListComponent) },
      { path: 'students/new', loadComponent: () => import('./features/student/student-form.component').then(m => m.StudentFormComponent) },
      { path: 'students/:id', loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent) },
      { path: 'students/:id/edit', loadComponent: () => import('./features/student/student-form.component').then(m => m.StudentFormComponent) },
      { path: 'teachers', loadComponent: () => import('./features/teacher/teacher-list.component').then(m => m.TeacherListComponent) },
      { path: 'teachers/new', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent) },
      { path: 'teachers/:id/edit', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent) },
      { path: 'academic', loadComponent: () => import('./features/academic/academic.component').then(m => m.AcademicComponent) },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'timetable', loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'exams', loadComponent: () => import('./features/exams/exams.component').then(m => m.ExamsComponent) },
      { path: 'fees', loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent) },
      { path: 'communication', loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'transport', loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent) },
      { path: 'library', loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent) },
      { path: 'hostel', loadComponent: () => import('./features/hostel/hostel.component').then(m => m.HostelComponent) },
      { path: 'payroll', loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent) },
      { path: 'documents', loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
