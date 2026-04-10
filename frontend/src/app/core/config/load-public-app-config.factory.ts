import { environment } from '../../../environments/environment';
import { applyDeployedApiConfig } from './runtime-config';

/**
 * Fetches `/config.json` **only in production** to set `apiUrl` (same build, different API host).
 * Local development ignores this file — edit `src/environments/environment.ts` for mocks vs backend.
 */
export function loadPublicAppConfig(): () => Promise<void> {
  return () => {
    if (!environment.production) {
      return Promise.resolve();
    }
    return fetch('/config.json', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : {}))
      .then((raw: unknown) => {
        if (!raw || typeof raw !== 'object') return;
        const apiUrl = (raw as { apiUrl?: unknown }).apiUrl;
        if (typeof apiUrl === 'string' && apiUrl.trim() !== '') {
          applyDeployedApiConfig({ apiUrl });
        }
      })
      .catch(() => undefined);
  };
}
