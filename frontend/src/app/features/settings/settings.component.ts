import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { SchoolBranch, Student } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePhotoPickerComponent],
  template: `
    <div data-testid="settings-page">
      <div class="mb-4 animate-in d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Settings</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            <ng-container *ngIf="isTenantAdmin">School configuration and preferences.</ng-container>
            <ng-container *ngIf="!isTenantAdmin">Your profile and read-only school information. Tenant changes are limited to school administrators.</ng-container>
          </p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm align-self-center" (click)="reloadSettings()" [disabled]="settingsRefreshing">
          <i class="bi bi-arrow-clockwise"></i> {{ settingsRefreshing ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'general'" (click)="tab = 'general'">{{ isTenantAdmin ? 'General' : 'School' }}</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'branding'" (click)="tab = 'branding'">Branding</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'roles'" (click)="tab = 'roles'">Roles & Permissions</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'features'" (click)="tab = 'features'">Feature Toggles</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">Profile &amp; photo</button>
      </div>

      <div *ngIf="tab === 'profile'" class="erp-card animate-in settings-profile-root">
        <header class="settings-profile-root__header">
          <div>
            <h3 class="settings-profile-root__title">Profile &amp; photo</h3>
            <p class="settings-profile-root__lead">
              Who you are in SchoolVault, and the picture shown in the header.
            </p>
          </div>
        </header>

        <div class="row g-4 align-items-start">
          <div class="col-lg-5">
            <section class="settings-profile-panel" aria-labelledby="settings-profile-account-h">
              <div class="settings-profile-panel__head" id="settings-profile-account-h">
                <span class="settings-profile-panel__icon"><i class="bi bi-person-vcard"></i></span>
                <span class="settings-profile-panel__head-text">Account</span>
              </div>
              <div class="settings-profile-panel__body">
                <div class="settings-profile-identity" *ngIf="profileUser as u">
                  <div *ngIf="!profilePreviewUrl" class="settings-profile-identity__avatar" aria-hidden="true">{{ profileInitials }}</div>
                  <img
                    *ngIf="profilePreviewUrl"
                    [src]="profilePreviewUrl"
                    alt=""
                    class="settings-profile-identity__avatar settings-profile-identity__avatar--photo"
                  />
                  <div class="settings-profile-identity__text">
                    <div class="settings-profile-identity__name">{{ u.name }}</div>
                    <div class="settings-profile-identity__email">{{ u.email }}</div>
                  </div>
                </div>
                <dl class="settings-profile-meta">
                  <div class="settings-profile-meta__row">
                    <dt>Role</dt>
                    <dd><span class="settings-profile-role">{{ roleDisplayLabel }}</span></dd>
                  </div>
                  <div class="settings-profile-meta__row">
                    <dt>School</dt>
                    <dd>{{ schoolName || '—' }}</dd>
                  </div>
                  <div class="settings-profile-meta__row" *ngIf="schoolCode">
                    <dt>Code</dt>
                    <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                  </div>
                </dl>
                <p class="settings-profile-footnote" *ngIf="isParentOnlyChildren && myChildren.length">
                  <i class="bi bi-people me-1"></i>{{ myChildren.length }} linked {{ myChildren.length === 1 ? 'child' : 'children' }}
                </p>
              </div>
            </section>
          </div>

          <div class="col-lg-7">
            <ng-container *ngIf="canEditOwnPhoto">
              <section class="settings-profile-panel settings-profile-panel--emphasis" aria-labelledby="settings-profile-photo-h">
                <div class="settings-profile-panel__head" id="settings-profile-photo-h">
                  <span class="settings-profile-panel__icon"><i class="bi bi-camera"></i></span>
                  <span class="settings-profile-panel__head-text">Your photo</span>
                </div>
                <div class="settings-profile-panel__body">
                  <p class="settings-profile-hint">{{ photoHintLine }}</p>
                  <app-profile-photo-picker
                    [previewUrl]="profilePreviewUrl"
                    [initials]="profileInitials"
                    [frameAriaLabel]="'Upload your profile photo'"
                    size="comfortable"
                    statusMode="minimal"
                    (photoPicked)="onOwnPhotoPicked($event)"
                    (photoRemoved)="onOwnPhotoRemoved()"
                  />
                </div>
              </section>
            </ng-container>

            <ng-container *ngIf="isParentOnlyChildren">
              <section
                class="settings-profile-panel"
                [class.mt-4]="canEditOwnPhoto"
                aria-labelledby="settings-profile-child-h"
              >
                <div class="settings-profile-panel__head" id="settings-profile-child-h">
                  <span class="settings-profile-panel__icon"><i class="bi bi-person-hearts"></i></span>
                  <span class="settings-profile-panel__head-text">Child portrait</span>
                </div>
                <div class="settings-profile-panel__body">
                  <p class="settings-profile-hint">Choose a linked child, then add or replace their picture (parent view only).</p>
                  <label class="erp-label d-block mb-2">Child</label>
                  <select class="erp-select mb-3" [(ngModel)]="childPhotoTargetId" (ngModelChange)="syncChildPhotoPreview()">
                    <option value="">Select child</option>
                    <option *ngFor="let s of myChildren" [value]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
                  </select>
                  <app-profile-photo-picker
                    *ngIf="childPhotoTargetId"
                    [previewUrl]="childPhotoPreview"
                    [initials]="childPhotoInitials"
                    [frameAriaLabel]="'Upload child photo'"
                    size="comfortable"
                    statusMode="minimal"
                    (photoPicked)="onChildPhotoPicked($event)"
                    (photoRemoved)="onChildPhotoRemoved()"
                  />
                  <p *ngIf="!childPhotoTargetId" class="settings-profile-placeholder mb-0">Select a child to continue.</p>
                  <p class="settings-profile-footnote settings-profile-footnote--below">Staff set official directory photos under Students or Teachers.</p>
                </div>
              </section>
            </ng-container>

            <ng-container *ngIf="!canEditOwnPhoto && !isParentOnlyChildren">
              <section class="settings-profile-panel settings-profile-panel--note" aria-labelledby="settings-profile-dir-h">
                <div class="settings-profile-panel__head" id="settings-profile-dir-h">
                  <span class="settings-profile-panel__icon"><i class="bi bi-info-circle"></i></span>
                  <span class="settings-profile-panel__head-text">Directory photo</span>
                </div>
                <div class="settings-profile-panel__body">
                  <p class="settings-profile-hint mb-2">Your picture is managed by school staff, not on this screen.</p>
                  <ul class="settings-profile-bullets">
                    <li>Admins and class teachers can set photos where your role allows.</li>
                    <li>Contact the office if you need an update.</li>
                  </ul>
                </div>
              </section>
            </ng-container>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'general'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">School Information</h4>
        <ng-container *ngIf="isTenantAdmin">
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">School Name</label><input type="text" class="erp-input" [(ngModel)]="schoolName" data-testid="school-name-input"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">School Code</label><input type="text" class="erp-input" [(ngModel)]="schoolCode" disabled title="Used to link branches in multi-campus setups"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Email</label><input type="email" class="erp-input" [(ngModel)]="schoolEmail"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Phone</label><input type="text" class="erp-input" [(ngModel)]="schoolPhone"></div></div>
            <div class="col-12"><div class="erp-form-group"><label class="erp-label">Address</label><textarea class="erp-input erp-textarea" [(ngModel)]="schoolAddress" style="min-height: 80px;"></textarea></div></div>
          </div>
          <div class="d-flex justify-content-end align-items-center flex-wrap gap-2 mt-3">
            <span *ngIf="generalSaveMsg" class="text-success small">{{ generalSaveMsg }}</span>
            <span *ngIf="generalSaveError" class="text-danger small">{{ generalSaveError }}</span>
            <button class="btn-primary-erp" data-testid="save-settings-btn" type="button" (click)="saveGeneral()" [disabled]="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
          </div>
        </ng-container>
        <ng-container *ngIf="!isTenantAdmin">
          <p class="text-muted small mb-3">Contact your school office if any detail needs updating.</p>
          <dl class="settings-readonly-grid row g-3 mb-0">
            <div class="col-md-6"><dt class="erp-label">School Name</dt><dd class="settings-ro-value">{{ schoolName }}</dd></div>
            <div class="col-md-6"><dt class="erp-label">School Code</dt><dd class="settings-ro-value"><code class="settings-profile-code">{{ schoolCode }}</code></dd></div>
            <div class="col-md-6"><dt class="erp-label">Email</dt><dd class="settings-ro-value">{{ schoolEmail || '—' }}</dd></div>
            <div class="col-md-6"><dt class="erp-label">Phone</dt><dd class="settings-ro-value">{{ schoolPhone || '—' }}</dd></div>
            <div class="col-12"><dt class="erp-label">Address</dt><dd class="settings-ro-value" style="white-space: pre-wrap;">{{ schoolAddress || '—' }}</dd></div>
          </dl>
        </ng-container>

        <div *ngIf="isTenantAdmin" class="mt-4 pt-4" style="border-top: 1px solid var(--clr-border-light);">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">Branches &amp; campuses</h4>
              <p class="text-muted small mb-0">Schools that share your school code appear here (read-only directory). Each branch logs in as its own tenant.</p>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadBranches()" [disabled]="branchesLoading">
              {{ branchesLoading ? 'Loading…' : 'Fetch branches' }}
            </button>
          </div>
          <div *ngIf="branchesError" class="alert alert-danger py-2 small">{{ branchesError }}</div>
          <div *ngIf="branches.length" class="row g-3">
            <div class="col-md-6 col-lg-4" *ngFor="let br of branches">
              <div class="p-3 rounded-3 h-100" style="border: 1px solid var(--clr-border); background: var(--clr-surface-muted);">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <strong style="font-size: 14px;">{{ br.schoolName }}</strong>
                  <span *ngIf="br.currentTenant" class="badge-erp badge-success">You are here</span>
                </div>
                <div class="small text-muted mb-1"><i class="bi bi-hash me-1"></i>{{ br.schoolCode }}</div>
                <div class="small mb-1" *ngIf="br.address"><i class="bi bi-geo-alt me-1 text-muted"></i>{{ br.address }}</div>
                <div class="small mb-1" *ngIf="br.phone"><i class="bi bi-telephone me-1 text-muted"></i>{{ br.phone }}</div>
                <div class="small" *ngIf="br.email"><i class="bi bi-envelope me-1 text-muted"></i>{{ br.email }}</div>
              </div>
            </div>
          </div>
          <p *ngIf="!branches.length && !branchesLoading && branchesFetched" class="text-muted small mb-0">No other branches returned for this code.</p>
        </div>
      </div>

      <div *ngIf="tab === 'branding'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">Theme & Branding</h4>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">Primary Color</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="primaryColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="primaryColor" style="flex: 1;">
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">Accent Color</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="accentColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="accentColor" style="flex: 1;">
              </div>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3 gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp" (click)="resetBranding()">Reset to default colours</button>
          <button type="button" class="btn-primary-erp" (click)="applyBranding()">Apply branding (UI)</button>
        </div>
        <p class="text-muted small mt-2 mb-0">Persists primary/accent to this browser and updates CSS variables. With API, also saves to tenant settings (school admin only).</p>
      </div>

      <div *ngIf="tab === 'roles'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">Roles & Permissions</h4>
        <table class="erp-table">
          <thead><tr><th>Role</th><th>Description</th><th>Users</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><strong>Admin</strong></td><td>Full system access</td><td>1</td><td><span class="badge-erp badge-success">Active</span></td></tr>
            <tr><td><strong>Teacher</strong></td><td>Academics, attendance, grades</td><td>8</td><td><span class="badge-erp badge-success">Active</span></td></tr>
            <tr><td><strong>Parent</strong></td><td>View child info, fees, communication</td><td>12</td><td><span class="badge-erp badge-success">Active</span></td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="tab === 'features'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">Feature Toggles</h4>
        <p style="font-size: 13px; color: var(--clr-text-muted); margin-bottom: 20px;">Enable or disable modules for your school</p>
        <div *ngFor="let feat of features" class="d-flex justify-content-between align-items-center py-3" style="border-bottom: 1px solid var(--clr-border-light);">
          <div>
            <div style="font-weight: 600;">{{ feat.name }}</div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">{{ feat.description }}</div>
          </div>
          <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
            <input type="checkbox" [(ngModel)]="feat.enabled" style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; inset: 0; background: var(--clr-border); border-radius: 13px; transition: 0.3s;" [style.background]="feat.enabled ? 'var(--clr-success)' : 'var(--clr-border)'">
              <span style="position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: 0.3s;" [style.transform]="feat.enabled ? 'translateX(22px)' : 'translateX(0)'"></span>
            </span>
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-profile-root__header {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
      }
      .settings-profile-root__title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0 0 0.35rem;
        color: var(--clr-text-primary, #0f172a);
      }
      .settings-profile-root__lead {
        margin: 0;
        font-size: 13px;
        color: var(--clr-text-muted, #64748b);
        max-width: 42rem;
        line-height: 1.5;
      }
      .settings-profile-panel {
        border: 1px solid var(--clr-border, #e2e8f0);
        border-radius: var(--radius-lg, 12px);
        background: var(--clr-surface, #fff);
        overflow: hidden;
      }
      .settings-profile-panel--emphasis {
        border-color: color-mix(in srgb, var(--clr-primary, #1b3a30) 22%, var(--clr-border, #e2e8f0));
        box-shadow: 0 1px 0 color-mix(in srgb, var(--clr-primary, #1b3a30) 8%, transparent);
      }
      .settings-profile-panel--note {
        background: var(--clr-surface-muted, #f8fafc);
        border-style: dashed;
      }
      .settings-profile-panel__head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: var(--clr-surface-muted, #f8fafc);
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
        font-size: 13px;
        font-weight: 700;
        color: var(--clr-text-secondary, #475569);
      }
      .settings-profile-panel__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 10%, transparent);
        color: var(--clr-primary, #1b3a30);
        font-size: 16px;
      }
      .settings-profile-panel--note .settings-profile-panel__icon {
        background: color-mix(in srgb, var(--clr-accent, #c05c3d) 12%, transparent);
        color: var(--clr-accent, #c05c3d);
      }
      .settings-profile-panel__body {
        padding: 16px;
      }
      .settings-profile-identity {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 1rem;
      }
      .settings-profile-identity__avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid var(--clr-border, #e2e8f0);
        background: var(--clr-surface-muted, #f1f5f9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        color: var(--clr-text-secondary, #64748b);
        flex-shrink: 0;
        overflow: hidden;
      }
      .settings-profile-identity__avatar--photo {
        display: block;
        object-fit: cover;
        padding: 0;
      }
      .settings-profile-identity__name {
        font-weight: 700;
        font-size: 15px;
        color: var(--clr-text-primary, #0f172a);
        line-height: 1.25;
      }
      .settings-profile-identity__email {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
        margin-top: 2px;
        word-break: break-all;
      }
      .settings-profile-meta {
        margin: 0;
      }
      .settings-profile-meta__row {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        border-top: 1px solid var(--clr-border-light, #eef2f4);
        font-size: 13px;
      }
      .settings-profile-meta__row:first-of-type {
        border-top: none;
        padding-top: 0;
      }
      .settings-profile-meta__row dt {
        flex: 0 0 4.5rem;
        margin: 0;
        color: var(--clr-text-muted, #64748b);
        font-weight: 600;
      }
      .settings-profile-meta__row dd {
        margin: 0;
        color: var(--clr-text-primary, #334155);
        flex: 1;
        min-width: 0;
      }
      .settings-profile-role {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 12%, transparent);
        color: var(--clr-primary, #1b3a30);
      }
      .settings-profile-code {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--clr-surface-muted, #f1f5f9);
        color: var(--clr-text-secondary, #475569);
      }
      .settings-profile-hint {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
        margin: 0 0 14px;
        line-height: 1.5;
      }
      .settings-profile-placeholder {
        font-size: 13px;
        color: var(--clr-text-muted, #94a3b8);
        font-style: italic;
      }
      .settings-profile-footnote {
        font-size: 11px;
        color: var(--clr-text-muted, #94a3b8);
        margin: 12px 0 0;
        line-height: 1.45;
      }
      .settings-profile-footnote--below {
        margin-top: 1rem;
        margin-bottom: 0;
      }
      .settings-profile-bullets {
        margin: 0;
        padding-left: 1.15rem;
        font-size: 12px;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
      }
      .settings-profile-bullets li + li {
        margin-top: 0.35rem;
      }
      .settings-readonly-grid dt {
        margin-bottom: 4px;
      }
      .settings-readonly-grid dd {
        margin: 0 0 12px;
      }
      .settings-ro-value {
        font-size: 14px;
        color: var(--clr-text-primary, #0f172a);
        font-weight: 500;
        line-height: 1.45;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  tab = 'general';
  schoolName = 'SchoolVault Academy';
  schoolCode = 'SCH001';
  schoolEmail = 'info@schoolvault.edu';
  schoolPhone = '+1-555-0100';
  schoolAddress = '123 Education Lane, Knowledge City, KS 12345';
  primaryColor = '#1B3A30';
  accentColor = '#C05C3D';
  saving = false;
  generalSaveMsg = '';
  generalSaveError = '';
  tenantId = '';
  branches: SchoolBranch[] = [];
  branchesLoading = false;
  branchesError = '';
  branchesFetched = false;
  profilePreviewUrl: string | null = null;
  profileInitials = '';
  myChildren: Student[] = [];
  childPhotoTargetId = '';
  childPhotoPreview: string | null = null;
  childPhotoInitials = '';
  settingsRefreshing = false;

  features = [
    { name: 'Transport Module', description: 'Manage school transport routes and vehicles', enabled: true },
    { name: 'Library Module', description: 'Book catalog and circulation management', enabled: true },
    { name: 'Hostel Module', description: 'Hostel room allocation and management', enabled: true },
    { name: 'Payroll Module', description: 'Teacher salary and payslip management', enabled: true },
    { name: 'Document Management', description: 'Upload and manage school documents', enabled: true },
    { name: 'Audit Trail', description: 'Track all system actions and changes', enabled: true },
    { name: 'SMS Notifications', description: 'Send SMS alerts to parents', enabled: false },
    { name: 'Online Payments', description: 'Accept fee payments online', enabled: false },
  ];

  constructor(
    private settingsService: SettingsService,
    private themeService: ThemeService,
    private auth: AuthService,
    private studentService: StudentService,
    private cdr: ChangeDetectorRef
  ) {}

  /** School tenant administrator — only this role may change tenant config, branding, roles, and feature toggles. */
  get isTenantAdmin(): boolean {
    return (this.auth.getRole() || '').toLowerCase() === 'admin';
  }

  get canEditOwnPhoto(): boolean {
    const r = this.auth.getRole();
    return r === 'admin' || r === 'teacher' || r === 'super_admin' || r === 'student';
  }

  get isParentOnlyChildren(): boolean {
    return this.auth.getRole() === 'parent';
  }

  get profileUser() {
    return this.auth.getCurrentUser();
  }

  get roleDisplayLabel(): string {
    const r = (this.auth.getRole() || '').toLowerCase();
    const map: Record<string, string> = {
      admin: 'Administrator',
      super_admin: 'Super administrator',
      teacher: 'Teacher',
      parent: 'Parent',
      student: 'Student',
      library_staff: 'Library staff',
    };
    return map[r] || (r ? r.replace(/_/g, ' ') : 'User');
  }

  get photoHintLine(): string {
    return runtimeConfig.useMocks
      ? 'Shown in the header and menus. Saved on this browser only until your school connects cloud photos.'
      : 'Shown in the header and menus. Stored with your account when you save; full media sync may follow.';
  }

  ngOnInit(): void {
    if (!this.isTenantAdmin) {
      this.tab = 'profile';
    }
    this.refreshProfilePreview();
    this.reloadSettings();
  }

  reloadSettings(): void {
    this.settingsRefreshing = true;
    if (this.isParentOnlyChildren) {
      this.studentService.getStudents().subscribe(list => {
        const uid = this.auth.getCurrentUser()?.id ?? '';
        this.myChildren = (list || []).filter(s => s.parentId === uid);
        this.syncChildPhotoPreview();
        this.cdr.markForCheck();
      });
    }
    this.settingsService.get().subscribe({
      next: cfg => {
        this.schoolName = cfg.schoolName ?? this.schoolName;
        this.schoolCode = cfg.schoolCode ?? this.schoolCode;
        this.schoolEmail = cfg.email ?? this.schoolEmail;
        this.schoolPhone = cfg.phone ?? this.schoolPhone;
        this.schoolAddress = cfg.address ?? this.schoolAddress;
        this.primaryColor = cfg.primaryColor || this.primaryColor;
        this.accentColor = cfg.secondaryColor || this.accentColor;
        this.tenantId = cfg.tenantId ?? '';
        const td = this.auth.readTenantDisplayOverrides();
        if (td.schoolName) this.schoolName = td.schoolName;
        if (td.schoolEmail) this.schoolEmail = td.schoolEmail;
        if (td.schoolPhone) this.schoolPhone = td.schoolPhone;
        if (td.schoolAddress) this.schoolAddress = td.schoolAddress;
        this.settingsRefreshing = false;
      },
      error: () => {
        this.settingsRefreshing = false;
      }
    });
    this.refreshProfilePreview();
  }

  private refreshProfilePreview(): void {
    const url = this.auth.getStoredAvatarDataUrl();
    this.profilePreviewUrl = url;
    this.profileInitials = this.auth.getUserInitials();
  }

  onOwnPhotoPicked(ev: ProfilePhotoPickEvent): void {
    this.auth.setMyProfileAvatarDataUrl(ev.dataUrl);
    this.refreshProfilePreview();
    this.cdr.markForCheck();
  }

  onOwnPhotoRemoved(): void {
    this.auth.clearMyProfileAvatarDataUrl();
    this.refreshProfilePreview();
    this.cdr.markForCheck();
  }

  syncChildPhotoPreview(): void {
    if (!this.childPhotoTargetId) {
      this.childPhotoPreview = null;
      this.childPhotoInitials = '';
      return;
    }
    const s = this.myChildren.find(x => x.id === this.childPhotoTargetId);
    this.childPhotoInitials = s ? (s.firstName[0] + s.lastName[0]).toUpperCase() : '';
    this.childPhotoPreview = this.auth.getChildAvatarDataUrl(this.childPhotoTargetId);
  }

  onChildPhotoPicked(ev: ProfilePhotoPickEvent): void {
    if (!this.childPhotoTargetId) return;
    this.auth.setChildAvatarDataUrl(this.childPhotoTargetId, ev.dataUrl);
    this.syncChildPhotoPreview();
    this.cdr.markForCheck();
  }

  onChildPhotoRemoved(): void {
    if (!this.childPhotoTargetId) return;
    this.auth.clearChildAvatarDataUrl(this.childPhotoTargetId);
    this.syncChildPhotoPreview();
    this.cdr.markForCheck();
  }

  loadBranches(): void {
    this.branchesError = '';
    this.branchesLoading = true;
    this.branchesFetched = true;
    this.settingsService.listBranches(this.schoolCode).subscribe({
      next: list => {
        this.branches = list ?? [];
        this.branchesLoading = false;
      },
      error: () => {
        this.branchesLoading = false;
        this.branchesError = 'Could not load branches. Try again or check your connection.';
      }
    });
  }

  saveGeneral(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.generalSaveMsg = '';
    this.generalSaveError = '';
    this.auth.saveTenantDisplay({
      schoolName: this.schoolName,
      schoolEmail: this.schoolEmail,
      schoolPhone: this.schoolPhone,
      schoolAddress: this.schoolAddress
    });
    const payload = {
      schoolName: this.schoolName,
      email: this.schoolEmail,
      phone: this.schoolPhone,
      address: this.schoolAddress,
      primaryColor: this.primaryColor,
      secondaryColor: this.accentColor,
      tenantId: this.tenantId,
      schoolCode: this.schoolCode
    };
    this.saving = true;
    this.settingsService.update(payload).subscribe({
      next: () => {
        this.saving = false;
        this.generalSaveMsg = runtimeConfig.useMocks
          ? 'Saved on this device (mock). Same fields will sync from API when mocks are off.'
          : 'School information updated.';
        this.auth.fetchProfileSummary().subscribe();
      },
      error: () => {
        this.saving = false;
        this.generalSaveError = 'Save failed. Please try again.';
      }
    });
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
  }

  applyBranding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
    if (!runtimeConfig.useMocks) {
      this.settingsService.update({
        primaryColor: this.primaryColor,
        secondaryColor: this.accentColor,
        tenantId: this.tenantId
      }).subscribe();
    }
  }

  resetBranding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.primaryColor = ThemeService.DEFAULT_PRIMARY;
    this.accentColor = ThemeService.DEFAULT_ACCENT;
    this.themeService.resetBrandingToDefault();
    if (!runtimeConfig.useMocks && this.tenantId) {
      this.settingsService
        .update({
          primaryColor: this.primaryColor,
          secondaryColor: this.accentColor,
          tenantId: this.tenantId
        })
        .subscribe();
    }
  }
}
