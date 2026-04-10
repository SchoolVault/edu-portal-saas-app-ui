import type { OnboardSchoolRequest } from '../models/models';
import {
  ONBOARD_ADMIN_PASSWORD_MAX,
  ONBOARD_ADMIN_PASSWORD_MIN,
  ONBOARD_SCHOOL_CODE_MAX,
  ONBOARD_SCHOOL_CODE_MIN,
} from './auth-forms.constants';
import { isValidEmail } from './email.validation';

export type OnboardSchoolField = keyof OnboardSchoolRequest;

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * Pure validator — same rules as {@code OnboardTenantRequest} on the server.
 */
export function validateOnboardSchoolForm(form: OnboardSchoolRequest): FieldErrors<OnboardSchoolField> {
  const errors: FieldErrors<OnboardSchoolField> = {};

  const schoolName = (form.schoolName ?? '').trim();
  if (!schoolName) {
    errors.schoolName = 'School name is required';
  }

  const schoolCode = (form.schoolCode ?? '').trim();
  if (!schoolCode) {
    errors.schoolCode = 'School code is required';
  } else if (schoolCode.length < ONBOARD_SCHOOL_CODE_MIN || schoolCode.length > ONBOARD_SCHOOL_CODE_MAX) {
    errors.schoolCode = `Use ${ONBOARD_SCHOOL_CODE_MIN}–${ONBOARD_SCHOOL_CODE_MAX} characters (letters/numbers).`;
  }

  const adminName = (form.adminName ?? '').trim();
  if (!adminName) {
    errors.adminName = 'Admin name is required';
  }

  const adminEmail = (form.adminEmail ?? '').trim();
  if (!adminEmail) {
    errors.adminEmail = 'Admin email is required';
  } else if (!isValidEmail(adminEmail)) {
    errors.adminEmail = 'Enter a valid email address';
  }

  const adminPassword = form.adminPassword ?? '';
  if (!adminPassword) {
    errors.adminPassword = 'Password is required';
  } else if (
    adminPassword.length < ONBOARD_ADMIN_PASSWORD_MIN ||
    adminPassword.length > ONBOARD_ADMIN_PASSWORD_MAX
  ) {
    errors.adminPassword = `Password must be ${ONBOARD_ADMIN_PASSWORD_MIN}–${ONBOARD_ADMIN_PASSWORD_MAX} characters`;
  }

  return errors;
}

export function hasFieldErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
