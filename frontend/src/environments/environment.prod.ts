/**
 * Production build defaults. Overridden at runtime by `/config.json`
 * (generated from API_URL / USE_MOCKS during `npm run build:render` or `prebuild`).
 */
export const environment = {
  production: true,
  useMocks: false,
  apiUrl: '/api/v1'
};
