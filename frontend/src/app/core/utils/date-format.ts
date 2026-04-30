/**
 * UI-safe date formatter for date-only and ISO timestamps.
 * Returns dd-MM-yyyy for valid ISO-like inputs, otherwise original text.
 */
export function formatDateDdMmYyyy(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) {
    return '';
  }
  const head = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(head);
  if (!match) {
    return value;
  }
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy}`;
}
