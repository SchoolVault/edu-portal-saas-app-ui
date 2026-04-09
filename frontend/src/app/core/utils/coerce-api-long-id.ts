/**
 * Coerce UI / mock ids or numeric strings for Spring {@code Long} path/body fields.
 * Pure numeric strings use {@code Number} first; otherwise trailing digits are used (demo-friendly).
 */
export function coerceApiLongId(raw: string | number | null | undefined, fieldLabel: string): number {
  if (raw == null || raw === '') {
    throw new Error(`${fieldLabel} id is required`);
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) {
      throw new Error(`Invalid ${fieldLabel} id`);
    }
    return raw;
  }
  const s = String(raw).trim();
  const n = Number(s);
  if (Number.isFinite(n) && n > 0) {
    return n;
  }
  const m = /(\d+)$/.exec(s);
  if (m) {
    const v = Number(m[1]);
    if (Number.isFinite(v) && v > 0) {
      return v;
    }
  }
  throw new Error(`Invalid ${fieldLabel} id for server: "${raw}"`);
}
