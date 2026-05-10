import type { OnboardSchoolRequest } from '../models/models';
import {
  ONBOARD_ADMIN_PASSWORD_MAX,
  ONBOARD_ADMIN_PASSWORD_MIN,
  ONBOARD_SCHOOL_CODE_MAX,
  ONBOARD_SCHOOL_CODE_MIN,
} from './auth-forms.constants';
import { isValidEmail } from './email.validation';
import { isValidIndiaMobileTen } from './phone.validation';

export type OnboardSchoolField = keyof OnboardSchoolRequest;

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * Pure validator — same rules as {@code OnboardTenantRequest} on the server.
 */
export function validateOnboardSchoolForm(form: OnboardSchoolRequest): FieldErrors<OnboardSchoolField> {
  const errors: FieldErrors<OnboardSchoolField> = {};

  const schoolName = (form.schoolName ?? '').trim();
  if (!schoolName) {
    errors.schoolName = 'signup.validation.schoolNameRequired';
  }

  const schoolCode = (form.schoolCode ?? '').trim();
  if (!schoolCode) {
    errors.schoolCode = 'signup.validation.schoolCodeRequired';
  } else if (schoolCode.length < ONBOARD_SCHOOL_CODE_MIN || schoolCode.length > ONBOARD_SCHOOL_CODE_MAX) {
    errors.schoolCode = 'signup.validation.schoolCodeLength';
  }

  const adminName = (form.adminName ?? '').trim();
  if (!adminName) {
    errors.adminName = 'signup.validation.adminNameRequired';
  }

  const adminEmail = (form.adminEmail ?? '').trim();
  if (adminEmail && !isValidEmail(adminEmail)) {
    errors.adminEmail = 'signup.validation.adminEmailInvalid';
  }

  const phone = (form.phone ?? '').trim();
  if (!phone) {
    errors.phone = 'signup.validation.phoneRequired';
  } else if (!isValidIndiaMobileTen(phone)) {
    errors.phone = 'signup.validation.phoneInvalid';
  }

  const adminPassword = form.adminPassword ?? '';
  if (!adminPassword) {
    errors.adminPassword = 'signup.validation.adminPasswordRequired';
  } else if (
    adminPassword.length < ONBOARD_ADMIN_PASSWORD_MIN ||
    adminPassword.length > ONBOARD_ADMIN_PASSWORD_MAX
  ) {
    errors.adminPassword = 'signup.validation.adminPasswordLength';
  }

  return errors;
}

export function hasFieldErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
