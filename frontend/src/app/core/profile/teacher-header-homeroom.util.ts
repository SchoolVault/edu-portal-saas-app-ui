import type { ProfileSummary } from '../models/models';

export type HomeroomAssignmentRow = NonNullable<ProfileSummary['classTeacherOf']>[number];

/**
 * When a teacher has several homeroom rows (e.g. multiple sections), pick one stable row for header chips:
 * lowest class id, then section name.
 */
export function pickPrimaryHomeroomAssignment(rows: HomeroomAssignmentRow[] | undefined): HomeroomAssignmentRow | undefined {
  if (!rows?.length) {
    return undefined;
  }
  return [...rows].sort((a, b) => {
    const ca = Number(a.classId ?? 0);
    const cb = Number(b.classId ?? 0);
    if (ca !== cb) {
      return ca - cb;
    }
    return String(a.sectionName ?? '').localeCompare(String(b.sectionName ?? ''), undefined, { sensitivity: 'base' });
  })[0];
}

/** Display like "7-A" from catalog names (e.g. "Class 7" + "A"). */
export function formatHomeroomClassSectionLabel(row: Pick<HomeroomAssignmentRow, 'className' | 'sectionName'>): string {
  const rawClass = (row.className ?? '').trim();
  const section = (row.sectionName ?? '').trim();
  if (!rawClass && !section) {
    return '';
  }
  const gradePart = rawClass.replace(/^class\s*/i, '').trim();
  if (gradePart && section) {
    return `${gradePart}-${section}`;
  }
  return gradePart || section;
}
