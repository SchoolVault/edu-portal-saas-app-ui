/**
 * Central place for role checks aligned with backend {@code @PreAuthorize} rules.
 *
 * Tenant & scope doctrine (extend gradually): parents see only linked students’ data (fees, marks,
 * attendance, scoped chat). Teachers act within assigned classes/rosters; student master data changes
 * stay admin-only unless you add explicit grants. School admins are bounded by tenant_id. Future
 * per-action toggles should read from this module plus backend permission tables.
 *
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
