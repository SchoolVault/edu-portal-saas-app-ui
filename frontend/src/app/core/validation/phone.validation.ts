/**
 * India portal mobile: store and transmit exactly 10 national digits (first digit 6–9).
 * Legacy API values may still be {@code +CC-XXXXXXXXXX}; normalize for display and forms.
 */

/** @deprecated Prefer {@link isValidIndiaMobileTen} — kept for rare non-India paths in mocks. */
export const CANONICAL_INTL_PHONE = /^\+\d{1,4}-\d{10}$/;

/** @deprecated */
export function isValidCanonicalIntlPhone(value: string): boolean {
  return CANONICAL_INTL_PHONE.test((value ?? '').trim());
}

/** Strict India mobile: 10 digits, first digit 6–9 (matches backend {@code nationalIndiaMobile10}). */
export function isValidIndiaMobileTen(value: string | null | undefined): boolean {
  return /^[6-9]\d{9}$/.test(String(value ?? '').trim());
}

/**
 * Normalize user typing / pasted values toward 10 national digits (best effort before strict validation).
 */
export function digitsOnlyIndiaMobile(raw: string | null | undefined): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) {
    d = d.slice(2);
  }
  if (d.length === 11 && d.startsWith('0')) {
    d = d.slice(1);
  }
  return d.slice(0, 10);
}

/** Show 10-digit national in inputs when API returns national or legacy {@code +91-…}. */
export function displayIndiaMobileTenFromApi(stored: string | null | undefined): string {
  const s = (stored ?? '').trim();
  if (!s) {
    return '';
  }
  const canonical = s.match(/^\+(\d{1,4})-(\d{10})$/);
  if (canonical?.[2]) {
    return canonical[2];
  }
  return digitsOnlyIndiaMobile(s);
}
