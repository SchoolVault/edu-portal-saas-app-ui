/**
 * 10-digit national number for India-focused forms (single local field, no country picker).
 * Aligns with backend {@code InternationalPhone.nationalIndiaMobile10} (strict 6–9 first digit on save).
 */
export function normalizeIndianMobileTenDigits(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2, 12);
  }
  if (digits.length === 13 && digits.startsWith('091')) {
    return digits.slice(3, 13);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1, 11);
  }
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2, 12);
  }
  return digits.slice(0, 10);
}
