/**
 * Pure policy for who may set directory / student photos in the UI.
 * Mirrors future media API authorization; keep logic here, not in templates.
 */
export interface ClassTeacherRow {
  classId: number;
}

export function canAdminSetTeacherDirectoryPhoto(viewerRole: string | null): boolean {
  const r = (viewerRole || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}

export function canUploadStudentDirectoryPhoto(ctx: {
  viewerRole: string | null;
  studentClassId?: number | null;
  classTeacherOf?: ClassTeacherRow[] | null;
}): boolean {
  const r = (ctx.viewerRole || '').toLowerCase();
  if (r === 'admin' || r === 'super_admin') return true;
  if (r !== 'teacher') return false;
  const cid = ctx.studentClassId;
  if (cid == null || cid === 0) return false;
  const rows = ctx.classTeacherOf ?? [];
  return rows.some(row => row.classId === cid);
}
