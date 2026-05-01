/**
 * Normalizes subject display names for equality checks (catalog / teacher_subjects).
 * Keeps filtering aligned with {@link AcademicService#getSubjectCatalog} names.
 */
export function normalizeSubjectCatalogName(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Exact match after normalization (avoids substring bugs e.g. Science vs Computer Science). */
export function subjectCatalogNamesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeSubjectCatalogName(a) === normalizeSubjectCatalogName(b);
}
