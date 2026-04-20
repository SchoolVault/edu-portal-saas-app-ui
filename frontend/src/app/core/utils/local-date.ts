/**
 * Calendar date in the browser's local timezone (YYYY-MM-DD).
 * Prefer this over `new Date().toISOString().slice(0, 10)` which uses UTC and can show "yesterday"
 * for evening users in India and other positive-offset zones.
 */
export function localIsoDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
