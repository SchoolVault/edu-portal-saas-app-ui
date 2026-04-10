import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { schoolStaffRole } from '../policy/access-policy';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

/** Roster and student profiles — admins, teachers, super_admin; not parents. */
export const schoolStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if (schoolStaffRole(auth.getRole())) {
    return true;
  }
  router.navigate(['/app/parent']);
  return false;
};

/** Enrollment and master student record changes — administrators only. */
export const adminOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  const r = (auth.getRole() || '').toLowerCase();
  if (r === 'admin' || r === 'super_admin') {
    return true;
  }
  router.navigate(['/app/students']);
  return false;
};

/** Leave & HR workflows — school staff only (not parents). */
export const leaveStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  const r = (auth.getRole() || '').toLowerCase();
  if (r === 'admin' || r === 'teacher') {
    return true;
  }
  router.navigate(['/app/dashboard']);
  return false;
};

/** School tenant settings — admins (full), teachers/parents (read-only school + profile). Super-admin uses platform settings only. */
export const schoolSettingsGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  const r = (auth.getRole() || '').toLowerCase();
  if (r === 'super_admin') {
    return router.createUrlTree(['/app/platform-settings']);
  }
  if (r === 'admin' || r === 'teacher' || r === 'parent') {
    return true;
  }
  router.navigate(['/app/dashboard']);
  return false;
};

/** Platform super-admin routes (health, schools control plane). */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if ((auth.getRole() || '').toLowerCase() === 'super_admin') {
    return true;
  }
  router.navigate(['/app/dashboard']);
  return false;
};
