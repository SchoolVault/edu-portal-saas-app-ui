import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

function extractHttpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body && typeof (body as { message: unknown }).message === 'string') {
      return (body as { message: string }).message;
    }
    return err.statusText || err.message || '';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return '';
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="login-container" data-testid="verify-email-page">
      <div class="login-left">
        <div class="login-form-wrapper reset-shell animate-in">
          <a routerLink="/login" class="reset-back-link"
            ><i class="bi bi-arrow-left"></i> {{ 'verifyEmail.backLogin' | translate }}</a
          >
          <div class="login-logo reset-logo">
            <img
              src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png"
              alt=""
            />
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">{{ 'verifyEmail.title' | translate }}</h2>
          <p class="login-subtitle">{{ 'verifyEmail.subtitle' | translate }}</p>

          <div class="login-error reset-success" *ngIf="state === 'success'">
            <i class="bi bi-check-circle"></i> {{ 'verifyEmail.success' | translate }}
          </div>
          <div class="login-error" *ngIf="state === 'error'">
            <i class="bi bi-exclamation-circle"></i> {{ errorMessage || ('verifyEmail.errGeneric' | translate) }}
          </div>
          <div class="login-error" *ngIf="state === 'missing'">
            <i class="bi bi-exclamation-circle"></i> {{ 'verifyEmail.errMissingToken' | translate }}
          </div>
          <div *ngIf="state === 'loading'" class="text-muted small py-3">
            <span class="spinner me-2"></span>{{ 'verifyEmail.loading' | translate }}
          </div>

          <div class="d-flex flex-wrap gap-2 mt-3" *ngIf="state === 'success' || state === 'error' || state === 'missing'">
            <a routerLink="/login" class="btn-primary-erp text-decoration-none">{{ 'verifyEmail.goLogin' | translate }}</a>
            <a routerLink="/app/dashboard" class="btn-outline-erp text-decoration-none" *ngIf="state === 'success'">{{
              'verifyEmail.goApp' | translate
            }}</a>
          </div>
        </div>
      </div>
      <div class="login-right">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png"
          alt=""
        />
        <div class="login-right-overlay">
          <div class="login-right-text" lang="en" dir="ltr">
            <h2>{{ 'verifyEmail.heroTitle' | translate }}</h2>
            <p>{{ 'verifyEmail.heroSubtitle' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .reset-shell {
        max-width: 480px;
      }
      .reset-back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        color: var(--clr-primary);
        font-weight: 700;
        text-decoration: none;
      }
      .reset-logo {
        margin-bottom: 18px;
      }
      .reset-success {
        background: rgba(22, 163, 74, 0.1);
        border-color: rgba(22, 163, 74, 0.2);
        color: #166534;
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit {
  state: 'loading' | 'success' | 'error' | 'missing' = 'loading';
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    const token = (this.route.snapshot.queryParamMap.get('token') || '').trim();
    if (!token) {
      this.state = 'missing';
      return;
    }
    this.auth.confirmEmailVerification(token).subscribe({
      next: () => {
        this.state = 'success';
      },
      error: (e: unknown) => {
        this.state = 'error';
        const msg = extractHttpErrorMessage(e);
        this.errorMessage = msg || this.translate.instant('verifyEmail.errGeneric');
      },
    });
  }
}
