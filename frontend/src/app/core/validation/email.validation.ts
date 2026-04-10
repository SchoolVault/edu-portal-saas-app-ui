/** Loose RFC-style check; matches typical @Email expectations in Jakarta Bean Validation. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  const s = (value ?? '').trim();
  return s.length > 0 && EMAIL_PATTERN.test(s);
}
