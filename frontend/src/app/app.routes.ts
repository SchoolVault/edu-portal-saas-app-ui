import { Routes } from '@angular/router';
import { adminOnlyGuard, authGuard, importExportGuard, leaveStaffGuard, schoolSettingsGuard, schoolStaffGuard, superAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'super-admin', loadComponent: () => import('./features/super-admin/super-admin.component').then(m => m.SuperAdminComponent), canActivate: [superAdminGuard] },
      {
        path: 'platform-health',
        loadComponent: () => import('./features/platform-health/platform-health.component').then(m => m.PlatformHealthComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'platform-schools',
        loadComponent: () => import('./features/platform-schools/platform-schools.component').then(m => m.PlatformSchoolsComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'platform-subscriptions',
        loadComponent: () => import('./features/platform-subscriptions/platform-subscriptions.component').then(m => m.PlatformSubscriptionsComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'platform-broadcasts',
        loadComponent: () => import('./features/platform-broadcasts/platform-broadcasts.component').then(m => m.PlatformBroadcastsComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'platform-settings',
        loadComponent: () => import('./features/platform-settings/platform-settings.component').then(m => m.PlatformSettingsComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'parent',
        loadComponent: () => import('./features/parent/parent-shell.component').then(m => m.ParentShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'children' },
          {
            path: 'children',
            loadComponent: () => import('./features/parent/parent-portal.component').then(m => m.ParentPortalComponent),
          },
        ],
      },
      { path: 'students', loadComponent: () => import('./features/student/student-list.component').then(m => m.StudentListComponent), canActivate: [schoolStaffGuard] },
      { path: 'students/new', loadComponent: () => import('./features/student/student-form.component').then(m => m.StudentFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'students/:id', loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent), canActivate: [schoolStaffGuard] },
      { path: 'students/:id/edit', loadComponent: () => import('./features/student/student-form.component').then(m => m.StudentFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'directory', loadComponent: () => import('./features/directory/directory.component').then(m => m.DirectoryComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers', loadComponent: () => import('./features/teacher/teacher-list.component').then(m => m.TeacherListComponent), canActivate: [schoolStaffGuard] },
      { path: 'teachers/new', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers/:id/edit', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers/:id', loadComponent: () => import('./features/teacher/teacher-profile.component').then(m => m.TeacherProfileComponent), canActivate: [schoolStaffGuard] },
      { path: 'academic', loadComponent: () => import('./features/academic/academic.component').then(m => m.AcademicComponent), canActivate: [schoolStaffGuard] },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent), canActivate: [schoolStaffGuard] },
      { path: 'timetable', loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'exams', loadComponent: () => import('./features/exams/exams.component').then(m => m.ExamsComponent) },
      { path: 'fees', loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent) },
      { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
      { path: 'inbox', loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent) },
      { path: 'communication', loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent) },
      { path: 'announcement/:id', loadComponent: () => import('./features/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent) },
      { path: 'leave', loadComponent: () => import('./features/leave/leave.component').then(m => m.LeaveComponent), canActivate: [leaveStaffGuard] },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'operations', loadComponent: () => import('./features/operations/operations-hub.component').then(m => m.OperationsHubComponent), canActivate: [adminOnlyGuard] },
      {
        path: 'import-export',
        loadComponent: () => import('./features/import-export/import-export.component').then(m => m.ImportExportComponent),
        canActivate: [importExportGuard],
      },
      { path: 'transport', loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent) },
      { path: 'library', loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent) },
      { path: 'hostel', loadComponent: () => import('./features/hostel/hostel.component').then(m => m.HostelComponent) },
      { path: 'payroll', loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent) },
      { path: 'documents', loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), canActivate: [schoolSettingsGuard] },
      { path: 'notification/:id', loadComponent: () => import('./features/notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
