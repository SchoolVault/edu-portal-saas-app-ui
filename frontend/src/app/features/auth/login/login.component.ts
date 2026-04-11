import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import type { FieldErrors } from '../../../core/validation';
import { type LoginField, validateLoginForm } from '../../../core/validation';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container" data-testid="login-page">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="SchoolVault">
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-subtitle">Sign in to your school management portal</p>

          <div class="login-error" *ngIf="error" data-testid="login-error">
            <i class="bi bi-exclamation-circle"></i>
            {{ error }}
          </div>

          <form (ngSubmit)="onLogin()" novalidate data-testid="login-form">
            <div class="erp-form-group">
              <label class="erp-label" for="lg-schoolCode">School code</label>
              <input
                id="lg-schoolCode"
                type="text"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.schoolCode"
                [(ngModel)]="schoolCode"
                (ngModelChange)="clearField('schoolCode')"
                name="schoolCode"
                maxlength="64"
                placeholder="Enter school code (e.g., SCH001)"
                [attr.aria-invalid]="!!fieldErrors.schoolCode"
                [attr.aria-describedby]="fieldErrors.schoolCode ? 'lg-err-schoolCode' : null"
                data-testid="login-school-code"
                autocomplete="username" />
              <div id="lg-err-schoolCode" class="field-error" *ngIf="fieldErrors.schoolCode" role="alert">{{ fieldErrors.schoolCode }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="lg-email">Email address</label>
              <input
                id="lg-email"
                type="email"
                class="erp-input"
                [class.erp-input--error]="!!fieldErrors.email"
                [(ngModel)]="email"
                (ngModelChange)="clearField('email')"
                name="email"
                maxlength="254"
                placeholder="Enter your email"
                [attr.aria-invalid]="!!fieldErrors.email"
                [attr.aria-describedby]="fieldErrors.email ? 'lg-err-email' : null"
                data-testid="login-email"
                autocomplete="email" />
              <div id="lg-err-email" class="field-error" *ngIf="fieldErrors.email" role="alert">{{ fieldErrors.email }}</div>
            </div>
            <div class="erp-form-group">
              <label class="erp-label" for="lg-password">Password</label>
              <div style="position: relative;">
                <input
                  id="lg-password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="erp-input"
                  [class.erp-input--error]="!!fieldErrors.password"
                  [(ngModel)]="password"
                  (ngModelChange)="clearField('password')"
                  name="password"
                  placeholder="Enter your password"
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
              <div id="lg-err-password" class="field-error" *ngIf="fieldErrors.password" role="alert">{{ fieldErrors.password }}</div>
            </div>
            <button type="submit" class="btn-primary-erp" style="width: 100%; justify-content: center; padding: 12px;"
                    [disabled]="loading" data-testid="login-submit-button">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="demo-credentials" data-testid="demo-credentials">
            <h4>Demo Credentials</h4>
            <p>
              <strong>School Code:</strong> SCH001<br>
              <strong>Admin:</strong> admin&#64;school.com / admin123<br>
              <strong>Teacher:</strong> teacher&#64;school.com / teacher123<br>
              <strong>Parent:</strong> parent&#64;school.com / parent123<br>
              <strong>Super Admin:</strong> superadmin&#64;schoolvault.com / super123 / PLATFORM
            </p>
          </div>

          <div class="auth-marketing-band login-marketing-band">
            <div class="auth-testimonials login-testimonials">
              <h4>Trusted by modern schools</h4>
              <div class="auth-quote">
                <p>“Rollout was calm and predictable — finance, academics, and parents are finally aligned on one timeline.”</p>
                <div class="auth-quote-meta">Meera Shah · CFO, Lakeside Academy Trust</div>
              </div>
              <div class="auth-quote auth-quote-compact">
                <p>“We evaluated SchoolMint-level suites; SchoolVault gave us the same depth with APIs we actually own.”</p>
                <div class="auth-quote-meta">Oliver Grant · Head of Technology, Harborview Schools</div>
              </div>
            </div>
            <div class="auth-contact-card">
              <h4>Platform &amp; demos</h4>
              <p class="small text-muted mb-2">Guided walkthrough, RFP pack, or enterprise terms — we respond within one business day.</p>
              <div class="auth-contact-row"><i class="bi bi-envelope"></i> <a href="mailto:hello&#64;schoolvault.com">hello&#64;schoolvault.com</a></div>
              <div class="auth-contact-row"><i class="bi bi-telephone"></i> +1 (512) 555-0140</div>
            </div>
          </div>

          <p style="margin-top: 16px; font-size: 13px;">
            New school?
            <a routerLink="/signup">Create a workspace</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png" alt="">
        <div class="login-right-overlay">
          <div class="login-right-text">
            <h2>Enterprise School Management</h2>
            <p>Manage admissions, academics, fees, attendance and more - all from one unified platform designed for modern educational institutions.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-marketing-band {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--clr-border);
        display: grid;
        gap: 14px;
        align-items: start;
      }
      @media (min-width: 560px) {
        .login-marketing-band { grid-template-columns: 1fr 1fr; }
      }
      .login-testimonials { margin-top: 0; padding-top: 0; border-top: none; }
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
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  schoolCode = '';
  fieldErrors: FieldErrors<LoginField> = {};
  error = '';
  loading = false;
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService
      .ensureValidSession()
      .pipe(take(1))
      .subscribe(ok => {
        if (!ok) {
          return;
        }
        const role = this.authService.getRole();
        this.router.navigate([role === 'parent' ? '/app/parent' : role === 'super_admin' ? '/app/super-admin' : '/app/dashboard']);
      });
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
    this.error = '';
    this.fieldErrors = {};
    const errs = validateLoginForm({ email: this.email, password: this.password, schoolCode: this.schoolCode });
    if (Object.keys(errs).length > 0) {
      this.fieldErrors = errs;
      return;
    }
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password, schoolCode: this.schoolCode }).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate([
          response.user.role === 'parent'
            ? '/app/parent'
            : response.user.role === 'super_admin'
              ? '/app/super-admin'
              : '/app/dashboard'
        ]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
