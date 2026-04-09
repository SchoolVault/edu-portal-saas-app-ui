/**
 * Local dev defaults. `/config.json` (from `npm start` / `config:write`) overrides apiUrl & useMocks at runtime.
 */
export const environment = {
  production: false,
  useMocks: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
