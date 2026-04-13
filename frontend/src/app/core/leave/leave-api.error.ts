import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { LEAVE_OTHER_REASON_MIN_LEN } from './leave-api.contract';

/**
 * Maps Spring {@code ApiResponse.errorCode} to ngx-translate keys for leave flows.
 */
export function resolveLeaveSubmitError(err: unknown, tr: TranslateService): string {
  const body = err instanceof HttpErrorResponse ? err.error : (err as { error?: unknown })?.error;
  const code =
    body && typeof body === 'object' && 'errorCode' in body
      ? String((body as { errorCode?: string }).errorCode ?? '')
      : '';

  if (code === 'LEAVE_OTHER_REASON_REQUIRED') {
    return tr.instant('leave.errOtherReasonRequired', { min: LEAVE_OTHER_REASON_MIN_LEN });
  }

  if (err instanceof HttpErrorResponse && body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message?: string }).message;
    if (msg && String(msg).trim()) {
      return String(msg);
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return tr.instant('leave.errSubmitGeneric');
}
