import { Routes } from '@angular/router';
import { adminOnlyGuard, authGuard, importExportGuard, leaveStaffGuard, schoolSettingsGuard, schoolStaffGuard, superAdminGuard } from './core/guards/auth.guard';
import { featureModuleGuard } from './core/guards/feature-module.guard';

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
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
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
        path: 'platform-feature-rollout',
        loadComponent: () =>
          import('./features/platform-feature-rollout/platform-feature-rollout.component').then(m => m.PlatformFeatureRolloutComponent),
        canActivate: [superAdminGuard],
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
      {
        path: 'directory',
        loadComponent: () => import('./features/directory/directory.component').then(m => m.DirectoryComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: { requireFeatures: ['directory'], requireAnyRole: ['admin'] },
      },
      { path: 'teachers', loadComponent: () => import('./features/teacher/teacher-list.component').then(m => m.TeacherListComponent), canActivate: [schoolStaffGuard] },
      { path: 'teachers/new', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers/:id/edit', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers/:id', loadComponent: () => import('./features/teacher/teacher-profile.component').then(m => m.TeacherProfileComponent), canActivate: [schoolStaffGuard] },
      { path: 'academic', loadComponent: () => import('./features/academic/academic.component').then(m => m.AcademicComponent), canActivate: [schoolStaffGuard] },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent), canActivate: [schoolStaffGuard] },
      { path: 'timetable', loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      {
        path: 'timetable/onboarding',
        loadComponent: () =>
          import('./features/timetable/teacher-schedule-onboarding.component').then(m => m.TeacherScheduleOnboardingComponent),
        canActivate: [adminOnlyGuard],
      },
      {
        path: 'exams',
        loadComponent: () => import('./features/exams/exams.component').then(m => m.ExamsComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['exams'], requireAnyRole: ['admin', 'teacher', 'parent', 'super_admin'] },
      },
      {
        path: 'fees',
        loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: { requireFeatures: ['fees'], requireAnyRole: ['admin'] },
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['chat'], requireAnyRole: ['admin', 'teacher', 'parent'] },
      },
      {
        path: 'inbox',
        loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['communication'], requireAnyRole: ['admin', 'teacher', 'parent', 'student'] },
      },
      {
        path: 'communication',
        loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['communication'], requireAnyRole: ['admin', 'teacher', 'parent', 'student'] },
      },
      {
        path: 'announcement/:id',
        loadComponent: () => import('./features/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['communication'], requireAnyRole: ['admin', 'teacher', 'parent', 'student'] },
      },
      { path: 'leave', loadComponent: () => import('./features/leave/leave.component').then(m => m.LeaveComponent), canActivate: [leaveStaffGuard] },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: { requireFeatures: ['reports'], requireAnyRole: ['admin', 'super_admin'] },
      },
      {
        path: 'operations',
        loadComponent: () => import('./features/operations/operations-hub.component').then(m => m.OperationsHubComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: { requireFeatures: ['operationsHub'], requireAnyRole: ['admin', 'super_admin'] },
      },
      {
        path: 'import-export',
        loadComponent: () => import('./features/import-export/import-export.component').then(m => m.ImportExportComponent),
        canActivate: [importExportGuard, featureModuleGuard],
        data: { requireFeatures: ['importExport'], requireAnyRole: ['admin', 'super_admin'] },
      },
      {
        path: 'transport',
        loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['transport'], requireAnyRole: ['admin', 'super_admin'] },
      },
      {
        path: 'library',
        loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['library'], requireAnyRole: ['admin', 'teacher', 'library_staff'] },
      },
      {
        path: 'hostel',
        loadComponent: () => import('./features/hostel/hostel.component').then(m => m.HostelComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['hostel'], requireAnyRole: ['admin', 'super_admin'] },
      },
      {
        path: 'payroll',
        loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['payroll'], requireAnyRole: ['admin', 'super_admin', 'teacher'] },
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['documents'], requireAnyRole: ['admin', 'teacher', 'super_admin'] },
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [featureModuleGuard],
        data: { requireFeatures: ['audit'], requireAnyRole: ['admin', 'super_admin'] },
      },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), canActivate: [schoolSettingsGuard] },
      {
        path: 'notifications/:id',
        loadComponent: () => import('./features/notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent),
      },
      /** Legacy singular segment — same component as {@code notifications/:id}. */
      {
        path: 'notification/:id',
        loadComponent: () => import('./features/notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent),
      },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
