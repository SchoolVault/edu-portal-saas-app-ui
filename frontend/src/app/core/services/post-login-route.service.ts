import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UiAccessService } from './ui-access.service';

/**
 * Duty-aware first screen after authentication (ERP-style: cashier → desk, base staff → comms home).
 */
@Injectable({ providedIn: 'root' })
export class PostLoginRouteService {
  constructor(
    private auth: AuthService,
    private ui: UiAccessService
  ) {}

  /** Default route inside {@code /app} for the current session (caller runs after login / session restore). */
  defaultAppPath(): string {
    const r = this.auth.getNormalizedRole();
    if (!r) {
      return '/app/dashboard';
    }
    if (r === 'super_admin') {
      return '/app/super-admin';
    }
    if (r === 'parent' || r === 'admin' || r === 'teacher' || r === 'student') {
      return '/app/dashboard';
    }
    if (r === 'library_staff') {
      return '/app/dashboard';
    }
    if (r === 'school_staff' && !this.ui.hasDeskModulesForStaffHome()) {
      return '/app/inbox';
    }
    return '/app/dashboard';
  }
}
