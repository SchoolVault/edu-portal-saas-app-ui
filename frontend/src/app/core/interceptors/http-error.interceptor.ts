import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { UserFacingHttpError, mapHttpErrorResponseToUserMessage } from '../http/user-facing-http-error';

/**
 * Normalizes failed HTTP calls into {@link UserFacingHttpError} with a safe, non-technical message
 * (no raw Angular "Http failure response for … 0 Unknown Error", no URL leakage in UI copy).
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (isDevMode()) {
          console.warn('[HTTP]', err.status, err.url, err.message);
        }
        const userMessage = mapHttpErrorResponseToUserMessage(err);
        return throwError(() => new UserFacingHttpError(userMessage, err.status));
      }
      return throwError(() => err);
    })
  );
};
