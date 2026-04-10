/**
 * Central place for role checks aligned with backend {@code @PreAuthorize} rules.
 * - School staff: admin, super_admin (platform operator in a school context), teacher
 * - Student master mutations: admin + super_admin only (matches {@code PUT /students/{id}})
 */
export function schoolStaffRole(role: string | null | undefined): boolean {
  const r = (role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin' || r === 'teacher';
}

export function schoolAdminRole(role: string | null | undefined): boolean {
  const r = (role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}
