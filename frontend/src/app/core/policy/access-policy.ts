/**
 * Central place for role checks aligned with backend {@code @PreAuthorize} rules.
 *
 * Tenant & scope doctrine (extend gradually): parents see only linked students’ data (fees, marks,
 * attendance, scoped chat). Teachers act within assigned classes/rosters; student master data changes
 * stay admin-only unless you add explicit grants. School admins are bounded by tenant_id. Future
 * per-action toggles should read from this module plus backend permission tables.
 *
 * - Legacy coarse “staff” helper below: admin, super_admin, teacher only.
 *   Roster-aligned UI and guards use `UiAccessService.hasAcademicRosterReadAccess()` (mirrors backend
 *   `RbacSpel#ACADEMIC_ROSTER_READ`) so JWT `AppPermission` bundles stay authoritative.
 * - Student master mutations: admin + super_admin only (matches {@code PUT /students/{id}})
 * - Fine-grained module checks: prefer `AuthService.hasAppPermission` with `AppPermission` codes
 *   (mirrors backend `hasAuthority`); role checks remain for legacy paths until fully migrated.
 */
export function schoolStaffRole(role: string | null | undefined): boolean {
  const r = (role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin' || r === 'teacher';
}

export function schoolAdminRole(role: string | null | undefined): boolean {
  const r = (role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}
