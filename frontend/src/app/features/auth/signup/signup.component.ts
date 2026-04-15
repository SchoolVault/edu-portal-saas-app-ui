import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserLocaleService } from '../../../core/i18n/user-locale.service';
import type { OnboardSchoolRequest } from '../../../core/models/models';
import {
  ONBOARD_ADMIN_PASSWORD_MAX,
  ONBOARD_ADMIN_PASSWORD_MIN,
  ONBOARD_SCHOOL_CODE_MAX,
  ONBOARD_SCHOOL_CODE_MIN,
} from '../../../core/validation/auth-forms.constants';
import {
  type FieldErrors,
  type OnboardSchoolField,
  hasFieldErrors,
  validateOnboardSchoolForm,
} from '../../../core/validation/onboard-school-form.validation';
import { AuthMarketingBandComponent } from '../auth-marketing/auth-marketing-band.component';
import { ErpI18nPhDirective } from '../../../shared/erp-i18n/erp-i18n-host.directives';

const HERO_IMG =
  'https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, AuthMarketingBandComponent, ErpI18nPhDirective],
  template: `
    <div class="login-container" data-testid="signup-page">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="SchoolVault">
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">{{ 'signup.title' | translate }}</h2>
          <p class="login-subtitle">{{ 'signup.subtitle' | translate }}</p>

          <div class="login-error" *ngIf="bannerKey">
            <i class="bi bi-exclamation-circle"></i>
            {{ bannerKey | translate }}
          </div>

          <form (ngSubmit)="onSubmit()" novalidate>
            <div class="erp-form-group">
              <label class="erp-label" for="su-schoolName">{{ 'signup.schoolName' | translate }}</label>
              <input
                id="su-schoolName"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolName"
                [(ngModel)]="form.schoolName"
                (ngModelChange)="clearField('schoolName')"
                name="schoolName"
                maxlength="200"
                erpI18nPh="signup.schoolNamePlaceholder"
                [attr.aria-invalid]="!!fieldErrors.schoolName"
                [attr.aria-describedby]="fieldErrors.schoolName ? 'su-err-schoolName' : null"
                autocomplete="organization" />
              <div id="su-err-schoolName" class="field-error" *ngIf="fieldErrors.schoolName" role="alert">
                {{ fieldErrors.schoolName | translate: interp('schoolName') }}
              </div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-schoolCode">
                {{ 'signup.schoolCode' | translate }}
                <span class="erp-label-hint">{{ 'signup.schoolCodeHint' | translate: schoolCodeHintParams }}</span>
              </label>
              <input
                id="su-schoolCode"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolCode"
                [(ngModel)]="form.schoolCode"
                (ngModelChange)="clearField('schoolCode')"
                name="schoolCode"
                [maxlength]="schoolCodeMax"
                [minlength]="schoolCodeMin"
                erpI18nPh="signup.schoolCodePlaceholder"
                [attr.aria-invalid]="!!fieldErrors.schoolCode"
                [attr.aria-describedby]="fieldErrors.schoolCode ? 'su-err-schoolCode' : null"
                autocomplete="off" />
              <div id="su-err-schoolCode" class="field-error" *ngIf="fieldErrors.schoolCode" role="alert">
                {{ fieldErrors.schoolCode | translate: interp('schoolCode') }}
              </div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-adminName">{{ 'signup.adminName' | translate }}</label>
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
              <div id="su-err-adminName" class="field-error" *ngIf="fieldErrors.adminName" role="alert">
                {{ fieldErrors.adminName | translate: interp('adminName') }}
              </div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-phone">{{ 'signup.phone' | translate }}</label>
              <input
                id="su-phone"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.phone"
                [(ngModel)]="form.phone"
                (ngModelChange)="clearField('phone')"
                name="phone"
                maxlength="40"
                erpI18nPh="signup.phonePlaceholder"
                [attr.aria-invalid]="!!fieldErrors.phone"
                [attr.aria-describedby]="fieldErrors.phone ? 'su-err-phone' : null"
                autocomplete="tel" />
              <div id="su-err-phone" class="field-error" *ngIf="fieldErrors.phone" role="alert">
                {{ fieldErrors.phone | translate: interp('phone') }}
              </div>
              <p class="text-muted small mb-0 mt-1">{{ 'signup.phoneHintAdmin' | translate }}</p>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-adminEmail">{{ 'signup.adminEmail' | translate }}</label>
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
              <p class="text-muted small mb-0 mt-1">{{ 'signup.adminEmailHint' | translate }}</p>
              <div id="su-err-adminEmail" class="field-error" *ngIf="fieldErrors.adminEmail" role="alert">
                {{ fieldErrors.adminEmail | translate: interp('adminEmail') }}
              </div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-adminPassword">
                {{ 'signup.adminPassword' | translate }}
                <span class="erp-label-hint">{{ 'signup.passwordHint' | translate: passwordHintParams }}</span>
              </label>
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
                erpI18nPh="signup.adminPasswordPlaceholder"
                [attr.aria-invalid]="!!fieldErrors.adminPassword"
                [attr.aria-describedby]="fieldErrors.adminPassword ? 'su-err-adminPassword' : null"
                autocomplete="new-password" />
              <div id="su-err-adminPassword" class="field-error" *ngIf="fieldErrors.adminPassword" role="alert">
                {{ fieldErrors.adminPassword | translate: interp('adminPassword') }}
              </div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="su-address">
                {{ 'signup.address' | translate }} <span class="erp-label-hint">{{ 'signup.optional' | translate }}</span>
              </label>
              <textarea
                id="su-address"
                class="erp-input erp-textarea"
                [(ngModel)]="form.address"
                name="address"
                rows="3"
                maxlength="500"
                erpI18nPh="signup.addressPlaceholder"></textarea>
            </div>
            <button type="submit" class="btn-primary-erp" style="width: 100%; justify-content: center; padding: 12px;" [disabled]="loading">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? ('signup.submitting' | translate) : ('signup.submit' | translate) }}
            </button>
          </form>

          <app-auth-marketing-band />

          <p class="auth-page-footer-link">
            {{ 'signup.alreadyHave' | translate }}
            <a routerLink="/login">{{ 'signup.signInLink' | translate }}</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <img [src]="HERO_IMG" alt="">
        <div class="login-right-overlay">
          <div class="login-right-text" lang="en" dir="ltr">
            <h2>{{ heroEn.title }}</h2>
            <p>{{ heroEn.subtitle }}</p>
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
    `
  ]
})
export class SignupComponent {
  readonly heroEn = {
    title: 'Trusted operations layer',
    subtitle:
      'Admissions, fees, transport, hostel, payroll, and parent engagement — modular services with a single sign-on and tenant-aware APIs.',
  } as const;

  readonly HERO_IMG = HERO_IMG;
  readonly schoolCodeMin = ONBOARD_SCHOOL_CODE_MIN;
  readonly schoolCodeMax = ONBOARD_SCHOOL_CODE_MAX;
  readonly pwdMax = ONBOARD_ADMIN_PASSWORD_MAX;
  readonly schoolCodeHintParams = { min: ONBOARD_SCHOOL_CODE_MIN, max: ONBOARD_SCHOOL_CODE_MAX };
  readonly passwordHintParams = { min: ONBOARD_ADMIN_PASSWORD_MIN, max: ONBOARD_ADMIN_PASSWORD_MAX };

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
  /** Interpolation params for `signup.validation.*` messages that use {{min}}/{{max}}. */
  private fieldInterp: Partial<Record<OnboardSchoolField, Record<string, number>>> = {};

  loading = false;
  bannerKey = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    readonly userLocale: UserLocaleService
  ) {}

  /** Params object for translate pipe on field errors (empty when not needed). */
  interp(field: OnboardSchoolField): Record<string, number> {
    return this.fieldInterp[field] ?? {};
  }

  clearField(field: OnboardSchoolField): void {
    if (!this.fieldErrors[field]) {
      return;
    }
    const next = { ...this.fieldErrors };
    delete next[field];
    this.fieldErrors = next;
  }

  private rebuildInterp(errs: FieldErrors<OnboardSchoolField>): void {
    this.fieldInterp = {};
    if (errs.schoolCode === 'signup.validation.schoolCodeLength') {
      this.fieldInterp.schoolCode = { min: ONBOARD_SCHOOL_CODE_MIN, max: ONBOARD_SCHOOL_CODE_MAX };
    }
    if (errs.adminPassword === 'signup.validation.adminPasswordLength') {
      this.fieldInterp.adminPassword = { min: ONBOARD_ADMIN_PASSWORD_MIN, max: ONBOARD_ADMIN_PASSWORD_MAX };
    }
  }

  onSubmit(): void {
    this.bannerKey = '';
    this.fieldErrors = {};
    this.fieldInterp = {};
    const errs = validateOnboardSchoolForm(this.form);
    if (hasFieldErrors(errs)) {
      this.fieldErrors = errs;
      this.rebuildInterp(errs);
      return;
    }
    this.loading = true;
    const emailTrim = (this.form.adminEmail ?? '').trim();
    const payload: OnboardSchoolRequest = {
      ...this.form,
      adminEmail: emailTrim || undefined,
      phone: (this.form.phone ?? '').trim(),
      /** Language is chosen at login only; use stored UI locale (default en). */
      interfaceLocale: this.userLocale.currentLang(),
    };
    this.authService.onboardSchool(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.bannerKey = 'signup.errorGeneric';
      }
    });
  }
}
