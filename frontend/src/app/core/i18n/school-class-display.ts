import { TranslateService } from '@ngx-translate/core';

/**
 * Localizes common auto-generated class names (e.g. "Class 10") for UI chrome.
 * Custom or free-text class names from the API are returned unchanged.
 */
export function formatSchoolClassName(raw: string | null | undefined, tr: TranslateService): string {
  if (raw == null) {
    return '';
  }
  const s = String(raw).trim();
  if (!s) {
    return '';
  }
  const m = /^class\s+(\d+)\s*$/i.exec(s);
  if (m) {
    return tr.instant('shared.schoolClass.numbered', { n: m[1] });
  }
  if (/^pre-primary\s*\(\s*whole class\s*\)\s*$/i.test(s)) {
    return tr.instant('shared.schoolClass.prePrimaryWhole');
  }
  return s;
}

/** When only class id is known, still show a localized “Class n” label. */
export function formatSchoolClassDisplayName(
  classId: number,
  rawName: string | null | undefined,
  tr: TranslateService
): string {
  const trimmed = rawName?.trim();
  if (trimmed) {
    const localized = formatSchoolClassName(trimmed, tr);
    return localized || trimmed;
  }
  return tr.instant('shared.schoolClass.numbered', { n: String(classId) });
}
