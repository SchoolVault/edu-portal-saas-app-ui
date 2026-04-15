/** Aligned with backend {@code SendOtpRequest} phone pattern. */
const LOGIN_PHONE_PATTERN = /^[+]?[0-9\s\-]{10,22}$/;

export function isValidLoginPhone(value: string): boolean {
  const s = (value ?? '').trim();
  if (!s) {
    return false;
  }
  return LOGIN_PHONE_PATTERN.test(s);
}
