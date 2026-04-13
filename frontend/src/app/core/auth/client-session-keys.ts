/**
 * Browser session keys for the SPA. Kept free of Angular DI so HTTP interceptors
 * can read the access token without pulling in {@link AuthService} (avoids cycles:
 * HttpClient → interceptor → AuthService → … → HttpClient).
 */
export const ERP_ACCESS_TOKEN_KEY = 'erp_token';
export const ERP_REFRESH_TOKEN_KEY = 'erp_refresh_token';
export const ERP_USER_KEY = 'erp_user';

export function readStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(ERP_ACCESS_TOKEN_KEY);
}
