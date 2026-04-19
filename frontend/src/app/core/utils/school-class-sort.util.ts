import type { SchoolClass } from '../models/models';

/**
 * Sorts school classes for dropdowns: by grade (ascending), then by display name.
 * Prefer server `grade`; fallback parses a leading integer from `name` (e.g. "Class 10").
 */
export function sortSchoolClassesByGrade(classes: readonly SchoolClass[]): SchoolClass[] {
  return [...classes].sort((a, b) => {
    const ga = classSortKey(a);
    const gb = classSortKey(b);
    if (ga !== gb) {
      return ga - gb;
    }
    return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
  });
}

function classSortKey(c: SchoolClass): number {
  if (typeof c.grade === 'number' && Number.isFinite(c.grade)) {
    return c.grade;
  }
  const n = parseLeadingInt(c.name);
  return n ?? 9999;
}

function parseLeadingInt(name: string | undefined): number | null {
  if (!name) {
    return null;
  }
  const m = /(\d+)/.exec(name.trim());
  if (!m) {
    return null;
  }
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
