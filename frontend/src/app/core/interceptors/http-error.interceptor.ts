import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { UserFacingHttpError, mapHttpErrorResponseToUserMessage } from '../http/user-facing-http-error';
import { AuthService } from '../services/auth.service';
import { SupportContextService } from '../support/support-context.service';
import { isAuthFlowOrAnonymousUrl } from './http-unauthorized.util';

/**
 * Normalizes failed HTTP calls into {@link UserFacingHttpError} with a safe, non-technical message
 * (no raw Angular "Http failure response for … 0 Unknown Error", no URL leakage in UI copy).
 * Clears stale sessions on 401 from protected APIs so expired tokens cannot keep showing authenticated UI.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (isDevMode()) {
          console.warn('[HTTP]', err.status, err.url, err.message);
        }
        // Resolve only on failures so successful requests (e.g. i18n JSON during bootstrap) never
        // pull Router / AuthService while the DI graph is still wiring (avoids NG0200 cycles).
        const support = injector.get(SupportContextService);
        if (err.status === 401) {
          const url = err.url ?? req.url ?? '';
          if (!isAuthFlowOrAnonymousUrl(url)) {
            injector.get(AuthService).clearLocalAuthState();
            injector.get(Router).navigate(['/login'], { replaceUrl: true });
          }
        }
        const { message, errorCode, traceId, data } = mapHttpErrorResponseToUserMessage(err);
        if (traceId) {
          support.recordTraceId(traceId);
        }
        return throwError(() => new UserFacingHttpError(message, err.status, errorCode, traceId, data));
      }
      return throwError(() => err);
    })
  );
};
