/**
 * Client-side JWT payload read (no signature verification).
 * Authorization decisions remain on the server; this is for session UX and avoiding stale UI state.
 */
const JWT_PARTS = 3;

export function isLikelyJwt(token: string): boolean {
  const parts = token.split('.');
  return parts.length === JWT_PARTS && parts.every(p => p.length > 0);
}

function base64UrlToUtf8(segment: string): string {
  const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4));
  const b64 = (segment + pad).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/** @returns expiry in milliseconds since epoch, or null if not a JWT / no exp */
export function decodeJwtExpiryMs(token: string): number | null {
  if (!isLikelyJwt(token)) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlToUtf8(token.split('.')[1])) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function isAccessExpiredByClock(token: string, nowMs: number, clockSkewMs: number, mockExpiresAtMs: number | null): boolean {
  if (isLikelyJwt(token)) {
    const expMs = decodeJwtExpiryMs(token);
    if (expMs == null) {
      return true;
    }
    return nowMs >= expMs - clockSkewMs;
  }
  if (mockExpiresAtMs == null) {
    return false;
  }
  return nowMs >= mockExpiresAtMs - clockSkewMs;
}

/**
 * Reads the `permissions` claim from an access JWT (comma-separated), matching Spring {@code JwtUtil} / login token minting.
 * Mock sessions use non-JWT tokens and return an empty list.
 */
export function decodeJwtPermissions(token: string): string[] {
  if (!isLikelyJwt(token)) {
    return [];
  }
  try {
    const payload = JSON.parse(base64UrlToUtf8(token.split('.')[1])) as { permissions?: unknown };
    const raw = payload.permissions;
    if (typeof raw !== 'string' || !raw.trim()) {
      return [];
    }
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  } catch {
    return [];
  }
}
