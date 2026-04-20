/**
 * Keys stored in {@code tenant_configs.features_json} for platform module rollout (super-admin + API guards).
 * Keep in sync with backend {@code @RequireTenantFeature}, sidebar {@code moduleGate}, and {@link TenantModuleGateService}.
 */
export const PLATFORM_TENANT_FEATURE_KEYS = [
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
