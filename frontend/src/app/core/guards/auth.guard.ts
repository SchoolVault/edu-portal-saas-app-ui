import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { schoolStaffRole } from '../policy/access-policy';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.ensureValidSession().pipe(
    take(1),
    map(ok => (ok ? true : router.createUrlTree(['/login'])))
  );
};

/** Roster and student profiles — admins, teachers, super_admin; not parents. */
export const schoolStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      if (schoolStaffRole(auth.getRole())) {
        return true;
      }
      return router.createUrlTree(['/app/parent']);
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
      const r = (auth.getRole() || '').toLowerCase();
      if (r === 'admin' || r === 'super_admin') {
        return true;
      }
      return router.createUrlTree(['/app/students']);
    })
  );
};

/** Leave & HR workflows — school staff only (not parents). */
export const leaveStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureValidSession().pipe(
    take(1),
    map(ok => {
      if (!ok) {
        return router.createUrlTree(['/login']);
      }
      const r = (auth.getRole() || '').toLowerCase();
      if (r === 'admin' || r === 'teacher') {
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
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
      const r = (auth.getRole() || '').toLowerCase();
      if (r === 'super_admin') {
        return router.createUrlTree(['/app/platform-settings']);
      }
      if (r === 'admin' || r === 'teacher' || r === 'parent') {
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
