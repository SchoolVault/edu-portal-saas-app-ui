/**
 * Keys stored in {@code tenant_configs.features_json} for platform module rollout (super-admin + API guards).
 * Keep in sync with backend {@code @RequireTenantFeature}, sidebar {@code moduleGate}, and {@link TenantModuleGateService}.
 */
export const PLATFORM_TENANT_FEATURE_KEYS = [
  'aiAssistant',
  'chat',
  'transport',
  'hostel',
  'library',
  'audit',
  'operationsHub',
  'importExport',
  'exams',
  'directory',
  'fees',
  'payroll',
  'documents',
  'communication',
  'reports',
  'student',
  'teacher',
  'attendance',
  'leave',
] as const;
export type PlatformTenantFeatureKey = (typeof PLATFORM_TENANT_FEATURE_KEYS)[number];

/**
 * Baseline rollout for newly onboarded schools:
 * core academics/finance/communication on, optional modules off until super-admin enables them.
 */
export const DEFAULT_PLATFORM_TENANT_FEATURES: Record<PlatformTenantFeatureKey, boolean> = {
  aiAssistant: false,
  chat: false,
  transport: false,
  hostel: false,
  library: false,
  audit: true,
  operationsHub: false,
  importExport: false,
  exams: false,
  directory: true,
  fees: true,
  payroll: true,
  documents: false,
  communication: true,
  reports: false,
  student: true,
  teacher: true,
  attendance: true,
  leave: false,
};
