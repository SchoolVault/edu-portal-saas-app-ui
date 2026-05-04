import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { UserFacingHttpError } from '../http/user-facing-http-error';

const PORTAL_PASSWORD_MIN = 8;

/**
 * Maps Spring {@code ApiResponse.errorCode} for staff save flows to ngx-translate keys.
 */
export function resolveStaffSaveError(err: unknown, tr: TranslateService): string {
  const code =
    err instanceof UserFacingHttpError
      ? err.apiErrorCode
      : err instanceof HttpErrorResponse && err.error && typeof err.error === 'object'
        ? String((err.error as { errorCode?: string }).errorCode ?? '')
        : '';

  if (code === 'STAFF_PORTAL_PHONE_REQUIRED') {
    return tr.instant('staff.profile.errPortalPhoneRequired');
  }
  if (code === 'STAFF_PORTAL_PASSWORD_TOO_SHORT') {
    return tr.instant('staff.profile.errPortalPasswordMin', { min: PORTAL_PASSWORD_MIN });
  }

  if (err instanceof UserFacingHttpError && err.message) {
    return err.message;
  }
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object' && 'message' in err.error) {
    const msg = (err.error as { message?: string }).message;
    if (msg && String(msg).trim()) {
      return String(msg);
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return tr.instant('staff.profile.saveFailed');
}
