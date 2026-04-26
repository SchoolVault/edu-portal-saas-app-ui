/**
 * Mirrors backend {@code com.school.erp.security.rbac.AppPermission} enum names.
 * Use for type-safe UI checks; server remains the authority.
 */
export const AppPermission = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  SCHOOL_FEE_OFFICE: 'SCHOOL_FEE_OFFICE',
  SCHOOL_SETTINGS_FINANCE: 'SCHOOL_SETTINGS_FINANCE',
  SCHOOL_PAYROLL_OFFICE: 'SCHOOL_PAYROLL_OFFICE',
  SCHOOL_SETTINGS_CORE: 'SCHOOL_SETTINGS_CORE',
  SCHOOL_STUDENT_MASTER: 'SCHOOL_STUDENT_MASTER',
  SCHOOL_EXAMS_OFFICE: 'SCHOOL_EXAMS_OFFICE',
  SCHOOL_IMPORT_EXPORT: 'SCHOOL_IMPORT_EXPORT',
  SCHOOL_OPERATIONS_HUB: 'SCHOOL_OPERATIONS_HUB',
  SCHOOL_TRANSPORT_DESK: 'SCHOOL_TRANSPORT_DESK',
  SCHOOL_HOSTEL_DESK: 'SCHOOL_HOSTEL_DESK',
  SCHOOL_REPORTS_SCHOOL: 'SCHOOL_REPORTS_SCHOOL',
  FEE_STRUCTURES_READ: 'FEE_STRUCTURES_READ',
  ACADEMIC_TEACHER: 'ACADEMIC_TEACHER',
  LIBRARY_MANAGE: 'LIBRARY_MANAGE',
  LIBRARY_CIRCULATION: 'LIBRARY_CIRCULATION',
  /** Baseline school employee portal (stack school roles for duties). Mirrors backend {@code AppPermission#PORTAL_SCHOOL_STAFF}. */
  PORTAL_SCHOOL_STAFF: 'PORTAL_SCHOOL_STAFF',
  /** Optional tenant chat for school employees (assign via school roles). Mirrors backend {@code AppPermission#PORTAL_CHAT}. */
  PORTAL_CHAT: 'PORTAL_CHAT',
  PORTAL_PARENT: 'PORTAL_PARENT',
  PORTAL_STUDENT: 'PORTAL_STUDENT',
} as const;

export type AppPermissionCode = (typeof AppPermission)[keyof typeof AppPermission];

/** Ordered list for mock school-admin sessions (aligns with backend default bundle, sorted). */
export const MOCK_SCHOOL_ADMIN_PERMISSIONS: readonly string[] = [
  AppPermission.FEE_STRUCTURES_READ,
  AppPermission.SCHOOL_EXAMS_OFFICE,
  AppPermission.SCHOOL_FEE_OFFICE,
  AppPermission.SCHOOL_IMPORT_EXPORT,
  AppPermission.SCHOOL_OPERATIONS_HUB,
  AppPermission.SCHOOL_TRANSPORT_DESK,
  AppPermission.SCHOOL_HOSTEL_DESK,
  AppPermission.SCHOOL_PAYROLL_OFFICE,
  AppPermission.SCHOOL_REPORTS_SCHOOL,
  AppPermission.SCHOOL_SETTINGS_CORE,
  AppPermission.SCHOOL_SETTINGS_FINANCE,
  AppPermission.SCHOOL_STUDENT_MASTER,
  AppPermission.TENANT_ADMIN,
];

export const MOCK_TEACHER_BASE_PERMISSIONS: readonly string[] = [
  AppPermission.ACADEMIC_TEACHER,
  AppPermission.FEE_STRUCTURES_READ,
];

export const MOCK_SUPER_ADMIN_PERMISSIONS: readonly string[] = [
  ...MOCK_SCHOOL_ADMIN_PERMISSIONS,
  AppPermission.PLATFORM_ADMIN,
].sort();
