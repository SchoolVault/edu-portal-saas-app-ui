import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { UiAccessService } from '../services/ui-access.service';

/**
 * Route {@link import('@angular/router').Route} data for {@link featureModuleGuard}.
 */
export interface FeatureModuleRouteData {
  /** Platform-tenant feature keys that must not be disabled (403-style redirect if false). */
  requireFeatures?: string[];
  /** User must have one of these normalized roles (lowercase). Omit to skip role gate. */
  requireAnyRole?: string[];
  /** User must have one of these {@code AppPermission} codes (union with {@link requireAnyRole} when both set). */
  requireAnyPermission?: string[];
}

/**
 * Blocks deep links to disabled optional modules and enforces role allow-lists per route.
 * Runs after layout {@link authGuard}; still calls {@link AuthService.ensureValidSession} so stale sessions
 * cannot probe URLs. Super-admin bypasses tenant feature checks (platform operator).
 */
export const featureModuleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const settings = inject(SettingsService);
  const uiAccess = inject(UiAccessService);
  const data = route.data as FeatureModuleRouteData;

  return auth.ensureValidSession().pipe(
    take(1),
    switchMap(ok => {
      if (!ok) {
        return of(router.createUrlTree(['/login']));
      }
      const role = auth.getNormalizedRole();
      if (role === 'super_admin') {
        return of(true);
      }

      const accessOk = uiAccess.routeAccessUnion(data?.requireAnyRole, data?.requireAnyPermission);
      if (!accessOk) {
        return of(router.createUrlTree(['/app/dashboard']));
      }

      const requireFeatures = (data?.requireFeatures ?? []).filter(Boolean);

      if (!requireFeatures.length) {
        return of(true);
      }

      return settings.getFeatures().pipe(
        take(1),
        map(flags => {
          for (const key of requireFeatures) {
            if (flags[key] === false) {
              return router.createUrlTree(['/app/dashboard']);
            }
          }
          return true;
        })
      );
    })
  );
};
