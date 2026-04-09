import { applyPublicAppConfig, type PublicAppConfig } from './runtime-config';

/** Fetches `/config.json` (deploy-time overrides). Safe if missing or invalid. */
export function loadPublicAppConfig(): () => Promise<void> {
  return () =>
    fetch('/config.json', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : {}))
      .then((raw: unknown) => {
        if (raw && typeof raw === 'object') {
          applyPublicAppConfig(raw as PublicAppConfig);
        }
      })
      .catch(() => undefined);
}
