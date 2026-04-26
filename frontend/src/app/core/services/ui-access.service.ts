import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { TenantModuleGateService } from './tenant-module-gate.service';
import { NavItem } from '../config/app-constants';
import { AppPermission } from '../auth/app-permission.constants';

/**
 * Single place for UI visibility aligned with backend {@code RbacSpel} / {@code AppPermission}.
 * School admins grant duties via stacked permissions; until then, {@code school_staff} / {@code library_staff}
 * only see modules their baseline allows (see {@code AuthService.getEffectivePermissionCodes}).
 * Server remains authoritative; this layer avoids showing links the API will reject.
 */
@Injectable({ providedIn: 'root' })
export class UiAccessService {
  /**
   * Portal roles that carry <b>only</b> stacked {@code AppPermission}s for duties (no implicit module bundles).
   * For these users, a nav item or route that lists both coarse roles and permissions must not unlock on role alone.
   */
  private static readonly NARROW_PORTAL_STAFF_ROLES = new Set(['school_staff', 'library_staff']);

  constructor(
    private auth: AuthService,
    private moduleGate: TenantModuleGateService
  ) {}

  private isNarrowPortalStaffRole(normalizedRole: string): boolean {
    return UiAccessService.NARROW_PORTAL_STAFF_ROLES.has(normalizedRole);
  }

  /** Mirrors {@code RbacSpel#ACADEMIC_ROSTER_READ} (role + authority arms). */
  hasAcademicRosterReadAccess(): boolean {
    const role = this.auth.getNormalizedRole();
    if (['admin', 'teacher', 'super_admin'].includes(role)) {
      return true;
    }
    return (
      this.auth.hasAppPermission(AppPermission.ACADEMIC_TEACHER) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_FEE_OFFICE) ||
      this.auth.hasAppPermission(AppPermission.FEE_STRUCTURES_READ) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_EXAMS_OFFICE) ||
      this.auth.hasAppPermission(AppPermission.LIBRARY_MANAGE) ||
      this.auth.hasAppPermission(AppPermission.LIBRARY_CIRCULATION) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_TRANSPORT_DESK) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_HOSTEL_DESK) ||
      this.auth.hasAppPermission(AppPermission.TENANT_ADMIN) ||
      this.auth.hasAppPermission(AppPermission.PLATFORM_ADMIN)
    );
  }

  /** {@code RbacSpel#TRANSPORT_DESK_WRITE} — routes, vehicles, drivers. */
  hasTransportDeskWriteAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_TRANSPORT_DESK) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#HOSTEL_DESK_WRITE} — blocks, rooms, allocations. */
  hasHostelDeskWriteAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_HOSTEL_DESK) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** Mirrors {@code RbacSpel#ACADEMIC_DESK_ADMIN} authority arm (+ admin roles). */
  hasAcademicDeskAdminAccess(): boolean {
    const role = this.auth.getNormalizedRole();
    if (['admin', 'super_admin'].includes(role)) {
      return true;
    }
    return (
      this.auth.hasAppPermission(AppPermission.TENANT_ADMIN) ||
      this.auth.hasAppPermission(AppPermission.PLATFORM_ADMIN) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_OPERATIONS_HUB)
    );
  }

  /** {@code ADMIN}/{@code SUPER_ADMIN} portal identities (legacy implicit school bundles). */
  hasLegacySchoolPortalAdminOrSuperRole(): boolean {
    const r = this.auth.getNormalizedRole();
    return r === 'admin' || r === 'super_admin';
  }

  /** {@code TENANT_ADMIN} / {@code PLATFORM_ADMIN} JWT authorities. */
  hasTenantOperatorAuthority(): boolean {
    return (
      this.auth.hasAppPermission(AppPermission.TENANT_ADMIN) ||
      this.auth.hasAppPermission(AppPermission.PLATFORM_ADMIN)
    );
  }

  /** {@code RbacSpel#SCHOOL_FEE_OFFICE} — fee structures, collection, refunds. */
  hasSchoolFeeOfficeDesk(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_FEE_OFFICE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#SCHOOL_SETTINGS_FINANCE} — settlement routing, finance profile. */
  hasSchoolSettingsFinanceAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_SETTINGS_FINANCE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#SCHOOL_PAYROLL_OFFICE} — payroll desk operations. */
  hasSchoolPayrollOfficeDesk(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_PAYROLL_OFFICE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#STUDENT_MASTER_WRITE} — student master CRUD / promotions. */
  hasStudentMasterWriteAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_STUDENT_MASTER) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#IMPORT_EXPORT_JOBS} — bulk jobs (not template-only reads). */
  hasSchoolImportExportDesk(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_IMPORT_EXPORT) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#SCHOOL_SETTINGS_CORE} — tenant settings surfaces under /settings. */
  hasSchoolSettingsCoreAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_SETTINGS_CORE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#EXAM_OFFICE_WRITE} — templates, approve/reject/publish/rollback. */
  hasSchoolExamsOfficeWriteAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_EXAMS_OFFICE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#EXAM_STAFF_READ} — staff exam list, schedules, marks read. */
  hasExamStaffReadAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (['admin', 'teacher', 'super_admin'].includes(r)) {
      return true;
    }
    return (
      this.auth.hasAppPermission(AppPermission.ACADEMIC_TEACHER) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_EXAMS_OFFICE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#EXAM_MARKS_AND_SCHEDULE_WRITE} — marks entry + schedule edits. */
  hasExamMarksAndScheduleWriteAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (r === 'admin' || r === 'teacher') {
      return true;
    }
    return (
      this.auth.hasAppPermission(AppPermission.ACADEMIC_TEACHER) ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_EXAMS_OFFICE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#LIBRARY_CATALOG_WRITE} — catalog CRUD. */
  hasLibraryCatalogWriteAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (r === 'admin' || r === 'super_admin' || r === 'library_staff') {
      return true;
    }
    return this.auth.hasAppPermission(AppPermission.LIBRARY_MANAGE) || this.hasTenantOperatorAuthority();
  }

  /** {@code RbacSpel#LIBRARY_CIRCULATION_ACCESS} — issue/return. */
  hasLibraryCirculationDeskAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (r === 'admin' || r === 'super_admin' || r === 'library_staff') {
      return true;
    }
    return (
      this.auth.hasAppPermission(AppPermission.LIBRARY_MANAGE) ||
      this.auth.hasAppPermission(AppPermission.LIBRARY_CIRCULATION) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#COMMUNICATION_SCHOOL_ADMIN} — comms admin / campaigns. */
  hasCommunicationSchoolAdminDesk(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_OPERATIONS_HUB) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /** {@code RbacSpel#SCHOOL_REPORTS_SCHOOL} — school-scoped analytics entry points. */
  hasSchoolReportsDesk(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_REPORTS_SCHOOL) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /**
   * {@code RbacSpel#REPORT_LIBRARY_DESK} — KPI dashboard + admin dashboard feeds in {@code ReportController}.
   * (Name is historical; covers admin + library desk + platform operators.)
   */
  hasReportLibraryDeskAdminDashboardAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (['admin', 'library_staff', 'super_admin'].includes(r)) {
      return true;
    }
    return this.auth.hasAppPermission(AppPermission.LIBRARY_MANAGE) || this.hasTenantOperatorAuthority();
  }

  /** Settings feature toggles and tenant-scoped control-plane (not parent self-service). */
  hasTenantSettingsAdminShell(): boolean {
    return this.hasLegacySchoolPortalAdminOrSuperRole() || this.hasTenantOperatorAuthority();
  }

  /** {@code RbacSpel#SCHOOL_TENANT_SETTINGS} — school settings shell (branding, features, RBAC catalog). */
  hasSchoolTenantSettingsWriteShell(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.SCHOOL_SETTINGS_CORE) ||
      this.hasTenantOperatorAuthority()
    );
  }

  /**
   * Assigning stacked school roles / duty bundles (settings RBAC UI). Narrow {@code TENANT_SETTINGS} desk does not
   * include this — only portal admin or {@code TENANT_ADMIN} / platform operators.
   */
  hasSchoolRbacAssignmentAdminAccess(): boolean {
    return (
      this.hasLegacySchoolPortalAdminOrSuperRole() ||
      this.auth.hasAppPermission(AppPermission.TENANT_ADMIN) ||
      this.auth.hasAppPermission(AppPermission.PLATFORM_ADMIN)
    );
  }

  hasBaselineSchoolStaffPortal(): boolean {
    return this.auth.hasAppPermission(AppPermission.PORTAL_SCHOOL_STAFF);
  }

  /**
   * True when generic {@code school_staff} should land on the KPI dashboard (desk duties),
   * vs comms-first home ({@code /app/inbox}) for baseline-only employees.
   */
  hasDeskModulesForStaffHome(): boolean {
    const desk: readonly string[] = [
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN,
      AppPermission.SCHOOL_FEE_OFFICE,
      AppPermission.SCHOOL_SETTINGS_FINANCE,
      AppPermission.SCHOOL_PAYROLL_OFFICE,
      AppPermission.SCHOOL_SETTINGS_CORE,
      AppPermission.SCHOOL_STUDENT_MASTER,
      AppPermission.SCHOOL_EXAMS_OFFICE,
      AppPermission.SCHOOL_IMPORT_EXPORT,
      AppPermission.SCHOOL_OPERATIONS_HUB,
      AppPermission.SCHOOL_TRANSPORT_DESK,
      AppPermission.SCHOOL_HOSTEL_DESK,
      AppPermission.SCHOOL_REPORTS_SCHOOL,
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.LIBRARY_MANAGE,
      AppPermission.LIBRARY_CIRCULATION,
    ];
    return desk.some(p => this.auth.hasAppPermission(p));
  }

  /** Tenant chat — campus personas + optional {@code PORTAL_CHAT} for school employees (not platform operators). */
  hasChatParticipantAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (['admin', 'teacher', 'parent', 'student'].includes(r)) {
      return true;
    }
    return this.auth.hasAppPermission(AppPermission.PORTAL_CHAT);
  }

  /** Timetable reads: parents + roster-scoped staff ({@code ACADEMIC_ROSTER_READ}). */
  hasTimetableViewAccess(): boolean {
    const r = this.auth.getNormalizedRole();
    if (r === 'parent') {
      return true;
    }
    return this.hasAcademicRosterReadAccess();
  }

  /** Leave module: self-service uses roster read; queue uses desk admin (matches {@code LeaveController}). */
  hasLeaveModuleAccess(): boolean {
    return this.hasAcademicRosterReadAccess() || this.hasAcademicDeskAdminAccess();
  }

  /**
   * Sidebar / shell: tenant module flag + visibility from roles and/or JWT permissions.
   * <p>{@code school_staff} / {@code library_staff} never unlock a row on coarse role alone when
   * {@link NavItem.permissionsAny} is set — they need a matching authority (same idea as backend desk gates).</p>
   * <p>Platform {@code super_admin} must not inherit school-tenant nav via {@code PLATFORM_ADMIN} on the JWT
   * (common ERP pattern: control-plane shell only shows entries explicitly tagged for the operator role).</p>
   */
  isNavItemVisible(item: NavItem): boolean {
    const role = this.auth.getNormalizedRole();
    if (!role) {
      return false;
    }
    if (item.moduleGate && !this.moduleGate.isModuleEnabled(item.moduleGate)) {
      return false;
    }
    if (role === 'super_admin') {
      return item.roles.includes('super_admin');
    }
    const roleOk = item.roles.includes(role);
    const permKeys = item.permissionsAny ?? [];
    if (permKeys.length > 0) {
      const permOk = permKeys.some(code => this.auth.hasAppPermission(code));
      if (this.isNarrowPortalStaffRole(role)) {
        return permOk;
      }
      return roleOk || permOk;
    }
    return roleOk;
  }

  /**
   * Route guard helper: role and/or permission union, aligned with {@link #isNavItemVisible} for narrow staff.
   * When both arms are present, {@code school_staff} / {@code library_staff} must satisfy a permission (not role-only).
   */
  routeAccessUnion(requireAnyRole: string[] | undefined, requireAnyPermission: string[] | undefined): boolean {
    const role = this.auth.getNormalizedRole();
    const roles = (requireAnyRole ?? []).map(r => r.toLowerCase().trim()).filter(Boolean);
    const perms = (requireAnyPermission ?? []).filter(Boolean);
    const roleOk = roles.length === 0 || roles.includes(role);
    const permOk = perms.length === 0 || perms.some(p => this.auth.hasAppPermission(p));
    if (roles.length > 0 && perms.length > 0) {
      const matchedPerm = perms.some(p => this.auth.hasAppPermission(p));
      if (this.isNarrowPortalStaffRole(role)) {
        return matchedPerm;
      }
      return roleOk || matchedPerm;
    }
    if (roles.length > 0) {
      return roleOk;
    }
    if (perms.length > 0) {
      return permOk;
    }
    return true;
  }
}
