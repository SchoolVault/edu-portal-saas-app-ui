import { AppPermission } from '../auth/app-permission.constants';

export interface NavItem {
  /** ngx-translate key, e.g. {@code nav.dashboard}. */
  labelKey: string;
  icon: string;
  route: string;
  /**
   * Portal / coarse roles that may see this link. Kept for parent-only, super-admin, and legacy UX.
   * When {@link permissionsAny} is set, {@code school_staff} / {@code library_staff} must match a permission;
   * other listed roles may still match by role alone (see {@link UiAccessService#isNavItemVisible}).
   */
  roles: string[];
  /**
   * Optional {@code AppPermission} codes from login / JWT (mirrors backend {@code hasAuthority}).
   * If non-empty, used with {@link roles} per {@link UiAccessService#isNavItemVisible}.
   */
  permissionsAny?: readonly string[];
  /** Section group key, e.g. {@code nav.section.main}. */
  sectionKey: string;
  /**
   * Optional tenant feature flag (features_json). When the flag is false, the item is hidden for that school.
   * Keys match platform rollout: chat, transport, hostel, library, audit, operationsHub, importExport, exams, directory, documents, leave.
   */
  moduleGate?: string;
}

/** Backend {@code RbacSpel#ACADEMIC_ROSTER_READ} authority arm. */
const AP_ROSTER_READ: readonly string[] = [
  AppPermission.ACADEMIC_TEACHER,
  AppPermission.SCHOOL_ACADEMIC_READ,
  AppPermission.SCHOOL_ACADEMIC_WRITE,
  AppPermission.SCHOOL_STUDENT_READ,
  AppPermission.SCHOOL_STUDENT_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_LEAVE_SELF: readonly string[] = [
  AppPermission.SCHOOL_LEAVE_SELF_READ,
  AppPermission.SCHOOL_LEAVE_SELF_APPLY,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_LEAVE_APPROVAL: readonly string[] = [
  AppPermission.SCHOOL_LEAVE_APPROVAL_READ,
  AppPermission.SCHOOL_LEAVE_APPROVAL_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

/** Backend {@code RbacSpel#OPERATIONS_HUB_ADMIN} authority arm. */
const AP_OPERATIONS_HUB: readonly string[] = [
  AppPermission.SCHOOL_OPERATIONS_READ,
  AppPermission.SCHOOL_OPERATIONS_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_DIRECTORY_DESK: readonly string[] = [
  AppPermission.SCHOOL_DIRECTORY_READ,
  AppPermission.SCHOOL_DIRECTORY_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

/** Mirrors {@code RbacSpel#TRANSPORT_DESK_WRITE} authority arm (not operations hub alone). */
const AP_TRANSPORT_DESK: readonly string[] = [
  AppPermission.SCHOOL_TRANSPORT_READ,
  AppPermission.SCHOOL_TRANSPORT_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

/** Mirrors {@code RbacSpel#HOSTEL_DESK_WRITE} authority arm (not operations hub alone). */
const AP_HOSTEL_DESK: readonly string[] = [
  AppPermission.SCHOOL_HOSTEL_READ,
  AppPermission.SCHOOL_HOSTEL_WRITE,
  AppPermission.SCHOOL_HOSTEL_BILLING_READ,
  AppPermission.SCHOOL_HOSTEL_BILLING_WRITE,
  AppPermission.SCHOOL_HOSTEL_APPROVAL_WRITE,
  AppPermission.SCHOOL_HOSTEL_VISITOR_WRITE,
  AppPermission.SCHOOL_HOSTEL_INCIDENT_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_HOSTEL_PORTAL: readonly string[] = [
  AppPermission.PORTAL_PARENT,
  AppPermission.PORTAL_STUDENT,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_FEE_OFFICE: readonly string[] = [
  AppPermission.SCHOOL_FEES_READ,
  AppPermission.SCHOOL_FEES_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_PAYROLL_OFFICE: readonly string[] = [
  AppPermission.SCHOOL_PAYROLL_READ,
  AppPermission.SCHOOL_PAYROLL_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_REPORTS_SCHOOL: readonly string[] = [
  AppPermission.SCHOOL_REPORTS_READ,
  AppPermission.SCHOOL_REPORTS_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_IMPORT_EXPORT: readonly string[] = [
  AppPermission.SCHOOL_IMPORT_EXPORT_READ,
  AppPermission.SCHOOL_IMPORT_EXPORT_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_COMMUNICATION_DESK: readonly string[] = [
  AppPermission.SCHOOL_COMMUNICATION_READ,
  AppPermission.SCHOOL_COMMUNICATION_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_EXAMS_OFFICE: readonly string[] = [
  AppPermission.SCHOOL_EXAMS_READ,
  AppPermission.SCHOOL_EXAMS_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

const AP_LIBRARY: readonly string[] = [
  AppPermission.SCHOOL_LIBRARY_MEMBER_READ,
  AppPermission.SCHOOL_LIBRARY_READ,
  AppPermission.SCHOOL_LIBRARY_WRITE,
  AppPermission.TENANT_ADMIN,
  AppPermission.PLATFORM_ADMIN,
];

export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.dashboard',
    icon: 'bi-grid-1x2-fill',
    route: '/app/dashboard',
    roles: ['admin', 'teacher', 'parent', 'library_staff', 'school_staff', 'student'],
    sectionKey: 'nav.section.main',
  },
  { labelKey: 'nav.platform', icon: 'bi-buildings-fill', route: '/app/super-admin', roles: ['super_admin'], sectionKey: 'nav.section.main' },
  { labelKey: 'nav.schools', icon: 'bi-bank2', route: '/app/platform-schools', roles: ['super_admin'], sectionKey: 'nav.section.platform' },
  {
    labelKey: 'nav.featureRollout',
    icon: 'bi-sliders',
    route: '/app/platform-feature-rollout',
    roles: ['super_admin'],
    sectionKey: 'nav.section.platform',
  },
  { labelKey: 'nav.subscriptions', icon: 'bi-receipt', route: '/app/platform-subscriptions', roles: ['super_admin'], sectionKey: 'nav.section.platform' },
  { labelKey: 'nav.broadcasts', icon: 'bi-megaphone-fill', route: '/app/platform-broadcasts', roles: ['super_admin'], sectionKey: 'nav.section.platform' },
  { labelKey: 'nav.systemHealth', icon: 'bi-heart-pulse', route: '/app/platform-health', roles: ['super_admin'], sectionKey: 'nav.section.platform' },
  { labelKey: 'nav.platformSettings', icon: 'bi-gear-fill', route: '/app/platform-settings', roles: ['super_admin'], sectionKey: 'nav.section.platform' },
  { labelKey: 'nav.myChildren', icon: 'bi-person-vcard-fill', route: '/app/parent/children', roles: ['parent'], sectionKey: 'nav.section.main' },
  {
    labelKey: 'nav.academic',
    icon: 'bi-mortarboard-fill',
    route: '/app/academic',
    roles: ['admin', 'teacher'],
    permissionsAny: [...AP_ROSTER_READ],
    sectionKey: 'nav.section.main',
  },
  {
    labelKey: 'nav.students',
    icon: 'bi-people-fill',
    route: '/app/students',
    roles: ['admin', 'teacher'],
    permissionsAny: [...AP_ROSTER_READ],
    sectionKey: 'nav.section.people',
    moduleGate: 'student',
  },
  {
    labelKey: 'nav.directory',
    icon: 'bi-search-heart',
    route: '/app/directory',
    roles: ['admin'],
    permissionsAny: [...AP_DIRECTORY_DESK],
    sectionKey: 'nav.section.people',
    moduleGate: 'directory',
  },
  {
    labelKey: 'nav.teachers',
    icon: 'bi-person-badge-fill',
    route: '/app/teachers',
    roles: ['admin', 'teacher'],
    permissionsAny: [...AP_ROSTER_READ],
    sectionKey: 'nav.section.people',
    moduleGate: 'teacher',
  },
  {
    labelKey: 'nav.attendance',
    icon: 'bi-calendar-check-fill',
    route: '/app/attendance',
    roles: ['admin', 'teacher'],
    permissionsAny: [...AP_ROSTER_READ],
    sectionKey: 'nav.section.academics',
    moduleGate: 'attendance',
  },
  {
    labelKey: 'nav.timetable',
    icon: 'bi-clock-fill',
    route: '/app/timetable',
    roles: ['admin', 'teacher', 'parent'],
    permissionsAny: [...AP_ROSTER_READ],
    sectionKey: 'nav.section.academics',
  },
  {
    labelKey: 'nav.exams',
    icon: 'bi-journal-text',
    route: '/app/exams',
    roles: ['admin', 'teacher', 'parent'],
    permissionsAny: [...AP_ROSTER_READ, ...AP_EXAMS_OFFICE],
    sectionKey: 'nav.section.academics',
    moduleGate: 'exams',
  },
  {
    labelKey: 'nav.fees',
    icon: 'bi-credit-card-fill',
    route: '/app/fees',
    roles: ['admin'],
    permissionsAny: [...AP_FEE_OFFICE],
    sectionKey: 'nav.section.finance',
    moduleGate: 'fees',
  },
  {
    labelKey: 'nav.payroll',
    icon: 'bi-wallet-fill',
    route: '/app/payroll',
    roles: ['admin', 'teacher'],
    permissionsAny: [...AP_PAYROLL_OFFICE, AppPermission.ACADEMIC_TEACHER],
    sectionKey: 'nav.section.finance',
    moduleGate: 'payroll',
  },
  {
    labelKey: 'nav.inbox',
    icon: 'bi-inbox-fill',
    route: '/app/inbox',
    roles: ['admin', 'teacher', 'parent', 'student', 'library_staff', 'school_staff'],
    permissionsAny: [
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.PORTAL_PARENT,
      AppPermission.PORTAL_STUDENT,
      AppPermission.PORTAL_SCHOOL_STAFF,
      ...AP_COMMUNICATION_DESK,
    ],
    sectionKey: 'nav.section.connect',
    moduleGate: 'communication',
  },
  {
    labelKey: 'nav.chat',
    icon: 'bi-chat-dots-fill',
    route: '/app/chat',
    roles: ['admin', 'teacher', 'parent', 'student'],
    permissionsAny: [
      AppPermission.SCHOOL_CHAT_READ,
      AppPermission.SCHOOL_CHAT_WRITE,
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.PORTAL_PARENT,
      AppPermission.PORTAL_STUDENT,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN,
    ],
    sectionKey: 'nav.section.connect',
    moduleGate: 'chat',
  },
  {
    labelKey: 'nav.leave',
    icon: 'bi-calendar-x',
    route: '/app/leave',
    roles: ['admin', 'teacher', 'library_staff', 'school_staff'],
    permissionsAny: [...AP_LEAVE_SELF, ...AP_LEAVE_APPROVAL],
    sectionKey: 'nav.section.connect',
    moduleGate: 'leave',
  },
  {
    labelKey: 'nav.reports',
    icon: 'bi-graph-up',
    route: '/app/reports',
    roles: ['admin'],
    permissionsAny: [...AP_REPORTS_SCHOOL],
    sectionKey: 'nav.section.analytics',
    moduleGate: 'reports',
  },
  {
    labelKey: 'nav.operationsHub',
    icon: 'bi-building-gear',
    route: '/app/operations',
    roles: ['admin'],
    permissionsAny: [...AP_OPERATIONS_HUB],
    sectionKey: 'nav.section.operations',
    moduleGate: 'operationsHub',
  },
  {
    labelKey: 'nav.importExport',
    icon: 'bi-file-earmark-zip-fill',
    route: '/app/import-export',
    roles: ['super_admin'],
    sectionKey: 'nav.section.platform',
    moduleGate: 'importExport',
  },
  {
    labelKey: 'nav.importExport',
    icon: 'bi-file-earmark-zip-fill',
    route: '/app/import-export',
    roles: ['admin'],
    permissionsAny: [...AP_IMPORT_EXPORT],
    sectionKey: 'nav.section.operations',
    moduleGate: 'importExport',
  },
  {
    labelKey: 'nav.transport',
    icon: 'bi-bus-front-fill',
    route: '/app/transport',
    roles: [],
    permissionsAny: [...AP_TRANSPORT_DESK],
    sectionKey: 'nav.section.operations',
    moduleGate: 'transport',
  },
  {
    labelKey: 'nav.library',
    icon: 'bi-book-fill',
    route: '/app/library',
    roles: [],
    permissionsAny: [...AP_LIBRARY],
    sectionKey: 'nav.section.operations',
    moduleGate: 'library',
  },
  {
    labelKey: 'nav.hostel',
    icon: 'bi-house-fill',
    route: '/app/hostel',
    roles: [],
    permissionsAny: [...AP_HOSTEL_DESK],
    sectionKey: 'nav.section.operations',
    moduleGate: 'hostel',
  },
  {
    labelKey: 'nav.hostel',
    icon: 'bi-house-fill',
    route: '/app/hostel-portal',
    roles: ['parent', 'student'],
    permissionsAny: [...AP_HOSTEL_PORTAL],
    sectionKey: 'nav.section.main',
    moduleGate: 'hostel',
  },
  {
    labelKey: 'nav.documents',
    icon: 'bi-folder2-open',
    route: '/app/documents',
    roles: ['admin', 'teacher'],
    permissionsAny: [...AP_ROSTER_READ],
    sectionKey: 'nav.section.system',
    moduleGate: 'documents',
  },
  {
    labelKey: 'nav.auditLog',
    icon: 'bi-shield-check',
    route: '/app/audit',
    roles: ['admin'],
    permissionsAny: [AppPermission.TENANT_ADMIN, AppPermission.PLATFORM_ADMIN],
    sectionKey: 'nav.section.system',
    moduleGate: 'audit',
  },
  {
    labelKey: 'nav.settings',
    icon: 'bi-gear-fill',
    route: '/app/settings',
    roles: ['admin', 'teacher', 'parent', 'library_staff', 'school_staff', 'student'],
    sectionKey: 'nav.section.system',
  },
];

export const ROLES = { SUPER_ADMIN: 'super_admin', ADMIN: 'admin', TEACHER: 'teacher', PARENT: 'parent', STUDENT: 'student' } as const;

export const STUDENT_STATUS = ['active', 'inactive', 'graduated', 'transferred', 'alumni'] as const;
export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused'] as const;
export const FEE_STATUS = ['paid', 'partial', 'unpaid', 'overdue'] as const;
export const EXAM_STATUS = ['upcoming', 'ongoing', 'completed'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const GENDERS = ['male', 'female', 'other'] as const;

export const API_ENDPOINTS = {
  AUTH: { LOGIN: '/api/auth/login', LOGOUT: '/api/auth/logout' },
  STUDENTS: { BASE: '/api/students' },
  TEACHERS: { BASE: '/api/teachers' },
  ACADEMIC: { BASE: '/api/academic' },
  ATTENDANCE: { BASE: '/api/attendance' },
  TIMETABLE: { BASE: '/api/timetable' },
  EXAMS: { BASE: '/api/exams' },
  FEES: { BASE: '/api/fees' },
  COMMUNICATION: { BASE: '/api/communication' },
  REPORTS: { BASE: '/api/reports' },
};

export const DEFAULT_FEATURES: Record<string, boolean> = {
  transport: false,
  library: false,
  hostel: false,
  payroll: true,
  documents: false,
  audit: true,
  communication: true,
  reports: false,
  operationsHub: false,
  importExport: false,
  exams: false,
  directory: true,
  student: true,
  teacher: true,
  attendance: true,
  fees: true,
  leave: false,
};
