import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { UserFacingHttpError, mapHttpErrorResponseToUserMessage } from '../http/user-facing-http-error';
import { AuthService } from '../services/auth.service';
import { isAuthFlowOrAnonymousUrl } from './http-unauthorized.util';

/**
 * Normalizes failed HTTP calls into {@link UserFacingHttpError} with a safe, non-technical message
 * (no raw Angular "Http failure response for … 0 Unknown Error", no URL leakage in UI copy).
 * Clears stale sessions on 401 from protected APIs so expired tokens cannot keep showing authenticated UI.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (isDevMode()) {
          console.warn('[HTTP]', err.status, err.url, err.message);
        }
        if (err.status === 401) {
          const url = err.url ?? req.url ?? '';
          if (!isAuthFlowOrAnonymousUrl(url)) {
            auth.clearLocalAuthState();
            router.navigate(['/login'], { replaceUrl: true });
          }
        }
        const userMessage = mapHttpErrorResponseToUserMessage(err);
        return throwError(() => new UserFacingHttpError(userMessage, err.status));
      }
      return throwError(() => err);
    })
  );
};
