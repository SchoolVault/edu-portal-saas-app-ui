import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { UserLocaleService, type UiLanguage } from '../../../core/i18n/user-locale.service';
import type { FieldErrors } from '../../../core/validation';
import { type LoginField, validateLoginForm } from '../../../core/validation';
import { AuthMarketingBandComponent } from '../auth-marketing/auth-marketing-band.component';
import { ErpI18nPhDirective } from '../../../shared/erp-i18n/erp-i18n-host.directives';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, AuthMarketingBandComponent, ErpI18nPhDirective],
  template: `
    <div class="login-container" data-testid="login-page">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="SchoolVault">
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">{{ 'login.title' | translate }}</h2>
          <p class="login-subtitle">{{ 'login.subtitle' | translate }}</p>

          <div class="login-error" *ngIf="bannerKey" data-testid="login-error">
            <i class="bi bi-exclamation-circle"></i>
            {{ bannerKey | translate }}
          </div>

          <form (ngSubmit)="onLogin()" novalidate data-testid="login-form">
            <div class="erp-form-group">
              <label class="erp-label" for="lg-schoolCode">{{ 'login.schoolCode' | translate }}</label>
              <input
                id="lg-schoolCode"
                type="text"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolCode"
                [(ngModel)]="schoolCode"
                (ngModelChange)="clearField('schoolCode')"
                name="schoolCode"
                maxlength="64"
                erpI18nPh="login.schoolCodePlaceholder"
                [attr.aria-invalid]="!!fieldErrors.schoolCode"
                [attr.aria-describedby]="fieldErrors.schoolCode ? 'lg-err-schoolCode' : null"
                data-testid="login-school-code"
                autocomplete="username" />
              <div id="lg-err-schoolCode" class="field-error" *ngIf="fieldErrors.schoolCode" role="alert">{{ fieldErrors.schoolCode | translate }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="lg-email">{{ 'login.email' | translate }}</label>
              <input
                id="lg-email"
                type="email"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.email"
                [(ngModel)]="email"
                (ngModelChange)="clearField('email')"
                name="email"
                maxlength="254"
                erpI18nPh="login.emailPlaceholder"
                [attr.aria-invalid]="!!fieldErrors.email"
                [attr.aria-describedby]="fieldErrors.email ? 'lg-err-email' : null"
                data-testid="login-email"
                autocomplete="email" />
              <div id="lg-err-email" class="field-error" *ngIf="fieldErrors.email" role="alert">{{ fieldErrors.email | translate }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="lg-password">{{ 'login.password' | translate }}</label>
              <div style="position: relative;">
                <input
                  id="lg-password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="erp-input"
                  [class.erp-input--error]="!!fieldErrors.password"
                  [(ngModel)]="password"
                  (ngModelChange)="clearField('password')"
                  name="password"
                  erpI18nPh="login.passwordPlaceholder"
                  style="padding-right: 44px;"
                  [attr.aria-invalid]="!!fieldErrors.password"
                  [attr.aria-describedby]="fieldErrors.password ? 'lg-err-password' : null"
                  data-testid="login-password"
                  autocomplete="current-password" />
                <button type="button" class="btn-icon" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);"
                        (click)="showPassword = !showPassword">
                  <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div id="lg-err-password" class="field-error" *ngIf="fieldErrors.password" role="alert">{{ fieldErrors.password | translate }}</div>
            </div>
            <div class="erp-form-group login-lang-row">
              <label class="erp-label" for="lg-lang">{{ 'login.appLanguage' | translate }}</label>
              <select
                id="lg-lang"
                class="erp-select login-lang-select"
                name="uiLang"
                [(ngModel)]="selectedUiLang"
                (ngModelChange)="onLoginLangPreview($event)"
                [attr.aria-label]="'login.appLanguage' | translate">
                <option *ngFor="let o of userLocale.supported" [value]="o.code">{{ o.nativeLabel }}</option>
              </select>
              <p class="login-lang-hint text-muted small mb-0">{{ 'login.appLanguageHint' | translate }}</p>
            </div>
            <button type="submit" class="btn-primary-erp" style="width: 100%; justify-content: center; padding: 12px;"
                    [disabled]="loading" data-testid="login-submit-button">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? ('login.signingIn' | translate) : ('login.signIn' | translate) }}
            </button>
          </form>

          <div class="demo-credentials" data-testid="demo-credentials">
            <h4>{{ 'login.demoTitle' | translate }}</h4>
            <p>
              <strong>{{ 'login.demoSchoolCode' | translate }}:</strong> SCH001<br>
              <strong>{{ 'login.demoAdmin' | translate }}:</strong> admin&#64;school.com / admin123<br>
              <strong>{{ 'login.demoTeacher' | translate }}:</strong> teacher&#64;school.com / teacher123<br>
              <strong>{{ 'login.demoParent' | translate }}:</strong> parent&#64;school.com / parent123<br>
              <strong>{{ 'login.demoSuperAdmin' | translate }}:</strong> superadmin&#64;schoolvault.com / super123 / PLATFORM
            </p>
          </div>

          <app-auth-marketing-band />

          <p class="auth-page-footer-link">
            {{ 'login.newSchool' | translate }}
            <a routerLink="/signup">{{ 'login.createWorkspace' | translate }}</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png" alt="">
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
      .login-lang-row {
        margin-top: 0.25rem;
        margin-bottom: 1rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--clr-border-light);
      }
      .login-lang-select { max-width: 100%; width: 100%; font-weight: 600; }
      @media (min-width: 420px) {
        .login-lang-select { max-width: 280px; }
      }
      .login-lang-hint { margin-top: 8px; line-height: 1.45; }
    `
  ]
})
export class LoginComponent implements OnInit {
  /** Hero on the photo panel: fixed English (not translated with UI language). */
  readonly heroEn = {
    title: 'Enterprise School Management',
    subtitle:
      'Manage admissions, academics, fees, attendance and more — from one unified platform for modern schools.',
  } as const;

  email = '';
  password = '';
  schoolCode = '';
  selectedUiLang: UiLanguage = 'en';
  fieldErrors: FieldErrors<LoginField> = {};
  /** i18n key for the red banner above the form (API failures). */
  bannerKey = '';
  loading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    readonly userLocale: UserLocaleService
  ) {}

  ngOnInit(): void {
    this.selectedUiLang = this.userLocale.readStored();
    this.authService
      .ensureValidSession()
      .pipe(take(1))
      .subscribe(ok => {
        if (!ok) {
          return;
        }
        const role = this.authService.getRole();
        this.router.navigate([role === 'parent' ? '/app/dashboard' : role === 'super_admin' ? '/app/super-admin' : '/app/dashboard']);
      });
  }

  onLoginLangPreview(code: string): void {
    const lang: UiLanguage = code === 'hi' ? 'hi' : 'en';
    this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
  }

  clearField(field: LoginField): void {
    if (!this.fieldErrors[field]) {
      return;
    }
    const next = { ...this.fieldErrors };
    delete next[field];
    this.fieldErrors = next;
  }

  onLogin(): void {
    this.bannerKey = '';
    this.fieldErrors = {};
    const errs = validateLoginForm({ email: this.email, password: this.password, schoolCode: this.schoolCode });
    if (Object.keys(errs).length > 0) {
      this.fieldErrors = errs;
      return;
    }
    this.loading = true;
    this.authService
      .login({
        email: this.email,
        password: this.password,
        schoolCode: this.schoolCode,
        interfaceLocale: this.selectedUiLang,
      })
      .subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate([
          response.user.role === 'parent'
            ? '/app/dashboard'
            : response.user.role === 'super_admin'
              ? '/app/super-admin'
              : '/app/dashboard'
        ]);
      },
      error: () => {
        this.loading = false;
        this.bannerKey = 'login.errorGeneric';
      }
    });
  }
}
