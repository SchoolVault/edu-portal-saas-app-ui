/** Canonical portal handset: +{country}-{10-digit-national} (matches backend strict policy). */
export const CANONICAL_INTL_PHONE = /^\+\d{1,4}-\d{10}$/;

/** Legacy / pasted values still accepted by backend normalizer — prefer {@link isValidCanonicalIntlPhone} for new UI. */
const LOGIN_PHONE_LEGACY_PATTERN = /^[+]?[0-9\s\-]{8,32}$/;

export function isValidCanonicalIntlPhone(value: string): boolean {
  return CANONICAL_INTL_PHONE.test((value ?? '').trim());
}

export function buildCanonicalIntlPhone(dialCode: string, nationalDigits: string): string {
  const d = (dialCode ?? '').replace(/\D/g, '');
  const n = (nationalDigits ?? '').replace(/\D/g, '');
  if (!d || !n) {
    return '';
  }
  if (n.length !== 10) {
    return '';
  }
  if (d.length < 1 || d.length > 4) {
    return '';
  }
  return `+${d}-${n}`;
}

export function splitCanonicalIntlPhone(value: string): { dial: string; national: string } {
  const m = (value ?? '').trim().match(/^\+(\d{1,4})-(\d{10})$/);
  if (m) {
    return { dial: m[1], national: m[2] };
  }
  return { dial: '91', national: '' };
}

export function isValidLoginPhone(value: string): boolean {
  const s = (value ?? '').trim();
  if (!s) {
    return false;
  }
  if (isValidCanonicalIntlPhone(s)) {
    return true;
  }
  return LOGIN_PHONE_LEGACY_PATTERN.test(s);
}
