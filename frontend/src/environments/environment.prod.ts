/**
 * Production: real API only. Mock TTL keys are ignored when `useMocks` is false.
 */
export const environment = {
  production: true,
  useMocks: false,
  useRbacMocks: false,
  apiUrl: '/api/v1',
  mockSessionAccessTtlMs: 86_400_000,
  mockSessionRefreshTtlMs: 604_800_000
};
