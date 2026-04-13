import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SupportContextService } from '../support/support-context.service';

/** Captures {@code X-Request-Id} from successful responses (e.g. diagnostics / future UX). */
export const traceResponseInterceptor: HttpInterceptorFn = (req, next) => {
  const support = inject(SupportContextService);
  return next(req).pipe(
    tap({
      next: event => {
        if (event instanceof HttpResponse) {
          const id =
            event.headers.get('X-Request-Id') ??
            event.headers.get('x-request-id') ??
            event.headers.get('X-Correlation-Id') ??
            event.headers.get('x-correlation-id');
          support.recordTraceId(id);
        }
      }
    })
  );
};
