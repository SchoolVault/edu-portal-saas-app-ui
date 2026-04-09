import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { SchoolBranch, Student } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="settings-page">
      <div class="mb-4 animate-in d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Settings</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">School configuration and preferences</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm align-self-center" (click)="reloadSettings()" [disabled]="settingsRefreshing">
          <i class="bi bi-arrow-clockwise"></i> {{ settingsRefreshing ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'general'" (click)="tab = 'general'">General</button>
        <button class="erp-tab" [class.active]="tab === 'branding'" (click)="tab = 'branding'">Branding</button>
        <button class="erp-tab" [class.active]="tab === 'roles'" (click)="tab = 'roles'">Roles & Permissions</button>
        <button class="erp-tab" [class.active]="tab === 'features'" (click)="tab = 'features'">Feature Toggles</button>
        <button class="erp-tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">Profile &amp; photo</button>
      </div>

      <div *ngIf="tab === 'profile'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">Profile photo</h4>
        <p class="text-muted small">Photos are stored in this browser for demo (data URL). A future media service will sync across devices.</p>
        <div class="row g-3 align-items-center mt-1">
          <div class="col-auto">
            <div *ngIf="!profilePreviewUrl" class="settings-avatar-preview">{{ profileInitials }}</div>
            <img *ngIf="profilePreviewUrl" [src]="profilePreviewUrl" alt="" class="settings-avatar-preview settings-avatar-img" />
          </div>
          <div class="col-md-8">
            <ng-container *ngIf="canEditOwnPhoto">
              <label class="erp-label">Your picture</label>
              <input type="file" accept="image/*" class="erp-input" (change)="onOwnPhotoSelected($event)" />
            </ng-container>
            <ng-container *ngIf="isParentOnlyChildren">
              <label class="erp-label">Child portrait</label>
              <select class="erp-select mb-2" [(ngModel)]="childPhotoTargetId">
                <option value="">Select child</option>
                <option *ngFor="let s of myChildren" [value]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
              </select>
              <input type="file" accept="image/*" class="erp-input" [disabled]="!childPhotoTargetId" (change)="onChildPhotoSelected($event)" />
              <p class="small text-muted mb-0 mt-1">Parents may only upload photos for their linked children. Staff manage student records in the Students module.</p>
            </ng-container>
            <ng-container *ngIf="!canEditOwnPhoto && !isParentOnlyChildren">
              <p class="small text-muted mb-0">Your role uses directory photos managed by administrators.</p>
            </ng-container>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'general'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">School Information</h4>
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

        <div class="mt-4 pt-4" style="border-top: 1px solid var(--clr-border-light);">
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
        <p class="text-muted small mt-2 mb-0">Persists primary/accent to this browser and updates CSS variables. With API, also saves to tenant settings (admin).</p>
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
      .settings-avatar-preview {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--clr-surface-muted);
        border: 1px solid var(--clr-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 22px;
        color: var(--clr-text-secondary);
      }
      .settings-avatar-img {
        object-fit: cover;
        padding: 0;
        font-size: 0;
      }
    `
  ]
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
    private studentService: StudentService
  ) {}

  get canEditOwnPhoto(): boolean {
    const r = this.auth.getRole();
    return r === 'admin' || r === 'teacher' || r === 'super_admin' || r === 'student';
  }

  get isParentOnlyChildren(): boolean {
    return this.auth.getRole() === 'parent';
  }

  ngOnInit(): void {
    this.refreshProfilePreview();
    this.reloadSettings();
  }

  reloadSettings(): void {
    this.settingsRefreshing = true;
    if (this.isParentOnlyChildren) {
      this.studentService.getStudents().subscribe(list => {
        const uid = this.auth.getCurrentUser()?.id ?? '';
        this.myChildren = (list || []).filter(s => s.parentId === uid);
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

  onOwnPhotoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) {
        this.auth.setMyProfileAvatarDataUrl(data);
        this.refreshProfilePreview();
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  onChildPhotoSelected(ev: Event): void {
    if (!this.childPhotoTargetId) return;
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) this.auth.setChildAvatarDataUrl(this.childPhotoTargetId, data);
    };
    reader.readAsDataURL(file);
    input.value = '';
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
        this.generalSaveMsg = environment.useMocks
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
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
    if (!environment.useMocks) {
      this.settingsService.update({
        primaryColor: this.primaryColor,
        secondaryColor: this.accentColor,
        tenantId: this.tenantId
      }).subscribe();
    }
  }

  resetBranding(): void {
    this.primaryColor = ThemeService.DEFAULT_PRIMARY;
    this.accentColor = ThemeService.DEFAULT_ACCENT;
    this.themeService.resetBrandingToDefault();
    if (!environment.useMocks && this.tenantId) {
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
