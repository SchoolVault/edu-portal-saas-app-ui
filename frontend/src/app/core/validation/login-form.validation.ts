import { isValidEmail } from './email.validation';
import type { FieldErrors } from './onboard-school-form.validation';
import { isValidLoginPhone } from './phone.validation';

export type LoginField = 'email' | 'password' | 'schoolCode' | 'phone' | 'otp';

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
