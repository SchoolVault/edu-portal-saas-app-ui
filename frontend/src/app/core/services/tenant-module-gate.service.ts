import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DEFAULT_PLATFORM_TENANT_FEATURES, PLATFORM_TENANT_FEATURE_KEYS } from '../constants/platform-tenant-features';
import { SettingsService } from './settings.service';
import { AuthService } from './auth.service';

/** Keys aligned with backend {@code tenant_configs.features_json} and super-admin rollout. */
export const PLATFORM_MODULE_KEYS = PLATFORM_TENANT_FEATURE_KEYS;
export type PlatformModuleKey = (typeof PLATFORM_MODULE_KEYS)[number];

@Injectable({ providedIn: 'root' })
export class TenantModuleGateService {
  private readonly flags$ = new BehaviorSubject<Record<string, boolean>>({});

  constructor(
    private settings: SettingsService,
    private auth: AuthService
  ) {}

  get snapshot(): Record<string, boolean> {
    return this.flags$.value;
  }

  /** Whether a gated nav item should appear. Unknown keys default to ON for backward compatibility. */
  isModuleEnabled(featureKey: string | undefined): boolean {
    const role = this.auth.getNormalizedRole();
    // Platform operators should always see platform tooling regardless of tenant feature toggles.
    if (role === 'super_admin') {
      return true;
    }
    if (!featureKey) {
      return true;
    }
    if (!PLATFORM_MODULE_KEYS.includes(featureKey as PlatformModuleKey)) {
      return true;
    }
    const v = this.flags$.value[featureKey];
    if (v === undefined) {
      return DEFAULT_PLATFORM_TENANT_FEATURES[featureKey as PlatformModuleKey] !== false;
    }
    return v !== false;
  }

  /**
   * Load tenant flags for sidebar (school-scoped roles). Super-admin skips remote read.
   * @returns observable that completes after flags are applied (errors fall back to empty map).
   */
  refresh(): Observable<Record<string, boolean>> {
    const role = this.auth.getNormalizedRole();
    if (role === 'super_admin' || !role) {
      this.flags$.next({});
      return of({});
    }
    return this.settings.getFeatures().pipe(
      tap({
        next: f => {
          const merged: Record<string, boolean> = { ...DEFAULT_PLATFORM_TENANT_FEATURES, ...(f || {}) };
          this.flags$.next(merged);
        },
        error: () => this.flags$.next({}),
      })
    );
  }
}
