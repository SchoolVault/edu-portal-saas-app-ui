import { Teacher } from '../models/models';

/**
 * When the signed-in user is a teacher (not admin), API and mocks must expose only
 * colleague-appropriate directory fields — same shape as admin responses, sensitive fields blanked
 * so the UI can stay role-agnostic and toggle labels via template checks.
 */
export function shouldApplyTeacherColleagueVisibility(normalizedRole: string): boolean {
  return normalizedRole === 'teacher';
}

/**
 * Hides colleague directory fields for peer listing. Keeps {@link Teacher.userId} for the signed-in
 * teacher’s own row so features can link portal user → teacher record (timetable, roster scope).
 */
export function sanitizeTeacherForColleaguePeerView(teacher: Teacher, viewerPortalUserId?: number): Teacher {
  const isSelf = viewerPortalUserId != null && teacher.userId === viewerPortalUserId;
  const redacted: Teacher = {
    ...teacher,
    email: '',
    phone: '',
    salary: 0,
    qualification: '',
    userId: undefined,
    tenantId: '',
  };
  if (isSelf) {
    return {
      ...redacted,
      userId: teacher.userId,
    };
  }
  return redacted;
}
