import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketingFeature, MarketingService, MarketingTestimonial } from '../../../core/services/marketing.service';
import { MarketingSeoService } from '../../../core/services/marketing-seo.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { HeroComponent } from '../shared/components/hero/hero.component';
import { FeatureCardComponent } from '../shared/components/feature-card/feature-card.component';
import { TestimonialCardComponent } from '../shared/components/testimonial-card/testimonial-card.component';
import { CtaBandComponent } from '../shared/components/cta-band/cta-band.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

interface ValuePillar {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
}

@Component({
  selector: 'app-marketing-landing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderComponent,
    HeroComponent,
    FeatureCardComponent,
    TestimonialCardComponent,
    CtaBandComponent,
    FooterComponent
  ],
  template: `
    <sv-header />
    <sv-hero
      title="Bring Calm to Daily Operations and Confidence to Growth — with SchoolVault"
      subtitle="Drive admissions growth, academic excellence, fee discipline, payroll accuracy, and parent trust from one secure, leadership-ready platform."
    />

    <section class="sv-tagline-band">
      <div class="sv-container">
        <p class="sv-tagline-impact">
          <span class="tag-pill"><strong>Smart</strong></span>
          <span class="tag-pill"><strong>Simple</strong></span>
          <span class="tag-pill"><strong>Secure</strong></span>
        </p>
      </div>
    </section>

    <section class="sv-trust-row">
      <div class="sv-container trust-grid">
        <article class="trust-item trust-item--1">
          <h3>120+</h3>
          <p>Schools onboarded</p>
        </article>
        <article class="trust-item trust-item--2">
          <h3>3.5L+</h3>
          <p>Students managed</p>
        </article>
        <article class="trust-item trust-item--3">
          <h3>99.9%</h3>
          <p>Platform uptime</p>
        </article>
        <article class="trust-item trust-item--4">
          <h3>24x7</h3>
          <p>Support and onboarding</p>
        </article>
      </div>
    </section>

    <section class="sv-section" style="padding-top: 22px;">
      <div class="sv-container">
        <span class="sv-eyebrow">Why it works</span>
        <h2 style="margin-top:10px">See your role-specific value instantly</h2>
        <p class="sv-muted" style="margin-top:12px; max-width:720px">
          Choose your perspective to quickly understand how SchoolVault helps owners, principals, and operations teams.
        </p>
        <div class="pillar-tabs">
          <button
            type="button"
            class="sv-btn"
            *ngFor="let pillar of valuePillars"
            [class.sv-btn-secondary]="activePillarId() === pillar.id"
            [class.sv-btn-ghost]="activePillarId() !== pillar.id"
            (click)="activePillarId.set(pillar.id)"
          >
            {{ pillar.label }}
          </button>
        </div>
        <div class="pillar-panel">
          <h3>{{ activePillar().title }}</h3>
          <p class="sv-muted" style="margin-top:10px">{{ activePillar().description }}</p>
          <ul class="pillar-bullets">
            <li *ngFor="let bullet of activePillar().bullets">{{ bullet }}</li>
          </ul>
          <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap">
            <a class="sv-btn sv-btn-primary" routerLink="/request-demo">Book a guided walkthrough</a>
            <a class="sv-btn sv-btn-ghost" routerLink="/features">Explore all modules</a>
          </div>
        </div>
      </div>
    </section>

    <section class="sv-section" style="background:var(--sv-surface); border-top:1px solid var(--sv-border); border-bottom:1px solid var(--sv-border)">
      <div class="sv-container">
        <span class="sv-eyebrow">Modules</span>
        <div class="feature-section-head">
          <h2 style="margin-top:10px">Platform Features</h2>
          <div class="feature-nav-btns">
            <button type="button" class="sv-btn sv-btn-ghost" (click)="scrollFeatureRail(-1)">← Prev</button>
            <button type="button" class="sv-btn sv-btn-ghost" (click)="scrollFeatureRail(1)">Next →</button>
          </div>
        </div>
        <div class="feature-rail" #featureRail>
          <div class="feature-rail-item" *ngFor="let feature of features()">
            <sv-feature-card [feature]="feature" />
          </div>
        </div>
        <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap">
          <a class="sv-btn sv-btn-ghost" routerLink="/features">View all features</a>
          <a class="sv-btn sv-btn-ghost" routerLink="/testimonials">Read testimonials</a>
        </div>
      </div>
    </section>

    <section class="sv-section">
      <div class="sv-container">
        <span class="sv-eyebrow">Loved by school leaders</span>
        <h2 style="margin-top:10px">Trusted by School Leaders</h2>
        <div class="sv-grid" style="margin-top:28px">
          <sv-testimonial-card *ngFor="let testimonial of testimonials()" [t]="testimonial" />
        </div>
      </div>
    </section>

    <section class="sv-section">
      <div class="sv-container">
        <span class="sv-eyebrow">Why SchoolVault</span>
        <h2 style="margin-top:10px">Built for real school operations</h2>
        <div class="benefit-grid">
          <article class="benefit-card">
            <h3>Fast implementation</h3>
            <p class="sv-muted">Go live in phases with guided data migration, role-wise training, and zero operational disruption.</p>
          </article>
          <article class="benefit-card">
            <h3>Owner-level visibility</h3>
            <p class="sv-muted">Get live health dashboards for admissions, academics, fees, and operations across all campuses.</p>
          </article>
          <article class="benefit-card">
            <h3>Parent trust and retention</h3>
            <p class="sv-muted">Better communication, timely updates, and consistent service quality improve parent experience.</p>
          </article>
        </div>
      </div>
    </section>

    <section id="request-callback" class="sv-section" style="background:var(--sv-surface); border-top:1px solid var(--sv-border)">
      <div class="sv-container" style="display:grid; grid-template-columns:1fr 1.2fr; gap:56px; align-items:start">
          <div>
            <span class="sv-eyebrow">Request a Demo</span>
            <h2>Request a callback</h2>
            <p class="sv-muted">
              Share your details and our team will help you evaluate the right EduPortal rollout plan.
            </p>
          </div>
          <form class="sv-form sv-card" [formGroup]="leadForm" (ngSubmit)="submitLead()">
              <div class="row g-3">
                <div class="col-md-6">
                  <label>Full name</label>
                  <input class="form-control" formControlName="fullName" />
                </div>
                <div class="col-md-6">
                  <label>Work email</label>
                  <input class="form-control" type="email" formControlName="workEmail" />
                </div>
                <div class="col-md-6">
                  <label>Phone</label>
                  <input class="form-control" formControlName="phone" />
                </div>
                <div class="col-md-6">
                  <label>School name</label>
                  <input class="form-control" formControlName="schoolName" />
                </div>
                <div class="col-12">
                  <label>Message</label>
                  <textarea class="form-control" rows="3" formControlName="message"></textarea>
                </div>
                <div class="col-12">
                  <label style="display:flex; gap:10px; align-items:flex-start; font-weight:400">
                    <input id="privacyConsent" type="checkbox" formControlName="privacyConsent" />
                    <span class="sv-muted">I agree to the privacy policy</span>
                  </label>
                </div>
              </div>
              <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap">
                <button class="sv-btn sv-btn-primary" type="submit" [disabled]="submitting() || leadForm.invalid">
                  {{ submitting() ? 'Submitting...' : 'Submit Lead' }}
                </button>
                <a class="sv-btn sv-btn-ghost" routerLink="/login">Login Instead</a>
              </div>
              <div class="lead-success-msg" *ngIf="leadReference()">
                <strong>Thank you! Your request has been received.</strong>
                <span>Our team will contact you within one business day.</span>
                <small>Reference ID: {{ leadReference() }}</small>
              </div>
          </form>
      </div>
    </section>
    <sv-cta-band />
    <sv-footer />
  `,
  styles: [`
    :host {
      --sv-primary: var(--clr-primary);
      --sv-primary-light: var(--clr-primary-light);
      --sv-primary-dark: var(--clr-primary-dark);
      --sv-accent: var(--clr-accent);
      --sv-accent-dark: var(--clr-accent-dark);
      --sv-bg: var(--clr-bg);
      --sv-surface: var(--clr-surface);
      --sv-ink: var(--clr-text);
      --sv-muted: var(--clr-text-secondary);
      --sv-border: var(--clr-border);
      --sv-radius: 12px;
      --sv-radius-lg: 16px;
      --sv-radius-2xl: 24px;
      --sv-shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.04), 0 1px 3px rgba(28, 25, 23, 0.06);
      --sv-shadow: 0 4px 14px rgba(28, 25, 23, 0.06), 0 2px 6px rgba(28, 25, 23, 0.04);
      --sv-shadow-lg: 0 18px 40px rgba(18, 42, 34, 0.12), 0 6px 16px rgba(18, 42, 34, 0.08);
      --sv-font-heading: 'Fraunces', 'Avenir Next', 'Iowan Old Style', Georgia, serif;
      --sv-font-body: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
      display: block;
      background: var(--sv-bg);
      color: var(--sv-ink);
      font-family: var(--sv-font-body);
    }
    .sv-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
    .sv-section { padding: clamp(56px, 9vw, 112px) 0; }
    .sv-tagline-band { padding: 6px 0 24px; }
    .sv-tagline-impact {
      margin: 0;
      width: 100%;
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      font-family: var(--sv-font-heading);
      font-size: clamp(1rem, 1.9vw, 1.2rem);
      font-weight: 600;
      color: var(--sv-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-align: center;
      padding: 12px 0 0;
    }
    .tag-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 124px;
      padding: 8px 18px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--sv-primary) 26%, var(--sv-border));
      background: linear-gradient(
        150deg,
        color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%) 0%,
        color-mix(in srgb, var(--sv-surface) 84%, var(--sv-primary) 16%) 100%
      );
      box-shadow: var(--sv-shadow-sm);
    }
    .tag-pill strong {
      color: var(--sv-primary);
      font-weight: 700;
    }
    .sv-trust-row { padding: 0 0 26px; }
    .trust-grid { display:grid; gap:14px; grid-template-columns: repeat(4, minmax(160px, 1fr)); }
    .trust-item {
      background: linear-gradient(
        150deg,
        var(--sv-surface) 0%,
        color-mix(in srgb, var(--sv-primary) 5%, var(--sv-surface)) 100%
      );
      border:1px solid var(--sv-border);
      border-radius:16px;
      padding:16px 18px;
      text-align:center;
      box-shadow: var(--sv-shadow-sm);
      transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
      animation: trustCardIn .45s ease both;
    }
    .trust-item:hover {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--sv-primary) 34%, var(--sv-border));
      box-shadow: var(--sv-shadow), 0 0 0 1px color-mix(in srgb, var(--sv-primary) 16%, transparent);
    }
    .trust-item h3 { margin:0; font-size:1.5rem; color: var(--sv-primary); }
    .trust-item p { margin:6px 0 0; color:var(--sv-muted); font-size:.92rem; }
    .trust-item--1 { animation-delay: .02s; }
    .trust-item--2 { animation-delay: .08s; }
    .trust-item--3 { animation-delay: .14s; }
    .trust-item--4 { animation-delay: .2s; }
    .benefit-grid { display:grid; gap:20px; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); margin-top:24px; }
    .benefit-card {
      background: linear-gradient(
        160deg,
        var(--sv-surface) 0%,
        color-mix(in srgb, var(--sv-primary) 4%, var(--sv-surface)) 100%
      );
      border:1px solid var(--sv-border);
      border-radius:16px;
      padding:22px;
      box-shadow: var(--sv-shadow-sm);
    }
    .benefit-card h3 { margin:0 0 10px; font-size:1.25rem; }
    .pillar-tabs { display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; }
    .pillar-panel {
      margin-top: 14px;
      border: 1px solid var(--sv-border);
      border-radius: 18px;
      background: linear-gradient(
        145deg,
        var(--sv-surface) 0%,
        color-mix(in srgb, var(--sv-primary) 7%, var(--sv-surface)) 100%
      );
      padding: 24px;
      box-shadow: var(--sv-shadow-sm);
    }
    .pillar-bullets { margin: 12px 0 0; padding-left: 18px; color: var(--sv-ink); }
    .pillar-bullets li { margin: 4px 0; }
    .feature-section-head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; }
    .feature-nav-btns { display:flex; gap:8px; flex-wrap:wrap; }
    .feature-rail {
      margin-top: 28px;
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 4px;
      scrollbar-width: thin;
    }
    .feature-rail-item {
      flex: 0 0 clamp(260px, 32vw, 380px);
      scroll-snap-align: start;
    }
    h1, h2, h3 { font-family: var(--sv-font-heading); color: var(--sv-ink); letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
    h1 { font-weight: 700; font-size: clamp(2.25rem, 4.5vw, 3.5rem); }
    h2 { font-weight: 600; font-size: clamp(1.625rem, 3vw, 2.25rem); }
    h3 { font-weight: 600; font-size: 1.375rem; }
    .sv-muted { color: var(--sv-muted); }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 600; color: var(--sv-accent); }
    .sv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.95rem; border: 1px solid transparent; cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease, transform .15s ease; text-decoration: none; }
    .sv-btn-primary { background: var(--sv-accent); color: #fff; }
    .sv-btn-primary:hover { background: var(--sv-accent-dark); color: #fff; transform: translateY(-1px); text-decoration: none; }
    .sv-btn-secondary { background: var(--sv-primary); color: #fff; }
    .sv-btn-secondary:hover { background: var(--sv-primary-light); color: #fff; text-decoration: none; }
    .sv-btn-ghost { background: transparent; color: var(--sv-primary); border-color: var(--sv-border); }
    .sv-btn-ghost:hover { background: var(--sv-surface); border-color: var(--sv-primary); text-decoration: none; }
    .sv-card { background: var(--sv-surface); border: 1px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 28px; box-shadow: var(--sv-shadow-sm); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
    .sv-card:hover { box-shadow: var(--sv-shadow); border-color: #d6d3d1; transform: translateY(-2px); }
    .sv-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .sv-header { position: sticky; top: 0; z-index: 50; backdrop-filter: saturate(160%) blur(14px); background: rgba(249, 248, 246, 0.85); border-bottom: 1px solid var(--sv-border); }
    .sv-header__inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
    .sv-logo { font-family: var(--sv-font-heading); font-weight: 700; font-size: 1.4rem; color: var(--sv-primary); text-decoration: none; }
    .sv-nav { display: flex; gap: 28px; align-items: center; }
    .sv-nav a { color: var(--sv-ink); font-weight: 500; text-decoration: none; }
    .sv-nav a:hover { color: var(--sv-primary); text-decoration: none; }
    .sv-hero { padding: clamp(72px, 10vw, 128px) 0 clamp(56px, 8vw, 96px); }
    .sv-hero__lead { font-size: 1.15rem; color: var(--sv-muted); max-width: 640px; margin: 20px 0 32px; }
    .sv-hero__ctas { display: flex; gap: 14px; flex-wrap: wrap; }
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
    @media (max-width: 900px) {
      .sv-container[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
      .trust-grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
      .trust-item { padding: 14px 12px; }
      .trust-item h3 { font-size: 1.28rem; }
      .trust-item p { font-size: .86rem; }
    }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-btn { width: 100%; justify-content: center; }
      .feature-nav-btns { width: 100%; }
      .feature-nav-btns .sv-btn { flex: 1 1 0; width: auto; }
      .feature-rail-item { flex: 0 0 min(88vw, 340px); }
      .sv-card { padding: 18px; }
      .pillar-panel { padding: 18px; }
      .tag-pill { min-width: 108px; padding: 7px 14px; }
    }
    @media (max-width: 520px) {
      .trust-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .trust-item { border-radius: 12px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .trust-item { animation: none; transition: none; }
    }
    [data-theme='dark'] .trust-item,
    [data-theme='dark'] .benefit-card,
    [data-theme='dark'] .pillar-panel {
      border-color: color-mix(in srgb, var(--sv-primary) 24%, var(--sv-border));
      box-shadow: 0 8px 24px rgba(0,0,0,0.28);
    }
    @media (max-width: 720px) {
      .sv-nav { display: none; }
    }
    @keyframes trustCardIn {
      from { opacity: 0; transform: translateY(8px) scale(.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class MarketingLandingComponent implements OnInit {
  @ViewChild('featureRail') featureRail?: ElementRef<HTMLDivElement>;
  private readonly fb = inject(FormBuilder);
  readonly valuePillars: ValuePillar[] = [
    {
      id: 'owners',
      label: 'For School Owners',
      title: 'Get owner-level school visibility in one place',
      description: 'Monitor academics, fee collection, and operations across your institution from one trusted dashboard.',
      bullets: ['Executive dashboard', 'Cross-campus consistency', 'Decision-ready insights']
    },
    {
      id: 'principals',
      label: 'For Principals',
      title: 'Run academics with predictable outcomes',
      description: 'Align classes, attendance, assessments, and communication workflows without manual coordination chaos.',
      bullets: ['Academic planning', 'Staff accountability', 'Better parent communication']
    },
    {
      id: 'ops',
      label: 'For Operations',
      title: 'Standardize daily execution across teams',
      description: 'Use role-safe workflows and audit-friendly operations to reduce delays and manual dependencies.',
      bullets: ['Defined workflows', 'Role-safe actions', 'Audit-ready operations']
    }
  ];
  readonly activePillarId = signal<string>(this.valuePillars[0].id);
  readonly activePillar = computed(() =>
    this.valuePillars.find(p => p.id === this.activePillarId()) ?? this.valuePillars[0]
  );
  readonly features = signal<MarketingFeature[]>([]);
  readonly testimonials = signal<MarketingTestimonial[]>([]);
  readonly submitting = signal(false);
  readonly leadReference = signal('');
  brochureUrl = '';
  private readonly fallbackFeatures: MarketingFeature[] = [
    {
      slug: 'academics',
      name: 'Academic Planning',
      category: 'Academics',
      shortDescription: 'Curriculum planning, class operations, assessments, and progress tracking in one workflow.',
      highlights: ['Curriculum planner', 'Class-wise tracking', 'Performance insights']
    },
    {
      slug: 'fees',
      name: 'Fees and Collections',
      category: 'Finance',
      shortDescription: 'Digital fee setup, reminders, receipts, and owner-level collection visibility.',
      highlights: ['Auto reminders', 'Online collections', 'Outstanding monitoring']
    },
    {
      slug: 'attendance',
      name: 'Attendance and Discipline',
      category: 'Operations',
      shortDescription: 'Daily attendance with role-based approvals and parent alerts.',
      highlights: ['Teacher quick entry', 'Late/absence alerts', 'Reports']
    }
  ];
  private readonly fallbackTestimonials: MarketingTestimonial[] = [
    {
      id: 't-1',
      name: 'R. Sharma',
      designation: 'School Director',
      institution: 'Green Valley School',
      quote: 'SchoolVault helped us standardize operations across campuses and reduced manual admin work massively.',
      rating: 5,
      featured: true
    },
    {
      id: 't-2',
      name: 'P. Iyer',
      designation: 'Principal',
      institution: 'Springfield Public School',
      quote: 'The parent communication and academic tracking experience is clean, fast, and very easy for our staff.',
      rating: 5,
      featured: true
    }
  ];

  readonly leadForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    workEmail: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    phone: ['', [Validators.maxLength(30)]],
    schoolName: ['', [Validators.maxLength(180)]],
    message: ['', [Validators.maxLength(2000)]],
    privacyConsent: [false, Validators.requiredTrue],
  });

  constructor(
    private readonly marketing: MarketingService,
    private readonly seo: MarketingSeoService
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'EduPortal - Unified School Operations Platform',
      description: 'Landing website for EduPortal SaaS with modules, testimonials, brochure, and callback lead capture.',
      canonicalPath: '/'
    });
    this.brochureUrl = this.marketing.brochureUrl();
    this.marketing.listFeatures().subscribe({
      next: list => this.features.set(list.length ? list.slice(0, 6) : this.fallbackFeatures),
      error: () => this.features.set(this.fallbackFeatures)
    });
    this.marketing.listTestimonials(true).subscribe({
      next: list => this.testimonials.set(list.length ? list.slice(0, 4) : this.fallbackTestimonials),
      error: () => this.testimonials.set(this.fallbackTestimonials)
    });
  }

  submitLead(): void {
    if (this.leadForm.invalid || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const value = this.leadForm.getRawValue();
    this.marketing.submitLead({
      fullName: value.fullName ?? '',
      workEmail: value.workEmail ?? '',
      phone: value.phone ?? '',
      schoolName: value.schoolName ?? '',
      message: value.message ?? '',
      source: 'WEBSITE',
      pagePath: '/',
      privacyConsent: Boolean(value.privacyConsent),
      marketingConsent: false
    }).subscribe({
      next: lead => {
        this.leadReference.set(lead.reference);
        this.leadForm.reset({ privacyConsent: false });
        this.submitting.set(false);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  scrollFeatureRail(direction: 1 | -1): void {
    const rail = this.featureRail?.nativeElement;
    if (!rail) return;
    const step = Math.max(rail.clientWidth * 0.8, 280);
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }
}
