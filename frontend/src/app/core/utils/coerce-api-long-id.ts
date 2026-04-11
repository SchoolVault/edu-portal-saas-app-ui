/** Normalizes API / route ids (number or numeric string) to a finite number. */
export function coerceApiLongId(value: unknown, label?: string): number {
  const n = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(label ? `Invalid ${label} id` : 'Invalid id');
  }
  return n;
}
