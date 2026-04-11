/**
 * Spring STOMP endpoint is registered at {@code /ws} on the API host (not under {@code /api/v1}).
 * REST uses {@code apiUrl} like {@code https://api.example.com/api/v1}; the broker is {@code wss://api.example.com/ws}.
 *
 * Host-agnostic: works for Render, AWS, on-prem — only needs correct absolute {@code apiUrl} in production,
 * or an explicit {@code websocketUrl} when a gateway uses a non-standard path.
 */

const DEFAULT_DEV_API = 'http://localhost:8080/api/v1';

function trimUrl(s: string): string {
  return s.replace(/\/$/, '');
}

/**
 * Full STOMP WebSocket URL (e.g. {@code wss://host/ws}).
 *
 * @param explicitWebSocketUrl optional override from {@code config.json} / env (gateways, path prefixes)
 * @param pageOrigin used when {@code apiBaseUrl} is relative (same-origin API or dev proxy)
 */
export function resolveStompBrokerUrl(
  apiBaseUrl: string,
  explicitWebSocketUrl?: string | null,
  pageOrigin?: string
): string {
  const explicit = explicitWebSocketUrl?.trim();
  if (explicit) {
    return normalizeExplicitBrokerUrl(explicit);
  }

  const base = (apiBaseUrl || '').trim() || DEFAULT_DEV_API;
  const fallbackOrigin = pageOrigin?.trim() || 'http://localhost';

  let parsed: URL;
  try {
    parsed = new URL(base, fallbackOrigin);
  } catch {
    return legacyConcatWs(base);
  }

  const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${parsed.host}/ws`;
}

/** Accept {@code wss://host} or {@code wss://host/ws}; Spring default broker path is {@code /ws}. */
function normalizeExplicitBrokerUrl(raw: string): string {
  const t = trimUrl(raw);
  try {
    const u = new URL(t);
    if (u.pathname === '/' || u.pathname === '') {
      u.pathname = '/ws';
    }
    return trimUrl(u.toString());
  } catch {
    return t;
  }
}

/** Last-resort if URL parsing fails (malformed deploy config). */
function legacyConcatWs(base: string): string {
  const b = trimUrl(base).replace(/\/api\/v1$/i, '');
  if (/^https:/i.test(b)) return `wss://${b.slice('https://'.length)}/ws`;
  if (/^http:/i.test(b)) return `ws://${b.slice('http://'.length)}/ws`;
  return `ws://${b}/ws`;
}
