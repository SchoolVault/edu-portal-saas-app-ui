import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UiAccessService } from '../../core/services/ui-access.service';

type ModuleEntryKey = 'hostel';

@Component({
  selector: 'app-module-entry-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state py-5">
      <i class="bi bi-arrow-repeat"></i>
      <h3>Opening module...</h3>
    </div>
  `,
})
export class ModuleEntryRedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiAccess: UiAccessService
  ) {}

  ngOnInit(): void {
    const key = (this.route.snapshot.data['moduleEntryKey'] ?? '') as ModuleEntryKey;
    const fallback = '/app/dashboard';
    const target = this.resolveTargetRoute(key) ?? fallback;
    this.router.navigateByUrl(target, { replaceUrl: true });
  }

  /**
   * Centralized module-entry strategy:
   * - Desk/read roles land on operations module
   * - Portal-only roles land on portal module
   * Add new module keys here as we scale additional ERP areas.
   */
  private resolveTargetRoute(key: ModuleEntryKey): string | null {
    if (key === 'hostel') {
      if (this.uiAccess.hasHostelDeskReadAccess()) {
        return '/app/hostel';
      }
      if (this.uiAccess.hasHostelPortalReadAccess()) {
        return '/app/hostel-portal';
      }
      return null;
    }
    return null;
  }
}

