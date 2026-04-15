import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserLocaleService, type UiLanguage } from '../../../core/i18n/user-locale.service';
import type { FieldErrors } from '../../../core/validation';
import {
  type LoginField,
  validatePasswordResetComplete,
  validatePasswordResetStart,
  validatePasswordResetVerify,
} from '../../../core/validation';
import { ErpI18nPhDirective } from '../../../shared/erp-i18n/erp-i18n-host.directives';

type ResetStep = 'identify' | 'verify' | 'new_password' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpI18nPhDirective],
  template: `
    <div class="login-container" data-testid="forgot-password-page">
      <div class="login-left">
        <div class="login-form-wrapper reset-shell animate-in">
          <a routerLink="/login" class="reset-back-link"><i class="bi bi-arrow-left"></i> {{ 'forgotPassword.backToLogin' | translate }}</a>
          <div class="login-logo reset-logo">
            <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="SchoolVault">
            <h1>SchoolVault</h1>
          </div>
          <div class="reset-kicker">{{ 'forgotPassword.kicker' | translate }}</div>
          <h2 class="login-title">{{ 'forgotPassword.title' | translate }}</h2>
          <p class="login-subtitle">{{ 'forgotPassword.subtitle' | translate }}</p>

          <div class="reset-steps" aria-hidden="true">
            <span [class.active]="step === 'identify'" [class.done]="stepIndex > 0">1</span>
            <i></i>
            <span [class.active]="step === 'verify'" [class.done]="stepIndex > 1">2</span>
            <i></i>
            <span [class.active]="step === 'new_password' || step === 'done'" [class.done]="step === 'done'">3</span>
          </div>

          <div class="login-error reset-success" *ngIf="successKey" data-testid="reset-success">
            <i class="bi bi-check-circle"></i>
            {{ successKey | translate }}
          </div>
          <div class="login-error" *ngIf="bannerKey" data-testid="reset-error">
            <i class="bi bi-exclamation-circle"></i>
            {{ bannerKey | translate }}
          </div>

          <form *ngIf="step !== 'done'" (ngSubmit)="onSubmit()" novalidate data-testid="forgot-password-form">
            <div class="erp-form-group">
              <label class="erp-label" for="fp-schoolCode">{{ 'login.schoolCode' | translate }}</label>
              <input
                id="fp-schoolCode"
                type="text"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolCode"
                [(ngModel)]="schoolCode"
                (ngModelChange)="clearField('schoolCode')"
                name="schoolCode"
                maxlength="64"
                erpI18nPh="login.schoolCodePlaceholder"
                [disabled]="step !== 'identify'"
                data-testid="forgot-school-code" />
              <div class="field-error" *ngIf="fieldErrors.schoolCode" role="alert">{{ fieldErrors.schoolCode | translate }}</div>
            </div>

            <div class="erp-form-group">
              <label class="erp-label" for="fp-phone">{{ 'forgotPassword.mobile' | translate }}</label>
              <input
                id="fp-phone"
                type="tel"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.phone"
                [(ngModel)]="phone"
                (ngModelChange)="clearField('phone')"
                name="phone"
                maxlength="40"
                erpI18nPh="forgotPassword.mobilePlaceholder"
                [disabled]="step !== 'identify'"
                autocomplete="tel"
                data-testid="forgot-phone" />
              <div class="field-error" *ngIf="fieldErrors.phone" role="alert">{{ fieldErrors.phone | translate }}</div>
            </div>

            <ng-container *ngIf="step === 'verify' || step === 'new_password'">
              <div class="erp-form-group">
                <label class="erp-label" for="fp-otp">{{ 'login.otp' | translate }}</label>
                <input
                  id="fp-otp"
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
                  [disabled]="step === 'new_password'"
                  autocomplete="one-time-code"
                  data-testid="forgot-otp" />
                <div class="field-error" *ngIf="fieldErrors.otp" role="alert">{{ fieldErrors.otp | translate }}</div>
                <p class="text-muted small mb-0 mt-2" *ngIf="devOtpHint">{{ 'login.devOtpHint' | translate: { code: devOtpHint } }}</p>
                <div class="login-phone-actions">
                  <button type="button" class="btn-link-erp" (click)="restart()">{{ 'forgotPassword.changeMobile' | translate }}</button>
                  <button type="button" class="btn-link-erp" (click)="resendOtp()" [disabled]="resendCountdown > 0 || loading">
                    {{ resendCountdown > 0 ? ('login.resendIn' | translate: { seconds: resendCountdown }) : ('login.resendOtp' | translate) }}
                  </button>
                </div>
              </div>
            </ng-container>

            <ng-container *ngIf="step === 'new_password'">
              <div class="erp-form-group">
                <label class="erp-label" for="fp-password">{{ 'forgotPassword.newPassword' | translate }}</label>
                <input
                  id="fp-password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="erp-input"
                  [class.erp-input--error]="!!fieldErrors.password"
                  [(ngModel)]="password"
                  (ngModelChange)="clearField('password')"
                  name="password"
                  erpI18nPh="forgotPassword.newPasswordPlaceholder"
                  autocomplete="new-password"
                  data-testid="forgot-new-password" />
                <div class="field-error" *ngIf="fieldErrors.password" role="alert">{{ fieldErrors.password | translate: { min: 8, max: 128 } }}</div>
              </div>
              <div class="erp-form-group">
                <label class="erp-label" for="fp-confirm">{{ 'forgotPassword.confirmPassword' | translate }}</label>
                <input
                  id="fp-confirm"
                  [type]="showPassword ? 'text' : 'password'"
                  class="erp-input"
                  [class.erp-input--error]="!!fieldErrors.confirmPassword"
                  [(ngModel)]="confirmPassword"
                  (ngModelChange)="clearField('confirmPassword')"
                  name="confirmPassword"
                  erpI18nPh="forgotPassword.confirmPasswordPlaceholder"
                  autocomplete="new-password"
                  data-testid="forgot-confirm-password" />
                <div class="field-error" *ngIf="fieldErrors.confirmPassword" role="alert">{{ fieldErrors.confirmPassword | translate }}</div>
                <button type="button" class="btn-link-erp mt-2" (click)="showPassword = !showPassword">
                  {{ (showPassword ? 'forgotPassword.hidePassword' : 'forgotPassword.showPassword') | translate }}
                </button>
              </div>
            </ng-container>

            <div class="erp-form-group login-lang-row" *ngIf="step === 'identify'">
              <label class="erp-label" for="fp-lang">{{ 'login.appLanguage' | translate }}</label>
              <select id="fp-lang" class="erp-select login-lang-select" name="uiLang" [(ngModel)]="selectedUiLang" (ngModelChange)="onLangPreview($event)">
                <option *ngFor="let o of userLocale.supported" [value]="o.code">{{ o.nativeLabel }}</option>
              </select>
            </div>

            <button type="submit" class="btn-primary-erp reset-primary" [disabled]="loading" data-testid="forgot-submit">
              <span class="spinner" *ngIf="loading"></span>
              {{ submitLabel | translate }}
            </button>
          </form>

          <div *ngIf="step === 'done'" class="reset-done" data-testid="forgot-done">
            <div class="reset-done__icon"><i class="bi bi-shield-check"></i></div>
            <h3>{{ 'forgotPassword.doneTitle' | translate }}</h3>
            <p>{{ 'forgotPassword.doneLead' | translate }}</p>
            <a routerLink="/login" class="btn-primary-erp reset-primary">{{ 'forgotPassword.loginNow' | translate }}</a>
          </div>
        </div>
      </div>
      <div class="login-right">
        <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png" alt="">
        <div class="login-right-overlay">
          <div class="login-right-text" lang="en" dir="ltr">
            <h2>{{ 'forgotPassword.heroTitle' | translate }}</h2>
            <p>{{ 'forgotPassword.heroSubtitle' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-shell { max-width: 500px; }
    .reset-back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px; color: var(--clr-primary); font-weight: 700; text-decoration: none; }
    .reset-logo { margin-bottom: 18px; }
    .reset-kicker { color: var(--clr-accent); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
    .reset-steps { display: flex; align-items: center; gap: 8px; margin: 18px 0 20px; }
    .reset-steps span { width: 30px; height: 30px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--clr-border); color: var(--clr-text-muted); font-weight: 800; background: var(--clr-surface); }
    .reset-steps span.active, .reset-steps span.done { background: var(--clr-primary); border-color: var(--clr-primary); color: #fff; }
    .reset-steps i { flex: 1; height: 1px; background: var(--clr-border-light); }
    .reset-success { background: rgba(22, 163, 74, 0.1); border-color: rgba(22, 163, 74, 0.2); color: #166534; }
    .reset-primary { width: 100%; justify-content: center; padding: 12px; }
    .reset-done { text-align: center; padding-top: 10px; }
    .reset-done__icon { width: 64px; height: 64px; border-radius: 22px; margin: 0 auto 18px; display: grid; place-items: center; color: var(--clr-primary); background: color-mix(in srgb, var(--clr-primary) 10%, var(--clr-surface)); font-size: 30px; }
    .reset-done h3 { font-family: var(--font-heading); font-weight: 800; font-size: 20px; margin-bottom: 8px; }
    .reset-done p { color: var(--clr-text-secondary); line-height: 1.6; margin-bottom: 20px; }
    .login-lang-select { width: 100%; font-weight: 600; }
  `]
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  step: ResetStep = 'identify';
  schoolCode = '';
  phone = '';
  otp = '';
  password = '';
  confirmPassword = '';
  verificationToken = '';
  devOtpHint = '';
  selectedUiLang: UiLanguage = 'en';
  fieldErrors: FieldErrors<LoginField> = {};
  bannerKey = '';
  successKey = '';
  loading = false;
  showPassword = false;
  resendCountdown = 0;
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private authService: AuthService, private router: Router, readonly userLocale: UserLocaleService) {}

  get stepIndex(): number {
    return this.step === 'identify' ? 0 : this.step === 'verify' ? 1 : this.step === 'new_password' ? 2 : 3;
  }

  get submitLabel(): string {
    if (this.step === 'identify') return this.loading ? 'login.sendingOtp' : 'forgotPassword.sendResetOtp';
    if (this.step === 'verify') return this.loading ? 'login.verifying' : 'forgotPassword.verifyOtp';
    return this.loading ? 'forgotPassword.resetting' : 'forgotPassword.resetPassword';
  }

  ngOnInit(): void {
    this.selectedUiLang = this.userLocale.readStored();
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  onLangPreview(code: string): void {
    this.userLocale.useUiLanguage(code === 'hi' ? 'hi' : 'en').subscribe({ error: () => void 0 });
  }

  clearField(field: LoginField): void {
    if (!this.fieldErrors[field]) return;
    const next = { ...this.fieldErrors };
    delete next[field];
    this.fieldErrors = next;
  }

  onSubmit(): void {
    if (this.step === 'identify') this.sendOtp();
    else if (this.step === 'verify') this.verifyOtp();
    else this.completeReset();
  }

  sendOtp(): void {
    this.bannerKey = '';
    this.successKey = '';
    this.fieldErrors = validatePasswordResetStart({ schoolCode: this.schoolCode, phone: this.phone });
    if (Object.keys(this.fieldErrors).length) return;
    this.loading = true;
    this.authService.sendPasswordResetOtp({
      schoolCode: this.schoolCode.trim().toUpperCase(),
      phone: this.phone.trim(),
      purpose: 'PASSWORD_RESET',
      channel: 'SMS',
    }).subscribe({
      next: res => {
        this.loading = false;
        if (!res.success) {
          this.bannerKey = 'forgotPassword.errorSend';
          this.startResendCountdown(res.canRetryAfterSeconds ?? 60);
          return;
        }
        this.step = 'verify';
        this.devOtpHint = res.devOtpCode ?? '';
        this.successKey = 'forgotPassword.otpSent';
        this.startResendCountdown(res.canRetryAfterSeconds ?? 60);
      },
      error: () => {
        this.loading = false;
        this.bannerKey = 'forgotPassword.errorSend';
      }
    });
  }

  verifyOtp(): void {
    this.bannerKey = '';
    this.successKey = '';
    this.fieldErrors = validatePasswordResetVerify({ schoolCode: this.schoolCode, phone: this.phone, otp: this.otp });
    if (Object.keys(this.fieldErrors).length) return;
    this.loading = true;
    this.authService.verifyPasswordResetOtp({
      schoolCode: this.schoolCode.trim().toUpperCase(),
      phone: this.phone.trim(),
      otpCode: this.otp.trim(),
      purpose: 'PASSWORD_RESET',
    }).subscribe({
      next: res => {
        this.loading = false;
        if (!res.verified || !res.verificationToken) {
          this.fieldErrors = { otp: 'login.validation.otpMismatch' };
          return;
        }
        this.verificationToken = res.verificationToken;
        this.step = 'new_password';
        this.successKey = 'forgotPassword.otpVerified';
      },
      error: () => {
        this.loading = false;
        this.bannerKey = 'forgotPassword.errorVerify';
      }
    });
  }

  completeReset(): void {
    this.bannerKey = '';
    this.successKey = '';
    this.fieldErrors = validatePasswordResetComplete({
      schoolCode: this.schoolCode,
      phone: this.phone,
      otp: this.otp,
      password: this.password,
      confirmPassword: this.confirmPassword,
    });
    if (Object.keys(this.fieldErrors).length) return;
    this.loading = true;
    this.authService.resetPassword({
      schoolCode: this.schoolCode.trim().toUpperCase(),
      phone: this.phone.trim(),
      verificationToken: this.verificationToken,
      newPassword: this.password,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.clearResendTimer();
        this.step = 'done';
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: () => {
        this.loading = false;
        this.bannerKey = 'forgotPassword.errorReset';
      }
    });
  }

  resendOtp(): void {
    if (this.resendCountdown > 0 || this.loading) return;
    this.sendOtp();
  }

  restart(): void {
    this.step = 'identify';
    this.otp = '';
    this.password = '';
    this.confirmPassword = '';
    this.verificationToken = '';
    this.devOtpHint = '';
    this.bannerKey = '';
    this.successKey = '';
    this.fieldErrors = {};
    this.clearResendTimer();
    this.resendCountdown = 0;
  }

  private startResendCountdown(seconds: number): void {
    this.clearResendTimer();
    this.resendCountdown = Math.max(0, Math.floor(seconds));
    if (this.resendCountdown <= 0) return;
    this.resendTimer = setInterval(() => {
      this.resendCountdown -= 1;
      if (this.resendCountdown <= 0) this.clearResendTimer();
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer != null) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
