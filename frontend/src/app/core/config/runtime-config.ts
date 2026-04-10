import { environment } from '../../../environments/environment';

/**
 * Optional overrides for **production** builds only (see `load-public-app-config.factory.ts`).
 * Local `ng serve` never loads `/config.json` — use `environment.ts` for mocks vs backend.
 */
export interface DeployedApiConfig {
  apiUrl?: string;
}

/**
 * Effective settings for the running app. Initialized from Angular environments;
 * in production, `apiUrl` may be patched once from `/config.json` (hosting/CDN).
 */
export const runtimeConfig: DeployedApiConfig & {
  production: boolean;
  /** In-memory mocks vs HTTP. Set only from environment files, never from config.json. */
  useMocks: boolean;
} = {
  apiUrl: environment.apiUrl,
  useMocks: environment.useMocks,
  production: environment.production
};

/** Production only: merge deployed API base URL (e.g. Render) without touching mock mode. */
export function applyDeployedApiConfig(overrides: DeployedApiConfig): void {
  if (overrides.apiUrl != null && String(overrides.apiUrl).trim() !== '') {
    runtimeConfig.apiUrl = String(overrides.apiUrl).replace(/\/$/, '');
  }
}
