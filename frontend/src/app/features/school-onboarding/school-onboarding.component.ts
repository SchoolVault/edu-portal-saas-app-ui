import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Guided sequence for new schools: academic year → classes → people data — aligns with bulk import APIs.
 */
@Component({
  selector: 'app-school-onboarding',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="so-page" data-testid="school-onboarding-page">
      <div class="so-hero erp-card mb-4 p-4">
        <h1 class="so-title mb-2">{{ 'schoolOnboarding.pageTitle' | translate }}</h1>
        <p class="text-muted mb-0 small">{{ 'schoolOnboarding.lead' | translate }}</p>
      </div>

      <div class="row g-3">
        <div class="col-12 col-md-6 col-xl-3" *ngFor="let step of steps; let i = index">
          <div class="so-step h-100">
            <div class="so-step-num">{{ i + 1 }}</div>
            <h3 class="so-step-title">{{ step.titleKey | translate }}</h3>
            <p class="so-step-body small text-muted mb-3">{{ step.bodyKey | translate }}</p>
            <a [routerLink]="step.route" class="btn btn-sm btn-outline-erp">{{ 'schoolOnboarding.open' | translate }}</a>
          </div>
        </div>
      </div>

      <div class="erp-card mt-4 p-3">
        <p class="small text-muted mb-0">{{ 'schoolOnboarding.footerHint' | translate }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .so-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 0.25rem;
      }
      @media (min-width: 576px) {
        .so-page {
          padding: 0;
        }
      }
      .so-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--clr-text);
      }
      @media (max-width: 575.98px) {
        .so-title {
          font-size: 1.25rem;
        }
        .so-hero {
          padding: 1rem !important;
        }
      }
      .so-hero {
        border-radius: 14px;
        border: 1px solid var(--clr-border);
      }
      .so-step {
        border-radius: 14px;
        border: 1px solid var(--clr-border);
        background: var(--clr-surface);
        padding: 1.25rem;
        position: relative;
      }
      .so-step-num {
        position: absolute;
        top: 0.75rem;
        right: 0.85rem;
        font-weight: 800;
        font-size: 0.75rem;
        color: var(--clr-text-muted);
        opacity: 0.7;
      }
      .so-step-title {
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        padding-right: 2rem;
      }
      .so-step-body {
        line-height: 1.45;
      }
    `,
  ],
})
export class SchoolOnboardingComponent {
  readonly steps = [
    {
      titleKey: 'schoolOnboarding.step1Title',
      bodyKey: 'schoolOnboarding.step1Body',
      route: '/app/academic',
    },
    {
      titleKey: 'schoolOnboarding.step2Title',
      bodyKey: 'schoolOnboarding.step2Body',
      route: '/app/academic',
    },
    {
      titleKey: 'schoolOnboarding.step3Title',
      bodyKey: 'schoolOnboarding.step3Body',
      route: '/app/import-export',
    },
    {
      titleKey: 'schoolOnboarding.step4Title',
      bodyKey: 'schoolOnboarding.step4Body',
      route: '/app/settings',
    },
  ];
}
