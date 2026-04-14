/**
 * URLs where HTTP 401 must not clear the client session (expected failures while logged out or during credential checks).
 */
export function isAuthFlowOrAnonymousUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/onboard-tenant') ||
    u.includes('/auth/refresh-token') ||
    u.includes('/auth/logout') ||
    u.includes('/auth/register') ||
    u.includes('/auth/phone/')
  );
}
