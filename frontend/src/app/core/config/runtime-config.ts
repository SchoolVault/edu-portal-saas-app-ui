import { environment } from '../../../environments/environment';

/** Loaded from `/config.json` at startup (optional). Falls back to `environment.ts` / build-time defaults. */
export interface PublicAppConfig {
  apiUrl?: string;
  /** When true, services use in-memory mocks instead of HTTP. */
  useMocks?: boolean;
}

/**
 * Effective runtime settings. Mutated once by {@link applyPublicAppConfig} before the app bootstraps.
 */
export const runtimeConfig: PublicAppConfig & { production: boolean } = {
  apiUrl: environment.apiUrl,
  useMocks: environment.useMocks,
  production: environment.production
};

export function applyPublicAppConfig(overrides: PublicAppConfig): void {
  if (overrides.apiUrl != null && String(overrides.apiUrl).trim() !== '') {
    runtimeConfig.apiUrl = String(overrides.apiUrl).replace(/\/$/, '');
  }
  if (typeof overrides.useMocks === 'boolean') {
    runtimeConfig.useMocks = overrides.useMocks;
  }
}
