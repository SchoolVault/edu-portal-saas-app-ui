import { ONBOARD_ADMIN_PASSWORD_MAX, ONBOARD_ADMIN_PASSWORD_MIN } from './auth-forms.constants';
import { isValidEmail } from './email.validation';
import type { FieldErrors } from './onboard-school-form.validation';
import { isValidLoginPhone } from './phone.validation';

export type LoginField = 'email' | 'password' | 'schoolCode' | 'phone' | 'otp' | 'confirmPassword';

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

export interface PhoneOtpSendValues {
  schoolCode: string;
  phone: string;
}

export function validatePhoneOtpSend(values: PhoneOtpSendValues): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {};
  if (!(values.schoolCode ?? '').trim()) {
    errors.schoolCode = 'login.validation.schoolCodeRequired';
  }
  const phone = (values.phone ?? '').trim();
  if (!phone) {
    errors.phone = 'login.validation.phoneRequired';
  } else if (!isValidLoginPhone(phone)) {
    errors.phone = 'login.validation.phoneInvalid';
  }
  return errors;
}

export interface PhoneOtpVerifyValues {
  schoolCode: string;
  phone: string;
  otp: string;
}

export function validatePhoneOtpVerify(values: PhoneOtpVerifyValues): FieldErrors<LoginField> {
  const errors = validatePhoneOtpSend({ schoolCode: values.schoolCode, phone: values.phone });
  const otp = (values.otp ?? '').trim();
  if (!otp) {
    errors.otp = 'login.validation.otpRequired';
  } else if (otp.length < 4 || otp.length > 6 || !/^\d+$/.test(otp)) {
    errors.otp = 'login.validation.otpInvalid';
  }
  return errors;
}

export interface PasswordResetValues {
  schoolCode: string;
  phone: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}

export function validatePasswordResetStart(values: PasswordResetValues): FieldErrors<LoginField> {
  return validatePhoneOtpSend({ schoolCode: values.schoolCode, phone: values.phone });
}

export function validatePasswordResetVerify(values: PasswordResetValues): FieldErrors<LoginField> {
  return validatePhoneOtpVerify({ schoolCode: values.schoolCode, phone: values.phone, otp: values.otp ?? '' });
}

export function validatePasswordResetComplete(values: PasswordResetValues): FieldErrors<LoginField> {
  const errors = validatePasswordResetVerify(values);
  const password = values.password ?? '';
  const confirmPassword = values.confirmPassword ?? '';
  if (!password.trim()) {
    errors.password = 'forgotPassword.validation.passwordRequired';
  } else if (password.length < ONBOARD_ADMIN_PASSWORD_MIN || password.length > ONBOARD_ADMIN_PASSWORD_MAX) {
    errors.password = 'forgotPassword.validation.passwordLength';
  }
  if (!confirmPassword.trim()) {
    errors.confirmPassword = 'forgotPassword.validation.confirmRequired';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'forgotPassword.validation.passwordMismatch';
  }
  return errors;
}
