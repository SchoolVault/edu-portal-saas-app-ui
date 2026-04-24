import { environment } from '../../../environments/environment';

type EnvWithRbac = typeof environment & { useRbacMocks?: boolean };
import { resolveStompBrokerUrl } from './resolve-stomp-broker-url';

/**
 * Optional overrides for **production** builds only (see `load-public-app-config.factory.ts`).
 * Local `ng serve` never loads `/config.json` — use `environment.ts` for mocks vs backend.
 */
export interface DeployedApiConfig {
  apiUrl?: string;
  /** Full STOMP broker URL (e.g. {@code wss://api.host/ws}). Omit to derive from {@code apiUrl}. */
  websocketUrl?: string;
}

/**
 * Effective settings for the running app. Initialized from Angular environments;
 * in production, `apiUrl` may be patched once from `/config.json` (hosting/CDN).
 */
export const runtimeConfig: DeployedApiConfig & {
  production: boolean;
  /**
   * Dev: true = in-memory parent data; fee pay uses in-browser settlement only for {@code mockpay} (see {@link ParentService.usesLocalPortalFeeSimulation}).
   * Prod: false = all parent calls and fee checkout use the API with a real JWT.
   * Backend contract alignment: repo root {@code docs/README_PHASES.md} (pagination {@code PageResponse}, {@code ApiResponse}).
   */
  useMocks: boolean;
  /**
   * RBAC settings panel: in-memory vs `/api/v1/rbac` (default false in prod; dev may enable for UI-only work).
   */
  useRbacMocks: boolean;
} = {
  apiUrl: environment.apiUrl,
  websocketUrl: undefined,
  useMocks: environment.useMocks,
  useRbacMocks: Boolean((environment as EnvWithRbac).useRbacMocks),
  production: environment.production
};

/** Production only: merge deployed API / WebSocket URLs (e.g. Render) without touching mock mode. */
export function applyDeployedApiConfig(overrides: DeployedApiConfig): void {
  if (overrides.apiUrl != null && String(overrides.apiUrl).trim() !== '') {
    runtimeConfig.apiUrl = String(overrides.apiUrl).replace(/\/$/, '');
  }
  if (overrides.websocketUrl != null && String(overrides.websocketUrl).trim() !== '') {
    runtimeConfig.websocketUrl = String(overrides.websocketUrl).replace(/\/$/, '');
  }
}

/** STOMP broker URL aligned with Spring {@code WebSocketConfig} endpoint {@code /ws}. */
export function getStompBrokerUrl(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  return resolveStompBrokerUrl(runtimeConfig.apiUrl || '', runtimeConfig.websocketUrl, origin);
}
