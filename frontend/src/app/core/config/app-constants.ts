export interface NavItem {
  /** ngx-translate key, e.g. {@code nav.dashboard}. */
  labelKey: string;
  icon: string;
  route: string;
  roles: string[];
  /** Section group key, e.g. {@code nav.section.main}. */
  sectionKey: string;
  /**
   * Optional tenant feature flag (features_json). When the flag is false, the item is hidden for that school.
   * Keys match platform rollout: chat, transport, hostel, library, audit, operationsHub, importExport, exams, directory, documents.
   */
  moduleGate?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'bi-grid-1x2-fill', route: '/app/dashboard', roles: ['admin', 'teacher', 'parent'], sectionKey: 'nav.section.main' },
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
  { labelKey: 'nav.academic', icon: 'bi-mortarboard-fill', route: '/app/academic', roles: ['admin', 'teacher'], sectionKey: 'nav.section.main' },
  { labelKey: 'nav.students', icon: 'bi-people-fill', route: '/app/students', roles: ['admin', 'teacher'], sectionKey: 'nav.section.people', moduleGate: 'student' },
  {
    labelKey: 'nav.directory',
    icon: 'bi-search-heart',
    route: '/app/directory',
    roles: ['admin'],
    sectionKey: 'nav.section.people',
    moduleGate: 'directory',
  },
  { labelKey: 'nav.teachers', icon: 'bi-person-badge-fill', route: '/app/teachers', roles: ['admin', 'teacher'], sectionKey: 'nav.section.people', moduleGate: 'teacher' },
  { labelKey: 'nav.attendance', icon: 'bi-calendar-check-fill', route: '/app/attendance', roles: ['admin', 'teacher'], sectionKey: 'nav.section.academics', moduleGate: 'attendance' },
  { labelKey: 'nav.timetable', icon: 'bi-clock-fill', route: '/app/timetable', roles: ['admin', 'teacher', 'parent'], sectionKey: 'nav.section.academics' },
  { labelKey: 'nav.exams', icon: 'bi-journal-text', route: '/app/exams', roles: ['admin', 'teacher', 'parent'], sectionKey: 'nav.section.academics', moduleGate: 'exams' },
  { labelKey: 'nav.fees', icon: 'bi-credit-card-fill', route: '/app/fees', roles: ['admin'], sectionKey: 'nav.section.finance', moduleGate: 'fees' },
  { labelKey: 'nav.payroll', icon: 'bi-wallet-fill', route: '/app/payroll', roles: ['admin'], sectionKey: 'nav.section.finance', moduleGate: 'payroll' },
  { labelKey: 'nav.inbox', icon: 'bi-inbox-fill', route: '/app/inbox', roles: ['admin', 'teacher', 'parent', 'student'], sectionKey: 'nav.section.connect', moduleGate: 'communication' },
  { labelKey: 'nav.chat', icon: 'bi-chat-dots-fill', route: '/app/chat', roles: ['admin', 'teacher', 'parent', 'super_admin'], sectionKey: 'nav.section.connect', moduleGate: 'chat' },
  { labelKey: 'nav.leave', icon: 'bi-calendar-x', route: '/app/leave', roles: ['admin', 'teacher'], sectionKey: 'nav.section.connect', moduleGate: 'leave' },
  { labelKey: 'nav.reports', icon: 'bi-graph-up', route: '/app/reports', roles: ['admin'], sectionKey: 'nav.section.analytics', moduleGate: 'reports' },
  {
    labelKey: 'nav.operationsHub',
    icon: 'bi-building-gear',
    route: '/app/operations',
    roles: ['admin'],
    sectionKey: 'nav.section.operations',
    moduleGate: 'operationsHub',
  },
  {
    labelKey: 'nav.importExport',
    icon: 'bi-file-earmark-zip-fill',
    route: '/app/import-export',
    roles: ['admin', 'super_admin'],
    sectionKey: 'nav.section.operations',
    moduleGate: 'importExport',
  },
  { labelKey: 'nav.transport', icon: 'bi-bus-front-fill', route: '/app/transport', roles: ['admin'], sectionKey: 'nav.section.operations', moduleGate: 'transport' },
  { labelKey: 'nav.library', icon: 'bi-book-fill', route: '/app/library', roles: ['admin', 'teacher'], sectionKey: 'nav.section.operations', moduleGate: 'library' },
  { labelKey: 'nav.hostel', icon: 'bi-house-fill', route: '/app/hostel', roles: ['admin'], sectionKey: 'nav.section.operations', moduleGate: 'hostel' },
  { labelKey: 'nav.documents', icon: 'bi-folder2-open', route: '/app/documents', roles: ['admin', 'teacher'], sectionKey: 'nav.section.system', moduleGate: 'documents' },
  { labelKey: 'nav.auditLog', icon: 'bi-shield-check', route: '/app/audit', roles: ['admin'], sectionKey: 'nav.section.system', moduleGate: 'audit' },
  { labelKey: 'nav.settings', icon: 'bi-gear-fill', route: '/app/settings', roles: ['admin', 'teacher', 'parent'], sectionKey: 'nav.section.system' },
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
  transport: true,
  library: true,
  hostel: true,
  payroll: true,
  documents: true,
  audit: true,
  communication: true,
  reports: true,
  operationsHub: true,
  importExport: true,
  exams: true,
  directory: true,
  leave: true,
};
