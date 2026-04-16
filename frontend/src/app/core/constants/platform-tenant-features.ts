/**
 * Keys stored in {@code tenant_configs.features_json} for platform module rollout (super-admin + API guards).
 * Keep in sync with backend {@code @RequireTenantFeature} and {@link TenantModuleGateService}.
 */
export const PLATFORM_TENANT_FEATURE_KEYS = [
  'chat',
  'transport',
  'hostel',
  'library',
  'audit',
  'operationsHub',
  'importExport',
  'directory',
] as const;
export type PlatformTenantFeatureKey = (typeof PLATFORM_TENANT_FEATURE_KEYS)[number];
