import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ProfileSummary } from '../../core/models/models';

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="platform-settings-root animate-in" data-testid="platform-settings-page">
      <div class="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
        <div>
          <div class="badge-erp badge-info mb-2">Platform</div>
          <h2 style="font-size: 24px; font-weight: 800;">Platform settings</h2>
          <p class="text-muted mb-0" style="font-size: 13px; max-width: 40rem;">
            Your operator profile and console preferences. School branding, branches, and campus feature toggles live under each tenant’s own admin settings—not here.
          </p>
        </div>
      </div>

      <div class="erp-tabs mb-3">
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">Profile</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'appearance'" (click)="tab = 'appearance'">Appearance</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'console'" (click)="tab = 'console'">Console</button>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'profile'">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">Operator identity</h4>
        <div *ngIf="summary as s" class="row g-3">
          <div class="col-md-6">
            <div class="text-muted small text-uppercase" style="letter-spacing: 0.05em;">Name</div>
            <div class="fw-semibold">{{ s.name }}</div>
          </div>
          <div class="col-md-6">
            <div class="text-muted small text-uppercase" style="letter-spacing: 0.05em;">Email</div>
            <div>{{ s.email }}</div>
          </div>
          <div class="col-md-6" *ngIf="s.phone">
            <div class="text-muted small text-uppercase" style="letter-spacing: 0.05em;">Phone</div>
            <div>{{ s.phone }}</div>
          </div>
          <div class="col-md-6">
            <div class="text-muted small text-uppercase" style="letter-spacing: 0.05em;">Role</div>
            <div>Platform super administrator</div>
          </div>
          <div class="col-md-6" *ngIf="s.platformWorkspaceCount != null">
            <div class="text-muted small text-uppercase" style="letter-spacing: 0.05em;">Active workspaces</div>
            <div>{{ s.platformWorkspaceCount }} school tenants (non-deleted)</div>
          </div>
          <div class="col-12">
            <p class="text-muted small mb-0">
              Password and security policies are managed through your organization’s IdP or the auth service when integrated.
            </p>
          </div>
        </div>
        <p *ngIf="!summary" class="text-muted mb-0">Loading profile…</p>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'appearance'">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">Appearance</h4>
        <p class="text-muted small mb-3">Theme preference is stored in this browser only and does not change any school’s branding.</p>
        <button type="button" class="btn-outline-erp btn-sm" (click)="theme.toggleTheme()">
          <i class="bi" [ngClass]="(theme.getTheme() === 'light') ? 'bi-moon-stars' : 'bi-sun'"></i>
          Switch to {{ theme.getTheme() === 'light' ? 'dark' : 'light' }} mode
        </button>
        <div class="mt-3 pt-3" style="border-top: 1px solid var(--clr-border-light);">
          <p class="text-muted small mb-2">Console accent colors can follow your personal preference; campus portals keep their own primary/accent from each tenant’s settings.</p>
          <button type="button" class="btn-outline-erp btn-xs" (click)="resetConsoleColors()">Reset console colors to ERP default</button>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'console'">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">Platform console</h4>
        <p class="text-muted small mb-3">Shortcuts to operator tools (same entries as the sidebar).</p>
        <div class="d-flex flex-column gap-2" style="max-width: 360px;">
          <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm text-start">Platform overview</a>
          <a routerLink="/app/platform-schools" class="btn-outline-erp btn-sm text-start">School directory</a>
          <a routerLink="/app/platform-subscriptions" class="btn-outline-erp btn-sm text-start">Subscription plans</a>
          <a routerLink="/app/platform-broadcasts" class="btn-outline-erp btn-sm text-start">Admin broadcasts</a>
          <a routerLink="/app/platform-health" class="btn-outline-erp btn-sm text-start">System health</a>
        </div>
      </div>
    </div>
  `
})
export class PlatformSettingsComponent implements OnInit {
  tab: 'profile' | 'appearance' | 'console' = 'profile';
  summary: ProfileSummary | null = null;

  constructor(
    private auth: AuthService,
    public theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.summary = this.auth.getProfileSummarySnapshot();
    this.auth.fetchProfileSummary().subscribe({
      next: s => { this.summary = s; },
      error: () => { /* keep snapshot */ }
    });
  }

  resetConsoleColors(): void {
    this.theme.resetBrandingToDefault();
  }
}
