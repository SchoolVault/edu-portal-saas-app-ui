import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import type { OnboardSchoolRequest } from '../../../core/models/models';
import {
  ONBOARD_ADMIN_PASSWORD_MAX,
  ONBOARD_SCHOOL_CODE_MAX,
  ONBOARD_SCHOOL_CODE_MIN,
} from '../../../core/validation/auth-forms.constants';
import {
  type FieldErrors,
  type OnboardSchoolField,
  hasFieldErrors,
  validateOnboardSchoolForm,
} from '../../../core/validation/onboard-school-form.validation';

const HERO_IMG =
  'https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container" data-testid="signup-page">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="SchoolVault">
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">Create your school workspace</h2>
          <p class="login-subtitle">Provision a secure tenant, brand your portal, and invite your team — the same flow used by district-scale deployments.</p>

          <div class="login-error" *ngIf="error">
            <i class="bi bi-exclamation-circle"></i>
            {{ error }}
          </div>

          <form (ngSubmit)="onSubmit()" novalidate>
            <div class="erp-form-group">
              <label class="erp-label" for="su-schoolName">School name</label>
              <input
                id="su-schoolName"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolName"
                [(ngModel)]="form.schoolName"
                (ngModelChange)="clearField('schoolName')"
                name="schoolName"
                maxlength="200"
                placeholder="e.g. Crescent Heights Academy"
                [attr.aria-invalid]="!!fieldErrors.schoolName"
                [attr.aria-describedby]="fieldErrors.schoolName ? 'su-err-schoolName' : null"
                autocomplete="organization" />
              <div id="su-err-schoolName" class="field-error" *ngIf="fieldErrors.schoolName" role="alert">{{ fieldErrors.schoolName }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-schoolCode">School code <span class="erp-label-hint">{{ schoolCodeMin }}–{{ schoolCodeMax }} characters</span></label>
              <input
                id="su-schoolCode"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolCode"
                [(ngModel)]="form.schoolCode"
                (ngModelChange)="clearField('schoolCode')"
                name="schoolCode"
                [maxlength]="schoolCodeMax"
                [minlength]="schoolCodeMin"
                placeholder="e.g. CHA01"
                [attr.aria-invalid]="!!fieldErrors.schoolCode"
                [attr.aria-describedby]="fieldErrors.schoolCode ? 'su-err-schoolCode' : null"
                autocomplete="off" />
              <div id="su-err-schoolCode" class="field-error" *ngIf="fieldErrors.schoolCode" role="alert">{{ fieldErrors.schoolCode }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-adminName">Admin name</label>
              <input
                id="su-adminName"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.adminName"
                [(ngModel)]="form.adminName"
                (ngModelChange)="clearField('adminName')"
                name="adminName"
                maxlength="120"
                [attr.aria-invalid]="!!fieldErrors.adminName"
                [attr.aria-describedby]="fieldErrors.adminName ? 'su-err-adminName' : null"
                autocomplete="name" />
              <div id="su-err-adminName" class="field-error" *ngIf="fieldErrors.adminName" role="alert">{{ fieldErrors.adminName }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-adminEmail">Admin email</label>
              <input
                id="su-adminEmail"
                type="email"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.adminEmail"
                [(ngModel)]="form.adminEmail"
                (ngModelChange)="clearField('adminEmail')"
                name="adminEmail"
                maxlength="254"
                [attr.aria-invalid]="!!fieldErrors.adminEmail"
                [attr.aria-describedby]="fieldErrors.adminEmail ? 'su-err-adminEmail' : null"
                autocomplete="email" />
              <div id="su-err-adminEmail" class="field-error" *ngIf="fieldErrors.adminEmail" role="alert">{{ fieldErrors.adminEmail }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-adminPassword">Admin password <span class="erp-label-hint">8–{{ pwdMax }} characters</span></label>
              <input
                id="su-adminPassword"
                type="password"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.adminPassword"
                [(ngModel)]="form.adminPassword"
                (ngModelChange)="clearField('adminPassword')"
                name="adminPassword"
                [maxlength]="pwdMax"
                minlength="8"
                placeholder="Choose a strong password"
                [attr.aria-invalid]="!!fieldErrors.adminPassword"
                [attr.aria-describedby]="fieldErrors.adminPassword ? 'su-err-adminPassword' : null"
                autocomplete="new-password" />
              <div id="su-err-adminPassword" class="field-error" *ngIf="fieldErrors.adminPassword" role="alert">{{ fieldErrors.adminPassword }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-phone">Phone <span class="erp-label-hint">optional</span></label>
              <input
                id="su-phone"
                class="erp-input"
                [(ngModel)]="form.phone"
                name="phone"
                maxlength="40"
                placeholder="School office line"
                autocomplete="tel" />
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-address">Address <span class="erp-label-hint">optional</span></label>
              <textarea
                id="su-address"
                class="erp-input erp-textarea"
                [(ngModel)]="form.address"
                name="address"
                rows="3"
                maxlength="500"
                placeholder="Campus address"></textarea>
            </div>
            <button type="submit" class="btn-primary-erp" style="width: 100%; justify-content: center; padding: 12px;" [disabled]="loading">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Creating workspace…' : 'Create school workspace' }}
            </button>
          </form>

          <div class="auth-marketing-band signup-marketing-band">
            <div class="auth-testimonials signup-testimonials">
              <h4>What schools say</h4>
              <div class="auth-quote" *ngFor="let t of testimonials; let last = last" [class.auth-quote-compact]="last">
                <p>“{{ t.text }}”</p>
                <div class="auth-quote-meta">{{ t.name }} · {{ t.role }}</div>
              </div>
            </div>
            <div class="auth-contact-card">
              <h4>Book a demo or talk to us</h4>
              <p class="small text-muted mb-2">District evaluations, migration, or custom modules — same-day first response.</p>
              <div class="auth-contact-row"><i class="bi bi-envelope"></i> <a [href]="platformMailto">{{ platformEmailDisplay }}</a></div>
              <div class="auth-contact-row"><i class="bi bi-telephone"></i> {{ platform.phone }}</div>
              <div class="auth-contact-row"><i class="bi bi-globe2"></i> Enterprise SLA · SOC2-aligned roadmap</div>
            </div>
          </div>

          <p style="margin-top: 20px; font-size: 13px;">
            Already have a workspace?
            <a routerLink="/login">Sign in</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <img [src]="HERO_IMG" alt="">
        <div class="login-right-overlay">
          <div class="login-right-text">
            <h2>Trusted operations layer</h2>
            <p>Admissions, fees, transport, hostel, payroll, and parent engagement — modular services with a single sign-on and tenant-aware APIs.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .erp-label-hint {
        font-weight: 500;
        color: var(--clr-text-muted);
        font-size: 11px;
        margin-left: 6px;
      }
      .signup-marketing-band {
        margin-top: 22px;
        padding-top: 16px;
        border-top: 1px solid var(--clr-border);
        display: grid;
        gap: 14px;
        align-items: start;
      }
      @media (min-width: 560px) {
        .signup-marketing-band { grid-template-columns: 1fr 1fr; }
      }
      .signup-testimonials { margin-top: 0; padding-top: 0; border-top: none; }
      .auth-testimonials h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--clr-text-muted); margin-bottom: 10px; }
      .auth-quote { margin-bottom: 10px; padding: 10px 12px; border-radius: var(--radius-lg); background: var(--clr-surface-muted); border: 1px solid var(--clr-border-light); }
      .auth-quote-compact { margin-bottom: 0; }
      .auth-quote p { margin: 0; font-size: 12px; line-height: 1.45; color: var(--clr-text-secondary); }
      .auth-quote-meta { margin-top: 6px; font-size: 10px; font-weight: 600; color: var(--clr-text-muted); }
      .auth-contact-card { margin-top: 0; padding: 12px 14px; border-radius: var(--radius-xl); border: 1px solid var(--clr-border); background: var(--clr-surface-alt); }
      .auth-contact-card h4 { margin: 0 0 4px; font-size: 13px; }
      .auth-contact-row { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-top: 6px; color: var(--clr-text-secondary); }
      .auth-contact-row a { color: var(--clr-accent); font-weight: 600; }
    `
  ]
})
export class SignupComponent {
  readonly HERO_IMG = HERO_IMG;
  readonly schoolCodeMin = ONBOARD_SCHOOL_CODE_MIN;
  readonly schoolCodeMax = ONBOARD_SCHOOL_CODE_MAX;
  readonly pwdMax = ONBOARD_ADMIN_PASSWORD_MAX;

  readonly platform = { email: 'hello@schoolvault.com', phone: '+1 (512) 555-0140' };
  readonly platformEmailDisplay = 'hello@schoolvault.com';
  readonly platformMailto = 'mailto:hello@schoolvault.com';
  readonly testimonials = [
    { text: 'We retired three spreadsheets and one legacy SIS in a single term. Parents finally have one place for fees and notices.', name: 'Dr. Anita Desai', role: 'Principal, Riverside International' },
    { text: 'Transport and hostel modules matched our audit requirements out of the box. Engineering support was exceptional.', name: 'James Porter', role: 'COO, Northlake Schools Group' },
    { text: 'Role-based access for teachers and guardians is granular without feeling heavy — exactly what our trust needed.', name: 'Elena Vogt', role: 'IT Director, Stadt Gymnasium' }
  ];

  form: OnboardSchoolRequest = {
    schoolName: '',
    schoolCode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    phone: '',
    address: ''
  };

  fieldErrors: FieldErrors<OnboardSchoolField> = {};
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  clearField(field: OnboardSchoolField): void {
    if (!this.fieldErrors[field]) {
      return;
    }
    const next = { ...this.fieldErrors };
    delete next[field];
    this.fieldErrors = next;
  }

  onSubmit(): void {
    this.error = '';
    this.fieldErrors = {};
    const errs = validateOnboardSchoolForm(this.form);
    if (hasFieldErrors(errs)) {
      this.fieldErrors = errs;
      return;
    }
    this.loading = true;
    this.authService.onboardSchool(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.loading = false;
        this.error = err.message || 'Unable to create school workspace.';
      }
    });
  }
}
