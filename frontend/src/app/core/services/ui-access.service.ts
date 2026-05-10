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

  private hasAnyPermission(...codes: string[]): boolean {
    return codes.some(code => this.auth.hasAppPermission(code));
  }

  /** Mirrors {@code RbacSpel#ACADEMIC_ROSTER_READ} (role + authority arms). */
  hasAcademicRosterReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.SCHOOL_ACADEMIC_READ,
      AppPermission.SCHOOL_ACADEMIC_WRITE,
      AppPermission.SCHOOL_STUDENT_READ,
      AppPermission.SCHOOL_STUDENT_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#TRANSPORT_DESK_READ} — route/fleet visibility and transport shell. */
  hasTransportDeskReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_TRANSPORT_READ,
      AppPermission.SCHOOL_TRANSPORT_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#TRANSPORT_DESK_WRITE} — routes, vehicles, drivers mutations. */
  hasTransportDeskWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_TRANSPORT_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#HOSTEL_DESK_WRITE} — blocks, rooms, allocations. */
  hasHostelDeskReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_READ,
      AppPermission.SCHOOL_HOSTEL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#HOSTEL_DESK_WRITE} — blocks, rooms, allocations. */
  hasHostelDeskWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Hostel billing desk read envelope. */
  hasHostelBillingReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_BILLING_READ,
      AppPermission.SCHOOL_HOSTEL_BILLING_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Hostel billing write envelope (plan mapping + invoice trigger). */
  hasHostelBillingWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_BILLING_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Hostel approval lane (leave-out/gate-pass + visitor approvals). */
  hasHostelApprovalWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_APPROVAL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Hostel visitor desk lane (check-in/check-out). */
  hasHostelVisitorWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_VISITOR_WRITE,
      AppPermission.SCHOOL_HOSTEL_APPROVAL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Hostel incident logging lane. */
  hasHostelIncidentWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_HOSTEL_INCIDENT_WRITE,
      AppPermission.SCHOOL_HOSTEL_APPROVAL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Parent/student read-only hostel profile lane. */
  hasHostelPortalReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.PORTAL_PARENT,
      AppPermission.PORTAL_STUDENT,
      AppPermission.SCHOOL_HOSTEL_READ,
      AppPermission.SCHOOL_HOSTEL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Mirrors {@code RbacSpel#ACADEMIC_DESK_ADMIN} authority arm (+ admin roles). */
  hasAcademicDeskAdminAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_ACADEMIC_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code TENANT_ADMIN} / {@code PLATFORM_ADMIN} JWT authorities. */
  hasTenantOperatorAuthority(): boolean {
    return (
      this.auth.hasAppPermission(AppPermission.TENANT_ADMIN) ||
      this.auth.hasAppPermission(AppPermission.PLATFORM_ADMIN)
    );
  }

  /** Fees desk visibility: read/write atoms + tenant/platform operators. */
  hasSchoolFeeOfficeDesk(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_FEES_READ,
      AppPermission.SCHOOL_FEES_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#SCHOOL_SETTINGS_FINANCE} read/write envelope — settlement routing, finance profile. */
  hasSchoolSettingsFinanceAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_SETTINGS_FINANCE_READ,
      AppPermission.SCHOOL_SETTINGS_FINANCE_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Payroll desk operations (read/write atoms + tenant/platform operators). */
  hasSchoolPayrollOfficeDesk(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_PAYROLL_READ,
      AppPermission.SCHOOL_PAYROLL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#STUDENT_MASTER_WRITE} — student master CRUD / promotions. */
  hasStudentMasterWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_STUDENT_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Teacher desk mutations (create/edit/lifecycle) — aligns to academic write envelope. */
  hasTeacherMasterWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_ACADEMIC_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Operations desk write lane (staff, gate, visitor, inventory mutations). */
  hasOperationsDeskWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_OPERATIONS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Inactive roster visibility is restricted to school operators/admin desks. */
  canViewInactiveRosterRows(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_ACADEMIC_WRITE,
      AppPermission.SCHOOL_STUDENT_WRITE,
      AppPermission.SCHOOL_OPERATIONS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#IMPORT_EXPORT_JOBS} — bulk jobs (not template-only reads). */
  hasSchoolImportExportDesk(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_IMPORT_EXPORT_READ,
      AppPermission.SCHOOL_IMPORT_EXPORT_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#SCHOOL_TENANT_SETTINGS} read envelope — tenant settings surfaces under /settings. */
  hasSchoolSettingsCoreAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_SETTINGS_CORE_READ,
      AppPermission.SCHOOL_SETTINGS_CORE_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#EXAM_OFFICE_WRITE} — templates, approve/reject/publish/rollback. */
  hasSchoolExamsOfficeWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_EXAMS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#EXAM_STAFF_READ} — staff exam list, schedules, marks read. */
  hasExamStaffReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.SCHOOL_EXAMS_READ,
      AppPermission.SCHOOL_EXAMS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#EXAM_MARKS_AND_SCHEDULE_WRITE} — marks entry + schedule edits. */
  hasExamMarksAndScheduleWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.SCHOOL_EXAMS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#LIBRARY_CATALOG_WRITE} — catalog CRUD. */
  hasLibraryCatalogWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_LIBRARY_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#LIBRARY_CIRCULATION_ACCESS} — issue/return. */
  hasLibraryCirculationDeskAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_LIBRARY_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Library member lane: catalog + own/linked borrow history only. */
  hasLibraryMemberReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_LIBRARY_MEMBER_READ,
      AppPermission.SCHOOL_LIBRARY_READ,
      AppPermission.SCHOOL_LIBRARY_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Library desk lane: operator visibility for full ledger views (read/write). */
  hasLibraryDeskLaneAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_LIBRARY_READ,
      AppPermission.SCHOOL_LIBRARY_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  hasLibraryDeskReadAccess(): boolean {
    return this.hasLibraryDeskLaneAccess();
  }

  /** {@code RbacSpel#SCHOOL_COMMUNICATION_READ} — inbox ops analytics and delivery visibility. */
  hasCommunicationDeskReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_COMMUNICATION_READ,
      AppPermission.SCHOOL_COMMUNICATION_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#COMMUNICATION_SCHOOL_ADMIN} — comms admin / campaigns. */
  hasCommunicationSchoolAdminDesk(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_COMMUNICATION_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#SCHOOL_REPORTS_READ} — school-scoped analytics entry points. */
  hasSchoolReportsDesk(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_REPORTS_READ,
      AppPermission.SCHOOL_REPORTS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /**
   * {@code RbacSpel#REPORT_LIBRARY_DESK} — KPI dashboard + admin dashboard feeds in {@code ReportController}.
   * (Name is historical; covers admin + library desk + platform operators.)
   */
  hasReportLibraryDeskAdminDashboardAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_REPORTS_READ,
      AppPermission.SCHOOL_REPORTS_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Settings feature toggles and tenant-scoped control-plane (not parent self-service). */
  hasTenantSettingsAdminShell(): boolean {
    return this.hasAnyPermission(AppPermission.TENANT_ADMIN, AppPermission.PLATFORM_ADMIN);
  }

  /** {@code RbacSpel#SCHOOL_TENANT_SETTINGS} — school settings shell (branding, features, RBAC catalog). */
  hasSchoolTenantSettingsWriteShell(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_SETTINGS_CORE_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /**
   * Assigning stacked school roles / duty bundles (settings RBAC UI). Narrow {@code TENANT_SETTINGS} desk does not
   * include this — only portal admin or {@code TENANT_ADMIN} / platform operators.
   */
  hasSchoolRbacAssignmentAdminAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_RBAC_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** {@code RbacSpel#SCHOOL_DIRECTORY_READ} — tenant people directory search visibility. */
  hasDirectoryReadAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_DIRECTORY_READ,
      AppPermission.SCHOOL_DIRECTORY_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Create/update staff rows, exports, and lifecycle actions on the directory desk. */
  hasDirectoryDeskWriteAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_DIRECTORY_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
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
      AppPermission.SCHOOL_FEES_READ,
      AppPermission.SCHOOL_FEES_WRITE,
      AppPermission.SCHOOL_SETTINGS_FINANCE_READ,
      AppPermission.SCHOOL_SETTINGS_FINANCE_WRITE,
      AppPermission.SCHOOL_PAYROLL_READ,
      AppPermission.SCHOOL_PAYROLL_WRITE,
      AppPermission.SCHOOL_SETTINGS_CORE_READ,
      AppPermission.SCHOOL_SETTINGS_CORE_WRITE,
      AppPermission.SCHOOL_GUARDIAN_READ,
      AppPermission.SCHOOL_GUARDIAN_WRITE,
      AppPermission.SCHOOL_STUDENT_READ,
      AppPermission.SCHOOL_STUDENT_WRITE,
      AppPermission.SCHOOL_EXAMS_READ,
      AppPermission.SCHOOL_EXAMS_WRITE,
      AppPermission.SCHOOL_IMPORT_EXPORT_READ,
      AppPermission.SCHOOL_IMPORT_EXPORT_WRITE,
      AppPermission.SCHOOL_COMMUNICATION_READ,
      AppPermission.SCHOOL_COMMUNICATION_WRITE,
      AppPermission.SCHOOL_OPERATIONS_READ,
      AppPermission.SCHOOL_OPERATIONS_WRITE,
      AppPermission.SCHOOL_ACADEMIC_READ,
      AppPermission.SCHOOL_ACADEMIC_WRITE,
      AppPermission.SCHOOL_TRANSPORT_READ,
      AppPermission.SCHOOL_TRANSPORT_WRITE,
      AppPermission.SCHOOL_HOSTEL_READ,
      AppPermission.SCHOOL_HOSTEL_WRITE,
      AppPermission.SCHOOL_HOSTEL_BILLING_READ,
      AppPermission.SCHOOL_HOSTEL_BILLING_WRITE,
      AppPermission.SCHOOL_HOSTEL_APPROVAL_WRITE,
      AppPermission.SCHOOL_HOSTEL_VISITOR_WRITE,
      AppPermission.SCHOOL_HOSTEL_INCIDENT_WRITE,
      AppPermission.SCHOOL_REPORTS_READ,
      AppPermission.SCHOOL_REPORTS_WRITE,
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.SCHOOL_LIBRARY_READ,
      AppPermission.SCHOOL_LIBRARY_WRITE,
    ];
    return desk.some(p => this.auth.hasAppPermission(p));
  }

  /** Tenant chat — campus personas plus school chat read/write atoms for employee desks. */
  hasChatParticipantAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_CHAT_READ,
      AppPermission.SCHOOL_CHAT_WRITE,
      AppPermission.ACADEMIC_TEACHER,
      AppPermission.PORTAL_PARENT,
      AppPermission.PORTAL_STUDENT,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
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
  hasLeaveSelfAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_LEAVE_SELF_READ,
      AppPermission.SCHOOL_LEAVE_SELF_APPLY,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  hasLeaveApprovalAccess(): boolean {
    return this.hasAnyPermission(
      AppPermission.SCHOOL_LEAVE_APPROVAL_READ,
      AppPermission.SCHOOL_LEAVE_APPROVAL_WRITE,
      AppPermission.TENANT_ADMIN,
      AppPermission.PLATFORM_ADMIN
    );
  }

  /** Leave module: self-service lane + approval lane (matches dedicated leave permissions). */
  hasLeaveModuleAccess(): boolean {
    return this.hasLeaveSelfAccess() || this.hasLeaveApprovalAccess();
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
