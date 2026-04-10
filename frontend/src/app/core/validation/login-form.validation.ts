import { isValidEmail } from './email.validation';
import type { FieldErrors } from './onboard-school-form.validation';

export type LoginField = 'email' | 'password' | 'schoolCode';

export interface LoginFormValues {
  email: string;
  password: string;
  schoolCode: string;
}

/** Mirrors {@code AuthDTOs.LoginRequest} validation. */
export function validateLoginForm(values: LoginFormValues): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {};

  const email = (values.email ?? '').trim();
  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!(values.password ?? '').trim()) {
    errors.password = 'Password is required';
  }

  if (!(values.schoolCode ?? '').trim()) {
    errors.schoolCode = 'School code is required';
  }

  return errors;
}
