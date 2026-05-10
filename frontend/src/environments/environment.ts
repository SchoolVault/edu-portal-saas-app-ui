/**
 * =============================================================================
 * LOCAL DEVELOPMENT — flip `useMocks` + `apiUrl` only; production uses `environment.prod.ts`.
 * =============================================================================
 * Mock session: both TTLs apply only when `useMocks: true` (non-JWT demo tokens).
 * Set them equal (e.g. both 60_000) to log out fully after ~1 minute; use longer values for normal dev.
 */
export const environment = {
  production: false,
  useMocks: false,
  /**
   * When true, Settings → Roles & access uses in-memory RBAC data (see {@link ../core/mocks/rbac.mock-data}).
   * Set false to exercise the same DTOs against the live Spring `/api/v1/rbac/*` APIs.
   */
  useRbacMocks: false,
  apiUrl: 'http://localhost:8080/api/v1',
  /** Dev-friendly TTLs; use 60_000 + 60_000 only when testing expiry flows. */
  mockSessionAccessTtlMs: 86_400_000,
  mockSessionRefreshTtlMs: 604_800_000
};
