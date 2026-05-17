import { Routes } from '@angular/router';
import {
  adminOnlyGuard,
  authGuard,
  chatAccessGuard,
  importExportGuard,
  leaveStaffGuard,
  schoolSettingsGuard,
  schoolStaffGuard,
  staffDirectoryListRedirectGuard,
  studentMasterWriteGuard,
  superAdminGuard,
  feesOfficeGuard,
  timetableAccessGuard,
} from './core/guards/auth.guard';
import { featureModuleGuard } from './core/guards/feature-module.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/marketing/landing/marketing-landing.component').then(m => m.MarketingLandingComponent)
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features/marketing/features/marketing-features-page.component').then(m => m.MarketingFeaturesPageComponent)
  },
  {
    path: 'testimonials',
    loadComponent: () =>
      import('./features/marketing/testimonials/marketing-testimonials-page.component').then(m => m.MarketingTestimonialsPageComponent)
  },
  {
    path: 'videos',
    loadComponent: () =>
      import('./features/marketing/videos/marketing-videos-page.component').then(m => m.MarketingVideosPageComponent)
  },
  {
    path: 'request-demo',
    loadComponent: () =>
      import('./features/marketing/request-demo/marketing-request-demo-page.component').then(m => m.MarketingRequestDemoPageComponent)
  },
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
      {
        path: 'marketing/videos',
        loadComponent: () =>
          import('./features/marketing/admin/marketing-admin-videos.component').then(m => m.MarketingAdminVideosComponent),
        canActivate: [adminOnlyGuard]
      },
      {
        path: 'marketing/leads',
        loadComponent: () =>
          import('./features/marketing/admin/marketing-admin-leads.component').then(m => m.MarketingAdminLeadsComponent),
        canActivate: [adminOnlyGuard]
      },
      {
        path: 'marketing/features',
        loadComponent: () =>
          import('./features/marketing/admin/marketing-admin-features.component').then(m => m.MarketingAdminFeaturesComponent),
        canActivate: [adminOnlyGuard]
      },
      {
        path: 'marketing/testimonials',
        loadComponent: () =>
          import('./features/marketing/admin/marketing-admin-testimonials.component').then(m => m.MarketingAdminTestimonialsComponent),
        canActivate: [adminOnlyGuard]
      },
      { path: 'super-admin', loadComponent: () => import('./features/super-admin/super-admin.component').then(m => m.SuperAdminComponent), canActivate: [superAdminGuard] },
      {
        path: 'super-admin/leads',
        loadComponent: () => import('./features/super-admin/super-admin-leads.component').then(m => m.SuperAdminLeadsComponent),
        canActivate: [superAdminGuard]
      },
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
      { path: 'students/new', loadComponent: () => import('./features/student/student-form.component').then(m => m.StudentFormComponent), canActivate: [studentMasterWriteGuard] },
      { path: 'students/:id', loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent), canActivate: [schoolStaffGuard] },
      { path: 'students/:id/edit', loadComponent: () => import('./features/student/student-form.component').then(m => m.StudentFormComponent), canActivate: [studentMasterWriteGuard] },
      {
        path: 'directory',
        loadComponent: () => import('./features/directory/directory.component').then(m => m.DirectoryComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: {
          requireFeatures: ['directory'],
          requireAnyPermission: ['SCHOOL_DIRECTORY_READ', 'SCHOOL_DIRECTORY_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      { path: 'teachers', loadComponent: () => import('./features/teacher/teacher-list.component').then(m => m.TeacherListComponent), canActivate: [schoolStaffGuard] },
      { path: 'teachers/new', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers/:id/edit', loadComponent: () => import('./features/teacher/teacher-form.component').then(m => m.TeacherFormComponent), canActivate: [adminOnlyGuard] },
      { path: 'teachers/:id', loadComponent: () => import('./features/teacher/teacher-profile.component').then(m => m.TeacherProfileComponent), canActivate: [schoolStaffGuard] },
      {
        path: 'staff',
        pathMatch: 'full',
        canActivate: [adminOnlyGuard, featureModuleGuard, staffDirectoryListRedirectGuard],
        loadComponent: () => import('./features/directory/directory.component').then(m => m.DirectoryComponent),
        data: {
          requireFeatures: ['directory'],
          requireAnyPermission: ['SCHOOL_DIRECTORY_READ', 'SCHOOL_DIRECTORY_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      { path: 'staff/new', loadComponent: () => import('./features/staff/staff-profile.component').then(m => m.StaffProfileComponent), canActivate: [adminOnlyGuard] },
      { path: 'staff/:id/edit', loadComponent: () => import('./features/staff/staff-profile.component').then(m => m.StaffProfileComponent), canActivate: [adminOnlyGuard] },
      { path: 'staff/:id', loadComponent: () => import('./features/staff/staff-profile.component').then(m => m.StaffProfileComponent), canActivate: [adminOnlyGuard] },
      { path: 'academic', loadComponent: () => import('./features/academic/academic.component').then(m => m.AcademicComponent), canActivate: [schoolStaffGuard] },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent), canActivate: [schoolStaffGuard] },
      {
        path: 'timetable',
        loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent),
        canActivate: [timetableAccessGuard],
      },
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
        data: {
          requireFeatures: ['exams'],
          requireAnyPermission: [
            'ACADEMIC_TEACHER',
            'SCHOOL_EXAMS_READ',
            'SCHOOL_EXAMS_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
            'PORTAL_PARENT',
            'PORTAL_STUDENT',
          ],
        },
      },
      {
        path: 'fees',
        loadComponent: () => import('./features/fees/fees.component').then(m => m.FeesComponent),
        canActivate: [feesOfficeGuard, featureModuleGuard],
        data: {
          requireFeatures: ['fees'],
          requireAnyPermission: ['SCHOOL_FEES_READ', 'SCHOOL_FEES_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
        canActivate: [chatAccessGuard, featureModuleGuard],
        data: { requireFeatures: ['chat'] },
      },
      {
        path: 'inbox',
        loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['communication'],
          requireAnyPermission: [
            'ACADEMIC_TEACHER',
            'PORTAL_PARENT',
            'PORTAL_STUDENT',
            'PORTAL_SCHOOL_STAFF',
            'SCHOOL_COMMUNICATION_READ',
            'SCHOOL_COMMUNICATION_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'communication',
        loadComponent: () => import('./features/communication/communication.component').then(m => m.CommunicationComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['communication'],
          requireAnyPermission: [
            'ACADEMIC_TEACHER',
            'PORTAL_PARENT',
            'PORTAL_STUDENT',
            'PORTAL_SCHOOL_STAFF',
            'SCHOOL_COMMUNICATION_READ',
            'SCHOOL_COMMUNICATION_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'announcement/:id',
        loadComponent: () => import('./features/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['communication'],
          requireAnyPermission: [
            'ACADEMIC_TEACHER',
            'PORTAL_PARENT',
            'PORTAL_STUDENT',
            'PORTAL_SCHOOL_STAFF',
            'SCHOOL_COMMUNICATION_READ',
            'SCHOOL_COMMUNICATION_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'leave',
        loadComponent: () => import('./features/leave/leave.component').then(m => m.LeaveComponent),
        canActivate: [leaveStaffGuard, featureModuleGuard],
        data: {
          requireFeatures: ['leave'],
          requireAnyRole: ['admin', 'teacher', 'super_admin', 'library_staff', 'school_staff'],
          requireAnyPermission: [
            'SCHOOL_LEAVE_SELF_READ',
            'SCHOOL_LEAVE_SELF_APPLY',
            'SCHOOL_LEAVE_APPROVAL_READ',
            'SCHOOL_LEAVE_APPROVAL_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: {
          requireFeatures: ['reports'],
          requireAnyPermission: ['SCHOOL_REPORTS_READ', 'SCHOOL_REPORTS_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      {
        path: 'operations',
        loadComponent: () => import('./features/operations/operations-hub.component').then(m => m.OperationsHubComponent),
        canActivate: [adminOnlyGuard, featureModuleGuard],
        data: {
          requireFeatures: ['operationsHub'],
          requireAnyPermission: ['SCHOOL_OPERATIONS_READ', 'SCHOOL_OPERATIONS_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      {
        path: 'import-export',
        loadComponent: () => import('./features/import-export/import-export.component').then(m => m.ImportExportComponent),
        canActivate: [importExportGuard, featureModuleGuard],
        data: {
          requireFeatures: ['importExport'],
          requireAnyPermission: ['SCHOOL_IMPORT_EXPORT_READ', 'SCHOOL_IMPORT_EXPORT_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      {
        path: 'transport',
        loadComponent: () => import('./features/transport/transport.component').then(m => m.TransportComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['transport'],
          requireAnyPermission: [
            'SCHOOL_TRANSPORT_READ',
            'SCHOOL_TRANSPORT_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'library',
        loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['library'],
          requireAnyPermission: [
            'SCHOOL_LIBRARY_MEMBER_READ',
            'SCHOOL_LIBRARY_READ',
            'SCHOOL_LIBRARY_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'hostel-home',
        loadComponent: () =>
          import('./shared/module-entry-redirect/module-entry-redirect.component').then(
            m => m.ModuleEntryRedirectComponent
          ),
        canActivate: [featureModuleGuard],
        data: {
          moduleEntryKey: 'hostel',
          requireFeatures: ['hostel'],
          requireAnyPermission: [
            'SCHOOL_HOSTEL_READ',
            'SCHOOL_HOSTEL_WRITE',
            'SCHOOL_HOSTEL_BILLING_READ',
            'SCHOOL_HOSTEL_BILLING_WRITE',
            'SCHOOL_HOSTEL_APPROVAL_WRITE',
            'SCHOOL_HOSTEL_VISITOR_WRITE',
            'SCHOOL_HOSTEL_INCIDENT_WRITE',
            'PORTAL_PARENT',
            'PORTAL_STUDENT',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'hostel',
        loadComponent: () => import('./features/hostel/hostel.component').then(m => m.HostelComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['hostel'],
          requireAnyPermission: [
            'SCHOOL_HOSTEL_READ',
            'SCHOOL_HOSTEL_WRITE',
            'SCHOOL_HOSTEL_BILLING_READ',
            'SCHOOL_HOSTEL_BILLING_WRITE',
            'SCHOOL_HOSTEL_APPROVAL_WRITE',
            'SCHOOL_HOSTEL_VISITOR_WRITE',
            'SCHOOL_HOSTEL_INCIDENT_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'hostel-portal',
        loadComponent: () => import('./features/hostel/hostel-portal.component').then(m => m.HostelPortalComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['hostel'],
          requireAnyPermission: [
            'PORTAL_PARENT',
            'PORTAL_STUDENT',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
          ],
        },
      },
      {
        path: 'payroll',
        loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['payroll'],
          requireAnyPermission: [
            'SCHOOL_PAYROLL_READ',
            'SCHOOL_PAYROLL_WRITE',
            'TENANT_ADMIN',
            'PLATFORM_ADMIN',
            'ACADEMIC_TEACHER',
          ],
        },
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['documents'],
          requireAnyRole: ['admin', 'teacher', 'super_admin'],
          requireAnyPermission: ['ACADEMIC_TEACHER', 'SCHOOL_ACADEMIC_READ', 'SCHOOL_ACADEMIC_WRITE', 'TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [featureModuleGuard],
        data: {
          requireFeatures: ['audit'],
          requireAnyRole: ['admin', 'super_admin'],
          requireAnyPermission: ['TENANT_ADMIN', 'PLATFORM_ADMIN'],
        },
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
  { path: '**', redirectTo: '' }
];
