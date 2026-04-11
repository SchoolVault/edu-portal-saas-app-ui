/**
 * =============================================================================
 * LOCAL DEVELOPMENT — flip `useMocks` + `apiUrl` only; production uses `environment.prod.ts`.
 * =============================================================================
 * Mock session: both TTLs apply only when `useMocks: true` (non-JWT demo tokens).
 * Set them equal (e.g. both 60_000) to log out fully after ~1 minute; use longer values for normal dev.
 */
export const environment = {
  production: false,
  useMocks: true,
  apiUrl: 'http://localhost:8080/api/v1',
  mockSessionAccessTtlMs: 60_000,
  mockSessionRefreshTtlMs: 60_000
};
