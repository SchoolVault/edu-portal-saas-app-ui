import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PostLoginRouteService } from '../../../core/services/post-login-route.service';
import { UserLocaleService, type UiLanguage } from '../../../core/i18n/user-locale.service';
import type { FieldErrors } from '../../../core/validation';
import {
  type LoginField,
  validateLoginForm,
  validatePhoneOtpSend,
  validatePhoneOtpVerify,
} from '../../../core/validation';
import { AuthMarketingBandComponent } from '../auth-marketing/auth-marketing-band.component';
import { ErpI18nPhDirective } from '../../../shared/erp-i18n/erp-i18n-host.directives';
import { ErpIntlPhoneRowComponent } from '../../../shared/erp-phone-intl/erp-intl-phone-row.component';

type LoginAuthMode = 'email_password' | 'phone_otp';
type PhoneFlowStep = 'idle' | 'otp_sent';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, AuthMarketingBandComponent, ErpI18nPhDirective, ErpIntlPhoneRowComponent],
  template: `
    <div class="login-container" data-testid="login-page">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <img [src]="loginFormLogoSrc" alt="SchoolVault" width="44" height="44" />
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">{{ 'login.title' | translate }}</h2>
          <p class="login-subtitle">{{ 'login.subtitle' | translate }}</p>

          <div class="login-mode-bar" role="tablist" [attr.aria-label]="'login.authMode.label' | translate">
            <button
              type="button"
              class="login-mode-btn"
              [class.login-mode-btn--active]="authMode === 'email_password'"
              (click)="setAuthMode('email_password')"
              role="tab"
              [attr.aria-selected]="authMode === 'email_password'">
              {{ 'login.authMode.emailPassword' | translate }}
            </button>
            <button
              type="button"
              class="login-mode-btn"
              [class.login-mode-btn--active]="authMode === 'phone_otp'"
              (click)="setAuthMode('phone_otp')"
              role="tab"
              [attr.aria-selected]="authMode === 'phone_otp'">
              {{ 'login.authMode.phoneOtp' | translate }}
            </button>
          </div>

          <div class="login-error" *ngIf="bannerKey" data-testid="login-error">
            <i class="bi bi-exclamation-circle"></i>
            {{ bannerKey | translate }}
          </div>

          <form (ngSubmit)="onFormSubmit()" novalidate data-testid="login-form">
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
                [autocomplete]="authMode === 'phone_otp' ? 'organization' : 'username'" />
              <div id="lg-err-schoolCode" class="field-error" *ngIf="fieldErrors.schoolCode" role="alert">{{ fieldErrors.schoolCode | translate }}</div>
            </div>

            <ng-container *ngIf="authMode === 'email_password'">
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
                <div class="login-password-label-row">
                  <label class="erp-label mb-0" for="lg-password">{{ 'login.password' | translate }}</label>
                  <a routerLink="/forgot-password" class="login-forgot-link">{{ 'login.forgotPassword' | translate }}</a>
                </div>
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
            </ng-container>

            <ng-container *ngIf="authMode === 'phone_otp'">
              <div class="erp-form-group" *ngIf="phoneFlowStep === 'idle'">
                <label class="erp-label">{{ 'login.phone' | translate }}</label>
                <erp-intl-phone-row
                  idPrefix="lg-phone"
                  namePrefix="loginPhone"
                  testIdPrefix="login-phone"
                  [canonicalPhone]="phone"
                  (canonicalPhoneChange)="onLoginCanonicalPhone($event)"
                />
                <div id="lg-err-phone" class="field-error" *ngIf="fieldErrors.phone" role="alert">{{ fieldErrors.phone | translate }}</div>
              </div>
              <div class="erp-form-group" *ngIf="phoneFlowStep === 'otp_sent'">
                <label class="erp-label" for="lg-otp">{{ 'login.otp' | translate }}</label>
                <input
                  id="lg-otp"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="erp-input"
                  [class.erp-input--error]="!!fieldErrors.otp"
                  [(ngModel)]="otp"
                  (ngModelChange)="clearField('otp')"
                  name="otp"
                  maxlength="6"
                  erpI18nPh="login.otpPlaceholder"
                  [attr.aria-invalid]="!!fieldErrors.otp"
                  [attr.aria-describedby]="fieldErrors.otp ? 'lg-err-otp' : null"
                  data-testid="login-otp"
                  autocomplete="one-time-code" />
                <div id="lg-err-otp" class="field-error" *ngIf="fieldErrors.otp" role="alert">{{ fieldErrors.otp | translate }}</div>
                <p class="text-muted small mb-0 mt-2" *ngIf="devOtpHint">{{ 'login.devOtpHint' | translate: { code: devOtpHint } }}</p>
                <div class="login-phone-actions">
                  <button type="button" class="btn-outline-erp btn-sm" (click)="onChangePhone()">
                    <i class="bi bi-pencil-square" aria-hidden="true"></i>
                    {{ 'login.changePhone' | translate }}
                  </button>
                  <button
                    type="button"
                    class="btn-outline-erp btn-sm"
                    (click)="onResendOtp()"
                    [disabled]="resendCountdown > 0 || sendOtpLoading">
                    <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
                    {{ resendCountdown > 0 ? ('login.resendIn' | translate: { seconds: resendCountdown }) : ('login.resendOtp' | translate) }}
                  </button>
                </div>
              </div>
            </ng-container>

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
                    [disabled]="primarySubmitDisabled" data-testid="login-submit-button">
              <span class="spinner" *ngIf="loading || sendOtpLoading || verifyLoading"></span>
              {{ primarySubmitLabel | translate }}
            </button>
          </form>

          <app-auth-marketing-band />

          <p class="auth-page-footer-link">
            {{ 'login.newSchool' | translate }}
            <a routerLink="/signup">{{ 'login.createWorkspace' | translate }}</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <img [src]="loginHeroImageSrc" alt="" />
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
      .login-mode-bar {
        display: flex;
        gap: 0;
        margin-bottom: 1.25rem;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid var(--clr-border-light);
      }
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
export class LoginComponent implements OnInit, OnDestroy {
  /** Hero on the photo panel: fixed English (not translated with UI language). */
  readonly heroEn = {
    title: 'Enterprise School Management',
    subtitle:
      'Manage admissions, academics, fees, attendance and more — from one unified platform for modern schools.',
  } as const;

  /** Login-only assets (pre–single-asset branding); sidebar/auth shell still use `BRAND_LOGO_SRC`. */
  readonly loginFormLogoSrc =
    'https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png';
  readonly loginHeroImageSrc =
    'https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png';

  authMode: LoginAuthMode = 'email_password';
  phoneFlowStep: PhoneFlowStep = 'idle';

  email = '';
  password = '';
  schoolCode = '';
  phone = '';
  otp = '';
  devOtpHint = '';
  verificationToken = '';

  selectedUiLang: UiLanguage = 'en';
  fieldErrors: FieldErrors<LoginField> = {};
  bannerKey = '';
  loading = false;
  sendOtpLoading = false;
  verifyLoading = false;
  showPassword = false;
  resendCountdown = 0;
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private postLoginRoute: PostLoginRouteService,
    readonly userLocale: UserLocaleService
  ) {}

  get primarySubmitDisabled(): boolean {
    if (this.authMode === 'email_password') {
      return this.loading;
    }
    return this.loading || this.sendOtpLoading || this.verifyLoading;
  }

  get primarySubmitLabel(): string {
    if (this.authMode === 'email_password') {
      return this.loading ? 'login.signingIn' : 'login.signIn';
    }
    if (this.phoneFlowStep === 'idle') {
      return this.sendOtpLoading ? 'login.sendingOtp' : 'login.sendOtp';
    }
    return this.verifyLoading ? 'login.verifying' : 'login.verifyAndSignIn';
  }

  ngOnInit(): void {
    this.selectedUiLang = this.userLocale.readStored();
    this.authService
      .ensureValidSession()
      .pipe(take(1))
      .subscribe(ok => {
        if (!ok) {
          return;
        }
        this.router.navigate([this.postLoginRoute.defaultAppPath()]);
      });
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  onLoginLangPreview(code: string): void {
    const lang: UiLanguage = code === 'hi' ? 'hi' : 'en';
    this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
  }

  setAuthMode(mode: LoginAuthMode): void {
    this.authMode = mode;
    this.bannerKey = '';
    this.fieldErrors = {};
    this.devOtpHint = '';
    this.verificationToken = '';
    this.otp = '';
    this.clearResendTimer();
    this.resendCountdown = 0;
    if (mode === 'email_password') {
      this.phoneFlowStep = 'idle';
    }
  }

  onLoginCanonicalPhone(value: string): void {
    this.phone = value;
    this.clearField('phone');
  }

  clearField(field: LoginField): void {
    if (!this.fieldErrors[field]) {
      return;
    }
    const next = { ...this.fieldErrors };
    delete next[field];
    this.fieldErrors = next;
  }

  onFormSubmit(): void {
    if (this.authMode === 'email_password') {
      this.onEmailLogin();
      return;
    }
    if (this.phoneFlowStep === 'idle') {
      this.onSendOtp();
      return;
    }
    this.onVerifyAndPhoneLogin();
  }

  private navigateAfterLogin(_role: string): void {
    this.router.navigate([this.postLoginRoute.defaultAppPath()]);
  }

  onEmailLogin(): void {
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
        schoolCode: this.schoolCode.trim(),
        interfaceLocale: this.selectedUiLang,
      })
      .subscribe({
        next: response => {
          this.loading = false;
          this.navigateAfterLogin(response.user.role);
        },
        error: () => {
          this.loading = false;
          this.bannerKey = 'login.errorGeneric';
        }
      });
  }

  onSendOtp(): void {
    this.bannerKey = '';
    this.fieldErrors = {};
    const errs = validatePhoneOtpSend({ schoolCode: this.schoolCode, phone: this.phone });
    if (Object.keys(errs).length > 0) {
      this.fieldErrors = errs;
      return;
    }
    this.sendOtpLoading = true;
    this.devOtpHint = '';
    this.authService
      .sendLoginOtp({
        phone: this.phone.trim(),
        schoolCode: this.schoolCode.trim().toUpperCase(),
        purpose: 'LOGIN',
        channel: 'SMS',
      })
      .subscribe({
        next: res => {
          this.sendOtpLoading = false;
          if (!res.success) {
            this.bannerKey = 'login.errorPhoneOtpSend';
            this.startResendCountdown(res.canRetryAfterSeconds ?? 60);
            return;
          }
          this.phoneFlowStep = 'otp_sent';
          this.otp = '';
          this.devOtpHint = res.devOtpCode ?? '';
          this.startResendCountdown(res.canRetryAfterSeconds ?? 60);
        },
        error: () => {
          this.sendOtpLoading = false;
          this.bannerKey = 'login.errorPhoneOtpSend';
        }
      });
  }

  onVerifyAndPhoneLogin(): void {
    this.bannerKey = '';
    this.fieldErrors = {};
    const errs = validatePhoneOtpVerify({
      schoolCode: this.schoolCode,
      phone: this.phone,
      otp: this.otp,
    });
    if (Object.keys(errs).length > 0) {
      this.fieldErrors = errs;
      return;
    }
    this.verifyLoading = true;
    this.authService
      .verifyLoginOtp({
        phone: this.phone.trim(),
        schoolCode: this.schoolCode.trim().toUpperCase(),
        otpCode: this.otp.trim(),
        purpose: 'LOGIN',
      })
      .subscribe({
        next: res => {
          this.verifyLoading = false;
          if (!res.verified || !res.verificationToken) {
            this.fieldErrors = { ...this.fieldErrors, otp: 'login.validation.otpMismatch' };
            return;
          }
          this.verificationToken = res.verificationToken;
          this.completePhoneLogin();
        },
        error: () => {
          this.verifyLoading = false;
          this.bannerKey = 'login.errorPhoneOtpVerify';
        }
      });
  }

  private completePhoneLogin(): void {
    this.loading = true;
    this.authService
      .phoneLogin({
        phone: this.phone.trim(),
        schoolCode: this.schoolCode.trim().toUpperCase(),
        verificationToken: this.verificationToken,
        interfaceLocale: this.selectedUiLang,
      })
      .subscribe({
        next: response => {
          this.loading = false;
          this.navigateAfterLogin(response.user.role);
        },
        error: () => {
          this.loading = false;
          this.bannerKey = 'login.errorPhoneLogin';
        }
      });
  }

  onResendOtp(): void {
    if (this.resendCountdown > 0) {
      return;
    }
    this.bannerKey = '';
    this.authService
      .resendLoginOtp({
        phone: this.phone.trim(),
        schoolCode: this.schoolCode.trim().toUpperCase(),
        purpose: 'LOGIN',
        channel: 'SMS',
      })
      .subscribe({
        next: res => {
          if (!res.success) {
            this.bannerKey = 'login.errorPhoneOtpSend';
            this.startResendCountdown(res.canRetryAfterSeconds ?? 60);
            return;
          }
          this.devOtpHint = res.devOtpCode ?? '';
          this.startResendCountdown(res.canRetryAfterSeconds ?? 60);
        },
        error: () => {
          this.bannerKey = 'login.errorPhoneOtpSend';
        }
      });
  }

  onChangePhone(): void {
    this.phoneFlowStep = 'idle';
    this.otp = '';
    this.devOtpHint = '';
    this.verificationToken = '';
    this.fieldErrors = {};
    this.clearResendTimer();
    this.resendCountdown = 0;
  }

  private startResendCountdown(seconds: number): void {
    this.clearResendTimer();
    this.resendCountdown = Math.max(0, Math.floor(seconds));
    if (this.resendCountdown <= 0) {
      return;
    }
    this.resendTimer = setInterval(() => {
      this.resendCountdown -= 1;
      if (this.resendCountdown <= 0) {
        this.clearResendTimer();
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer != null) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
