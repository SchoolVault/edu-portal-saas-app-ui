import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { AppPermission } from '../auth/app-permission.constants';
import { DEFAULT_PLATFORM_TENANT_FEATURES } from '../constants/platform-tenant-features';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { UiAccessService } from '../services/ui-access.service';

/** Timetable UI — aligned with roster read + parent portal (see {@code TimetableController}). */
export const timetableAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ui = inject(UiAccessService);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      return ui.hasTimetableViewAccess() ? true : router.createUrlTree(['/app/dashboard']);
    })
  );
};

/** Chat — mirrors backend {@code RbacSpel#CHAT_TENANT_PARTICIPANT}. */
export const chatAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ui = inject(UiAccessService);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      return ui.hasChatParticipantAccess() ? true : router.createUrlTree(['/app/dashboard']);
    })
  );
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.ensureValidSession().pipe(
    take(1),
    map(ok => (ok ? true : router.createUrlTree(['/login'])))
  );
};

/**
 * Roster-scoped school surfaces (students, teachers, academic, attendance) — mirrors backend
 * {@code RbacSpel#ACADEMIC_ROSTER_READ} (admin/teacher/super_admin roles or roster authorities).
 */
export const schoolStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const uiAccess = inject(UiAccessService);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      if (uiAccess.hasAcademicRosterReadAccess()) {
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};

/** Enrollment and master student record changes — administrators only. */
export const adminOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      const r = auth.getNormalizedRole();
      if (r === 'admin' || r === 'super_admin') {
        return true;
      }
      const deskPermissions: readonly string[] = [
        AppPermission.TENANT_ADMIN,
        AppPermission.PLATFORM_ADMIN,
        AppPermission.SCHOOL_FEE_OFFICE,
        AppPermission.SCHOOL_PAYROLL_OFFICE,
        AppPermission.SCHOOL_OPERATIONS_HUB,
        AppPermission.SCHOOL_TRANSPORT_DESK,
        AppPermission.SCHOOL_HOSTEL_DESK,
        AppPermission.SCHOOL_STUDENT_MASTER,
        AppPermission.SCHOOL_EXAMS_OFFICE,
        AppPermission.SCHOOL_IMPORT_EXPORT,
        AppPermission.SCHOOL_SETTINGS_CORE,
        AppPermission.SCHOOL_SETTINGS_FINANCE,
        AppPermission.SCHOOL_REPORTS_SCHOOL,
      ];
      if (deskPermissions.some(p => auth.hasAppPermission(p))) {
        return true;
      }
      return router.createUrlTree(['/app/students']);
    })
  );
};

/** Bulk import / export — school admin and platform super-admin only (not teachers). */
export const importExportGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      const r = auth.getNormalizedRole();
      if (r === 'admin' || r === 'super_admin') {
        return true;
      }
      if (
        auth.hasAppPermission(AppPermission.SCHOOL_IMPORT_EXPORT) ||
        auth.hasAppPermission(AppPermission.TENANT_ADMIN) ||
        auth.hasAppPermission(AppPermission.PLATFORM_ADMIN)
      ) {
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};

/** Leave & HR — roster self-service or desk approver (matches {@code LeaveController} SpEL). */
export const leaveStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const settings = inject(SettingsService);
  const router = inject(Router);
  const ui = inject(UiAccessService);
  return auth.ensureValidSession().pipe(
    take(1),
    switchMap(ok => {
      if (!ok) {
        return of(router.createUrlTree(['/login']));
      }
      if (!ui.hasLeaveModuleAccess()) {
        return of(router.createUrlTree(['/app/dashboard']));
      }
      return settings.getFeatures().pipe(
        take(1),
        map(flags => {
          const enabled = flags?.leave ?? DEFAULT_PLATFORM_TENANT_FEATURES.leave;
          return enabled === false ? router.createUrlTree(['/app/dashboard']) : true;
        })
      );
    })
  );
};

/** School tenant settings — admins (full), teachers/parents (read-only school + profile). Super-admin uses platform settings only. */
export const schoolSettingsGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      const r = auth.getNormalizedRole();
      if (r === 'super_admin') {
        return router.createUrlTree(['/app/platform-settings']);
      }
      if (r === 'admin' || r === 'teacher' || r === 'parent' || r === 'library_staff' || r === 'school_staff' || r === 'student') {
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};

/** Platform super-admin routes (health, schools control plane). */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      if ((auth.getRole() || '').toLowerCase() === 'super_admin') {
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};
