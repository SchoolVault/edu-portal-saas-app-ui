import { HttpInterceptorFn } from '@angular/common/http';
import { readStoredAccessToken } from '../auth/client-session-keys';

/** These calls must not send a stale JWT or Hibernate tenant filter + login can 401 a valid user. */
function skipBearerForUrl(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/onboard-tenant') ||
    url.includes('/auth/refresh-token') ||
    url.includes('/auth/logout')
  );
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = readStoredAccessToken();

  if (token && !skipBearerForUrl(req.url)) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  return next(req);
};
