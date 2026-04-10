/**
 * =============================================================================
 * LOCAL DEVELOPMENT — single place to choose mocks vs real backend
 * =============================================================================
 * `useMocks: true`  → All data from in-memory services (no Spring Boot).
 * `useMocks: false` → HTTP to `apiUrl` (start backend locally for integration/debug).
 *
 * This file is ignored in production builds (`environment.prod.ts` is used instead).
 * `/config.json` is NOT read during `ng serve` — only production can override `apiUrl` there.
 */
export const environment = {
  production: false,
  useMocks: true,
  apiUrl: 'http://localhost:8080/api/v1'
};
