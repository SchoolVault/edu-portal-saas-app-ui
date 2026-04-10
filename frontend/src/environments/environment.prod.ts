/**
 * Production build: always talks to the real API (`useMocks` is always false).
 * Optional runtime override: `/config.json` may set `apiUrl` only (e.g. CDN → API on Render).
 * School data (including a dedicated “demo showcase” tenant) lives in the database, not the UI.
 */
export const environment = {
  production: true,
  useMocks: false,
  apiUrl: '/api/v1'
};
