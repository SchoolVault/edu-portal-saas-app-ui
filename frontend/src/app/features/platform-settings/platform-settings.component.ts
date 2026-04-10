import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ProfileSummary } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ProfilePhotoPickerComponent],
  template: `
    <div class="platform-settings-root animate-in" data-testid="platform-settings-page">
      <div class="ps-hero erp-card mb-4">
        <div class="ps-hero__grid">
          <div class="ps-hero__titles">
            <div class="badge-erp badge-info mb-2">Platform</div>
            <h2 class="ps-hero__title">Platform settings</h2>
            <p class="ps-hero__lead text-muted mb-0">
              Operator profile, console appearance, and shortcuts. School branding, branches, and campus toggles stay under each tenant’s <strong>Settings</strong>—not here.
            </p>
          </div>
          <div class="ps-hero__accent" aria-hidden="true"></div>
        </div>
      </div>

      <div class="erp-tabs mb-3">
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">Profile</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'appearance'" (click)="tab = 'appearance'">Appearance</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'console'" (click)="tab = 'console'">Console</button>
      </div>

      <div class="platform-profile-shell erp-card mb-4" *ngIf="tab === 'profile'">
        <ng-container *ngIf="summary as s">
          <div class="platform-profile-hero">
            <div class="platform-profile-hero__main">
              <div class="platform-profile-avatar-wrap">
                <div class="platform-profile-avatar-ring">
                  <app-profile-photo-picker
                    [previewUrl]="profilePreviewUrl"
                    [initials]="profileInitials"
                    [frameAriaLabel]="'Upload platform operator photo'"
                    size="comfortable"
                    statusMode="minimal"
                    (photoPicked)="onOperatorPhotoPicked($event)"
                    (photoRemoved)="onOperatorPhotoRemoved()"
                  />
                </div>
                <p class="text-muted small mt-2 mb-0 ps-photo-hint">{{ operatorPhotoHint }}</p>
              </div>
              <div class="platform-profile-hero__text">
                <h3 class="platform-profile-name">{{ s.name }}</h3>
                <p class="platform-profile-title text-muted mb-2" *ngIf="s.userTitle">{{ s.userTitle }}</p>
                <div class="platform-profile-chips">
                  <span class="ps-chip" *ngIf="s.platformWorkspaceCount != null"><i class="bi bi-buildings"></i>{{ s.platformWorkspaceCount }} workspaces</span>
                  <span class="ps-chip ps-chip--ok" *ngIf="s.platformMfaEnabled"><i class="bi bi-shield-lock"></i>MFA on</span>
                  <span class="ps-chip" *ngIf="s.platformLastLoginDisplay"><i class="bi bi-clock-history"></i>{{ s.platformLastLoginDisplay }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-3 platform-profile-stats">
            <div class="col-sm-6 col-xl-3" *ngIf="s.platformOperatorSince">
              <div class="ps-stat">
                <div class="ps-stat__label">Operator since</div>
                <div class="ps-stat__value">{{ s.platformOperatorSince }}</div>
              </div>
            </div>
            <div class="col-sm-6 col-xl-3">
              <div class="ps-stat">
                <div class="ps-stat__label">Role</div>
                <div class="ps-stat__value">Super administrator</div>
              </div>
            </div>
            <div class="col-sm-6 col-xl-3" *ngIf="s.platformTimezone">
              <div class="ps-stat">
                <div class="ps-stat__label">Console timezone</div>
                <div class="ps-stat__value">{{ s.platformTimezone }}</div>
              </div>
            </div>
            <div class="col-sm-6 col-xl-3" *ngIf="s.platformPrimaryRegion">
              <div class="ps-stat">
                <div class="ps-stat__label">Region</div>
                <div class="ps-stat__value">{{ s.platformPrimaryRegion }}</div>
              </div>
            </div>
          </div>

          <div class="platform-profile-grid">
            <div class="ps-field">
              <span class="ps-field__label">Email</span>
              <span class="ps-field__value">{{ s.email }}</span>
            </div>
            <div class="ps-field" *ngIf="s.phone">
              <span class="ps-field__label">Phone</span>
              <span class="ps-field__value">{{ s.phone }}</span>
            </div>
          </div>

          <div class="ps-desk-card" *ngIf="s.schoolName || s.schoolEmail">
            <div class="ps-desk-card__title"><i class="bi bi-headset me-2"></i>Platform operations desk</div>
            <div class="row g-2 small">
              <div class="col-md-6" *ngIf="s.schoolName"><span class="text-muted">Label</span> · {{ s.schoolName }}</div>
              <div class="col-md-6" *ngIf="s.schoolCode"><span class="text-muted">Code</span> · <code>{{ s.schoolCode }}</code></div>
              <div class="col-md-6" *ngIf="s.schoolEmail"><span class="text-muted">Desk email</span> · {{ s.schoolEmail }}</div>
              <div class="col-md-6" *ngIf="s.schoolPhone"><span class="text-muted">Desk phone</span> · {{ s.schoolPhone }}</div>
              <div class="col-12" *ngIf="s.schoolAddress"><span class="text-muted">Notes</span> · {{ s.schoolAddress }}</div>
            </div>
          </div>

          <p class="text-muted small mb-0 ps-footnote">
            Password and security policies are managed through your organization’s IdP or the auth service when integrated.
          </p>
        </ng-container>
        <p *ngIf="!summary" class="text-muted mb-0">Loading profile…</p>
      </div>

      <div class="erp-card mb-4 ps-appearance" *ngIf="tab === 'appearance'">
        <h4 class="ps-section-title">Appearance</h4>
        <p class="text-muted small mb-3">
          Light/dark mode is stored in this browser. <strong>Console colours</strong> below adjust primary and accent for buttons, tabs, and highlights on this machine only—they do not change any school’s tenant branding (that lives under each campus <strong>Settings → Branding</strong>).
        </p>
        <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
          <button type="button" class="btn-outline-erp btn-sm" (click)="theme.toggleTheme()">
            <i class="bi" [ngClass]="(theme.getTheme() === 'light') ? 'bi-moon-stars' : 'bi-sun'"></i>
            {{ theme.getTheme() === 'light' ? 'Dark' : 'Light' }} mode
          </button>
        </div>

        <h5 class="ps-subtitle">Console colour presets</h5>
        <p class="text-muted small mb-3">Pick a balanced, slightly more vibrant palette. Use reset to return to ERP defaults or clear your saved console theme.</p>
        <div class="ps-preset-row">
          <button
            type="button"
            class="ps-preset"
            *ngFor="let key of consolePresetKeys"
            (click)="applyPreset(key)"
          >
            <span class="ps-preset__sw" [style.background]="presetSwatch(key)"></span>
            <span class="ps-preset__label">{{ themeStatic.CONSOLE_PRESETS[key].label }}</span>
          </button>
        </div>
        <div class="mt-3 pt-3 ps-divider">
          <button type="button" class="btn-outline-erp btn-sm me-2" (click)="resetConsoleOnly()">Reset console colours</button>
          <button type="button" class="btn-outline-erp btn-xs" (click)="resetAllStoredColours()">Also clear school brand override (this browser)</button>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'console'">
        <h4 class="ps-section-title">Platform console</h4>
        <p class="text-muted small mb-3">Shortcuts to operator tools (same entries as the sidebar).</p>
        <div class="d-flex flex-column gap-2" style="max-width: 400px;">
          <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm text-start ps-console-link"><i class="bi bi-speedometer2 me-2 text-primary-erp"></i>Platform overview</a>
          <a routerLink="/app/platform-schools" class="btn-outline-erp btn-sm text-start ps-console-link"><i class="bi bi-bank2 me-2 text-primary-erp"></i>School directory</a>
          <a routerLink="/app/chat" class="btn-outline-erp btn-sm text-start ps-console-link"><i class="bi bi-chat-dots me-2 text-primary-erp"></i>Messages (school admins)</a>
          <a routerLink="/app/platform-subscriptions" class="btn-outline-erp btn-sm text-start ps-console-link"><i class="bi bi-receipt me-2 text-primary-erp"></i>Subscription plans</a>
          <a routerLink="/app/platform-broadcasts" class="btn-outline-erp btn-sm text-start ps-console-link"><i class="bi bi-megaphone me-2 text-primary-erp"></i>Admin broadcasts</a>
          <a routerLink="/app/platform-health" class="btn-outline-erp btn-sm text-start ps-console-link"><i class="bi bi-heart-pulse me-2 text-primary-erp"></i>System health</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ps-hero { padding: 0; overflow: hidden; border: 1px solid var(--clr-border-light); }
    .ps-hero__grid {
      display: grid;
      grid-template-columns: 1fr minmax(120px, 28%);
      gap: 0;
      align-items: stretch;
      min-height: 120px;
    }
    .ps-hero__titles { padding: 22px 24px; }
    .ps-hero__title { font-size: 26px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em; }
    .ps-hero__lead { font-size: 13px; max-width: 42rem; line-height: 1.55; }
    .ps-hero__accent {
      background: linear-gradient(145deg, color-mix(in srgb, var(--clr-primary) 55%, #0f172a), color-mix(in srgb, var(--clr-accent) 70%, #1e293b));
      opacity: 0.92;
    }
    .platform-profile-shell {
      padding: 0;
      overflow: hidden;
      border: 1px solid var(--clr-border-light);
      box-shadow: var(--shadow-md);
    }
    .platform-profile-hero {
      padding: 24px 24px 8px;
      background: linear-gradient(180deg, var(--clr-surface-alt) 0%, var(--clr-surface) 100%);
      border-bottom: 1px solid var(--clr-border-light);
    }
    .platform-profile-hero__main {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      align-items: flex-start;
    }
    .platform-profile-avatar-wrap { max-width: 280px; }
    .platform-profile-avatar-ring {
      padding: 10px;
      border-radius: 20px;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border-light);
      box-shadow: var(--shadow-sm);
    }
    .ps-photo-hint { max-width: 260px; line-height: 1.45; }
    .platform-profile-name { font-size: 22px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.02em; }
    .platform-profile-title { font-size: 14px; }
    .platform-profile-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .ps-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700;
      padding: 6px 12px; border-radius: 999px;
      background: var(--clr-surface-muted);
      border: 1px solid var(--clr-border-light);
      color: var(--clr-text-secondary);
    }
    .ps-chip--ok { border-color: color-mix(in srgb, var(--clr-success) 35%, var(--clr-border-light)); color: var(--clr-success); }
    .platform-profile-stats { padding: 16px 24px 8px; margin: 0; }
    .ps-stat {
      padding: 12px 14px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--clr-border-light);
      background: var(--clr-surface-alt);
      height: 100%;
    }
    .ps-stat__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--clr-text-muted); }
    .ps-stat__value { font-size: 14px; font-weight: 700; margin-top: 4px; color: var(--clr-text); }
    .platform-profile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px 20px;
      padding: 16px 24px;
    }
    .ps-field {
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background: var(--clr-surface);
      border: 1px solid var(--clr-border-light);
    }
    .ps-field--wide { grid-column: 1 / -1; }
    .ps-field__label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--clr-text-muted); margin-bottom: 4px; }
    .ps-field__value { font-size: 14px; font-weight: 600; }
    .ps-desk-card {
      margin: 8px 24px 20px;
      padding: 16px 18px;
      border-radius: var(--radius-lg);
      border: 1px solid color-mix(in srgb, var(--clr-accent) 22%, var(--clr-border-light));
      background: linear-gradient(135deg, color-mix(in srgb, var(--clr-accent) 6%, var(--clr-surface)), var(--clr-surface-alt));
    }
    .ps-desk-card__title { font-size: 13px; font-weight: 800; margin-bottom: 10px; color: var(--clr-text); }
    .ps-footnote { padding: 0 24px 20px; }
    .ps-section-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
    .ps-subtitle { font-size: 13px; font-weight: 800; margin-bottom: 8px; }
    .ps-appearance { padding: 22px 24px; }
    .ps-divider { border-top: 1px solid var(--clr-border-light); }
    .ps-preset-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .ps-preset {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--clr-border-light);
      background: var(--clr-surface-alt);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      font-size: 13px; font-weight: 600; color: var(--clr-text-secondary);
    }
    .ps-preset:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
      border-color: color-mix(in srgb, var(--clr-accent) 40%, var(--clr-border-light));
    }
    .ps-preset__sw { width: 28px; height: 28px; border-radius: 8px; border: 2px solid var(--clr-surface); box-shadow: 0 0 0 1px var(--clr-border-light); }
    .ps-console-link { transition: background 0.15s ease, border-color 0.15s ease; }
    .ps-console-link:hover { background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface)); }
  `]
})
export class PlatformSettingsComponent implements OnInit {
  tab: 'profile' | 'appearance' | 'console' = 'profile';
  summary: ProfileSummary | null = null;
  profilePreviewUrl: string | null = null;
  profileInitials = '';
  readonly themeStatic = ThemeService;
  readonly consolePresetKeys: string[] = Object.keys(ThemeService.CONSOLE_PRESETS);

  constructor(
    private auth: AuthService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  get operatorPhotoHint(): string {
    return runtimeConfig.useMocks
      ? 'Saved on this device. Stored in this browser only until the platform profile API accepts an avatar URL.'
      : 'Uploaded photos sync with your operator profile when the media service is connected.';
  }

  ngOnInit(): void {
    this.summary = this.auth.getProfileSummarySnapshot();
    this.refreshOperatorPhoto();
    this.auth.fetchProfileSummary().subscribe({
      next: s => {
        this.summary = s;
        this.cdr.markForCheck();
      },
      error: () => { /* keep snapshot */ }
    });
  }

  presetSwatch(key: string): string {
    const p = ThemeService.CONSOLE_PRESETS[key];
    if (!p) return '#ccc';
    return `linear-gradient(135deg, ${p.primary}, ${p.accent})`;
  }

  applyPreset(key: string): void {
    this.theme.applyConsolePreset(key);
  }

  resetConsoleOnly(): void {
    this.theme.resetConsolePaletteToDefaults();
  }

  resetAllStoredColours(): void {
    this.theme.resetConsolePaletteToDefaults();
    this.theme.resetBrandingToDefault();
  }

  private refreshOperatorPhoto(): void {
    this.profilePreviewUrl = this.auth.getStoredAvatarDataUrl();
    this.profileInitials = this.auth.getUserInitials();
  }

  onOperatorPhotoPicked(ev: ProfilePhotoPickEvent): void {
    this.auth.setMyProfileAvatarDataUrl(ev.dataUrl);
    this.refreshOperatorPhoto();
    this.cdr.markForCheck();
  }

  onOperatorPhotoRemoved(): void {
    this.auth.clearMyProfileAvatarDataUrl();
    this.refreshOperatorPhoto();
    this.cdr.markForCheck();
  }
}
