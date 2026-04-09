import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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

/** School tenant settings — campus admins & staff only (not platform operators). */
export const schoolSettingsGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if ((auth.getRole() || '').toLowerCase() === 'super_admin') {
    return router.createUrlTree(['/app/platform-settings']);
  }
  return true;
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
