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
    errors.email = 'login.validation.emailRequired';
  } else if (!isValidEmail(email)) {
    errors.email = 'login.validation.emailInvalid';
  }

  if (!(values.password ?? '').trim()) {
    errors.password = 'login.validation.passwordRequired';
  }

  if (!(values.schoolCode ?? '').trim()) {
    errors.schoolCode = 'login.validation.schoolCodeRequired';
  }

  return errors;
}
