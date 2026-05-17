import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketingService } from '../../../core/services/marketing.service';
import { MarketingSeoService } from '../../../core/services/marketing-seo.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-marketing-request-demo-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <sv-header />
    <section class="sv-section">
      <div class="sv-container" style="display:grid; grid-template-columns:1fr 1.2fr; gap:56px; align-items:start">
        <div>
          <span class="sv-eyebrow">Request a Demo</span>
          <h1 style="margin-top:10px">See SchoolVault live, for your school.</h1>
          <p class="sv-muted" style="margin-top:16px; line-height:1.8">Get a guided walkthrough tailored to your school scale and process maturity.</p>
          <ul style="line-height:2; margin-top:20px; padding-left:18px">
            <li>Tailored walkthrough of relevant modules</li>
            <li>Implementation plan and migration discussion</li>
            <li>Pricing appropriate to your context</li>
            <li>No pressure - we respect your time</li>
          </ul>
        </div>
        <form class="sv-form sv-card" [formGroup]="form" (ngSubmit)="submit()">
          <h3 style="margin-top:0">Tell us about your school</h3>
          <div class="row g-3">
            <div class="col-md-6"><label>Full name</label><input class="form-control" formControlName="fullName" /></div>
            <div class="col-md-6"><label>Work email</label><input type="email" class="form-control" formControlName="workEmail" /></div>
            <div class="col-md-6"><label>Phone</label><input class="form-control" formControlName="phone" /></div>
            <div class="col-md-6"><label>School name</label><input class="form-control" formControlName="schoolName" /></div>
            <div class="col-12"><label>Message</label><textarea rows="4" class="form-control" formControlName="message"></textarea></div>
            <div class="col-12">
              <label style="display:flex; gap:10px; align-items:flex-start; font-weight:400">
                <input id="consent" type="checkbox" formControlName="privacyConsent" />
                <span class="sv-muted">I agree to privacy policy and follow-up communication.</span>
              </label>
            </div>
          </div>
          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap">
            <button class="sv-btn sv-btn-primary" type="submit" [disabled]="submitting || form.invalid">{{ submitting ? 'Sending...' : 'Submit' }}</button>
            <a class="sv-btn sv-btn-ghost" routerLink="/login">Go to Login</a>
          </div>
          <div class="lead-success-msg" *ngIf="leadReference">
            <strong>Thank you! Your demo request has been submitted.</strong>
            <span>Our team will reach out shortly with next steps.</span>
            <small>Reference ID: {{ leadReference }}</small>
          </div>
        </form>
      </div>
    </section>
    <sv-footer />
  `,
  styles: [`
    :host {
      --sv-primary: var(--clr-primary);
      --sv-primary-light: var(--clr-primary-light);
      --sv-accent: var(--clr-accent);
      --sv-accent-dark: var(--clr-accent-dark);
      --sv-bg: var(--clr-bg);
      --sv-surface: var(--clr-surface);
      --sv-ink: var(--clr-text);
      --sv-muted: var(--clr-text-secondary);
      --sv-border: var(--clr-border);
      --sv-radius: 12px;
      --sv-radius-lg: 16px;
      --sv-shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.04), 0 1px 3px rgba(28, 25, 23, 0.06);
      --sv-shadow: 0 4px 14px rgba(28, 25, 23, 0.06), 0 2px 6px rgba(28, 25, 23, 0.04);
      --sv-font-heading: 'Fraunces', 'Avenir Next', 'Iowan Old Style', Georgia, serif;
      --sv-font-body: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
      display: block;
      background: var(--sv-bg);
      color: var(--sv-ink);
      font-family: var(--sv-font-body);
    }
    .sv-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0 clamp(14px, 2.2vw, 32px); }
    .sv-section { padding: clamp(42px, 6.8vw, 78px) 0; }
    h1, h3 { font-family: var(--sv-font-heading); color: var(--sv-ink); letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
    h1 { font-weight: 700; font-size: clamp(2.25rem, 4.5vw, 3.5rem); }
    h3 { font-weight: 600; font-size: 1.375rem; }
    .sv-muted { color: var(--sv-muted); }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 600; color: var(--sv-accent); }
    .sv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.95rem; border: 1px solid transparent; cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease, transform .15s ease; text-decoration: none; }
    .sv-btn-primary { background: var(--sv-accent); color: #fff; }
    .sv-btn-primary:hover { background: var(--sv-accent-dark); color: #fff; transform: translateY(-1px); text-decoration: none; }
    .sv-btn-ghost { background: transparent; color: var(--sv-primary); border-color: var(--sv-border); }
    .sv-btn-ghost:hover { background: var(--sv-surface); border-color: var(--sv-primary); text-decoration: none; }
    .sv-card { background: var(--sv-surface); border: 1px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 22px; box-shadow: var(--sv-shadow-sm); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
    .sv-card:hover { box-shadow: var(--sv-shadow); border-color: #d6d3d1; transform: translateY(-2px); }
    .sv-form label { display: block; font-weight: 500; margin-bottom: 6px; color: var(--sv-ink); font-size: 0.95rem; }
    .sv-form .form-control, .sv-form textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--sv-border); border-radius: var(--sv-radius); background: var(--sv-surface); color: var(--sv-ink); font-family: inherit; font-size: 1rem; }
    .sv-form .form-control:focus, .sv-form textarea:focus { outline: none; border-color: var(--sv-primary); box-shadow: 0 0 0 3px rgba(27, 58, 48, 0.12); }
    .lead-success-msg {
      margin-top: 14px;
      padding: 12px 14px;
      border: 1px solid color-mix(in srgb, var(--sv-primary) 26%, var(--sv-border));
      background: color-mix(in srgb, var(--sv-primary) 7%, var(--sv-surface));
      border-radius: 12px;
      color: var(--sv-ink);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: .92rem;
    }
    .lead-success-msg small { color: var(--sv-muted); }
    @media (max-width: 820px) {
      .sv-container[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-section { padding: 34px 0; }
      .sv-card { padding: 18px; }
      .sv-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class MarketingRequestDemoPageComponent {
  private readonly fb = inject(FormBuilder);
  submitting = false;
  leadReference = '';

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    workEmail: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    phone: ['', [Validators.maxLength(30)]],
    schoolName: ['', [Validators.maxLength(180)]],
    message: ['', [Validators.maxLength(2000)]],
    privacyConsent: [false, Validators.requiredTrue]
  });

  constructor(
    private readonly marketing: MarketingService,
    private readonly seo: MarketingSeoService
  ) {
    this.seo.apply({
      title: 'Request Demo - EduPortal School ERP',
      description: 'Request a tailored EduPortal demo and rollout consultation for your institution.',
      canonicalPath: '/request-demo'
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      return;
    }
    this.submitting = true;
    const v = this.form.getRawValue();
    this.marketing.submitLead({
      fullName: v.fullName ?? '',
      workEmail: v.workEmail ?? '',
      phone: v.phone ?? '',
      schoolName: v.schoolName ?? '',
      message: v.message ?? '',
      source: 'DEMO',
      pagePath: '/request-demo',
      privacyConsent: Boolean(v.privacyConsent),
      marketingConsent: true
    }).subscribe({
      next: lead => {
        this.leadReference = lead.reference;
        this.form.reset({ privacyConsent: false });
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}
