import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketingFeature, MarketingService, MarketingTestimonial } from '../../../core/services/marketing.service';
import { MarketingSeoService } from '../../../core/services/marketing-seo.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FeatureCardComponent } from '../shared/components/feature-card/feature-card.component';
import { TestimonialCardComponent } from '../shared/components/testimonial-card/testimonial-card.component';
import { CtaBandComponent } from '../shared/components/cta-band/cta-band.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ValuePillar {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  metrics: { label: string; value: string }[];
}

interface HeroPill {
  icon: string;
  label: string;
  hint: string;
}

interface HeroModuleQuick {
  icon: string;
  title: string;
  blurb: string;
}

interface DashboardNotification {
  icon: string;
  title: string;
  subtitle: string;
  time: string;
}


@Component({
  selector: 'app-marketing-landing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderComponent,
    FeatureCardComponent,
    TestimonialCardComponent,
    CtaBandComponent,
    FooterComponent
  ],
  template: `
    <sv-header />
    <section class="sv-showcase">
      <div class="sv-container">
        <div class="sv-showcase-grid">
          <div class="sv-showcase-copy">
            <div class="sv-showcase-chip">All-in-One School ERP Platform</div>
            <h1 class="sv-showcase-title">
              Enterprise School ERP for Operational Excellence, Governance, and Sustainable <span>Growth</span>
            </h1>
            <p class="sv-showcase-subtitle">
              Streamline admissions, academics, finance, payroll, and communication in one secure platform built for modern schools.
            </p>
            <div class="sv-showcase-cta">
              <a class="sv-btn sv-btn-primary" routerLink="/request-demo">Request a Demo</a>
              <a class="sv-btn sv-btn-ghost sv-btn-watch" routerLink="/features"><span class="play">▶</span>Watch Demo</a>
            </div>
            <div class="sv-pill-row">
              <div class="sv-info-pill" *ngFor="let item of heroPills">
                <span class="sv-info-pill__icon">{{ item.icon }}</span>
                <div>
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.hint }}</small>
                </div>
              </div>
            </div>
          </div>
          <div class="sv-showcase-visual">
            <article class="sv-dashboard-mock">
              <header class="sv-dashboard-mock__head">
                <div class="sv-dashboard-mock__brand">
                  <strong>SchoolVault</strong>
                  <span>Live Overview</span>
                </div>
                <div class="sv-dashboard-mock__actions">
                  <span>{{ dashboardDateLabel }}</span>
                </div>
              </header>
              <div class="sv-dashboard-shell">
                <aside class="sv-dashboard-side">
                  <a *ngFor="let item of dashboardMenu" href="javascript:void(0)">{{ item }}</a>
                </aside>
                <div class="sv-dashboard-main">
                  <div class="sv-dashboard-toolbar">
                    <div class="sv-dashboard-search">Search students, fees, receipts...</div>
                    <div class="sv-dashboard-icons">
                      <span>🔔</span>
                      <span>✉️</span>
                      <span>⚙️</span>
                    </div>
                  </div>
                  <div class="sv-dashboard-mock__kpis">
                    <div class="kpi kpi-students"><b>3,562</b><small>Total Students</small><span>+120 this month</span></div>
                    <div class="kpi kpi-fees"><b>&#8377;28,45,000</b><small>Fee Collection (May)</small><span>+18.6% vs last month</span></div>
                    <div class="kpi kpi-attendance"><b>92.6%</b><small>Attendance Today</small><span>+4.2% vs yesterday</span></div>
                    <div class="kpi kpi-staff"><b>245</b><small>Total Staff</small><span>+8 this month</span></div>
                  </div>
                  <div class="sv-dashboard-core">
                    <article class="sv-widget sv-chart-widget">
                      <header>
                        <h5>Fee Collection Overview</h5>
                      </header>
                      <div class="sv-dashboard-mock__chart">
                        <canvas #collectionsChart class="sv-chart-canvas sv-chart-canvas--main" aria-label="Intake and collections trend"></canvas>
                      </div>
                      <div class="sv-chart-legend sv-chart-legend--below">
                        <span class="line line-green"></span><small>Collected</small>
                        <span class="line line-orange"></span><small>Pending</small>
                      </div>
                    </article>
                    <article class="sv-widget sv-notification-widget">
                      <header>
                        <h5>Recent Notifications</h5>
                        <small>View All</small>
                      </header>
                      <div class="sv-notification-list">
                        <div class="sv-notification-row" *ngFor="let item of dashboardNotifications">
                          <span class="sv-notification-row__icon">{{ item.icon }}</span>
                          <div class="sv-notification-row__body">
                            <strong>{{ item.title }}</strong>
                            <small>{{ item.subtitle }}</small>
                          </div>
                          <small>{{ item.time }}</small>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
        <div class="trust-grid sv-showcase-trust">
          <article class="trust-item trust-item--1">
            <h3>120+</h3>
            <p>Schools onboarded</p>
          </article>
          <article class="trust-item trust-item--2">
            <h3>3.5L+</h3>
            <p>Students managed</p>
          </article>
          <article class="trust-item trust-item--3 sv-bottom-stat">
            <span class="sv-bottom-stat__icon">📈</span>
            <h3>99.9%</h3>
            <p>Platform uptime</p>
          </article>
          <article class="trust-item trust-item--4 sv-bottom-stat">
            <span class="sv-bottom-stat__icon">🎧</span>
            <h3>24x7</h3>
            <p>Support and onboarding</p>
          </article>
        </div>
        <div class="sv-showcase-module-head">
          <span class="sv-eyebrow">Everything You Need</span>
          <h2>All School Operations, One Platform</h2>
        </div>
        <div class="sv-showcase-modules">
          <article class="sv-module-quick" *ngFor="let mod of heroModules">
            <span class="sv-module-quick__icon">{{ mod.icon }}</span>
            <div>
              <h4>{{ mod.title }}</h4>
              <p>{{ mod.blurb }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="sv-section sv-role-section" style="padding-top: 22px;">
      <div class="sv-container">
        <span class="sv-eyebrow">Why it works</span>
        <h2 style="margin-top:10px">See your role-specific value instantly</h2>
        <p class="sv-muted" style="margin-top:12px; max-width:720px">
          Choose your perspective to quickly understand how SchoolVault helps owners, principals, and operations teams.
        </p>
        <div class="pillar-layout">
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
            <div class="pillar-metrics">
              <article class="pillar-metric" *ngFor="let metric of activePillar().metrics">
                <strong>{{ metric.value }}</strong>
                <small>{{ metric.label }}</small>
              </article>
            </div>
            <ul class="pillar-bullets">
              <li *ngFor="let bullet of activePillar().bullets">{{ bullet }}</li>
            </ul>
            <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap">
              <a class="sv-btn sv-btn-primary" routerLink="/request-demo">Book a guided walkthrough</a>
              <a class="sv-btn sv-btn-ghost" routerLink="/features">Explore all modules</a>
            </div>
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
    .sv-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0 clamp(14px, 2.2vw, 32px); }
    .sv-section { padding: clamp(42px, 6.8vw, 78px) 0; }
    .sv-showcase {
      position: relative;
      padding: clamp(26px, 4.2vw, 44px) 0 clamp(18px, 3vw, 26px);
      background:
        radial-gradient(1000px 420px at 86% -16%, color-mix(in srgb, var(--sv-primary) 18%, transparent), transparent 70%),
        radial-gradient(700px 340px at -2% 8%, color-mix(in srgb, var(--sv-accent) 10%, transparent), transparent 66%),
        linear-gradient(180deg, color-mix(in srgb, var(--sv-surface) 96%, var(--sv-primary) 4%) 0%, color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%) 100%);
    }
    .sv-showcase-grid {
      display: grid;
      grid-template-columns: 1fr 1.12fr;
      gap: 16px;
      align-items: stretch;
    }
    .sv-showcase-copy {
      border: 1px solid color-mix(in srgb, var(--sv-border) 86%, transparent);
      border-radius: 16px;
      padding: clamp(20px, 3.2vw, 28px);
      background: linear-gradient(140deg, color-mix(in srgb, var(--sv-surface) 97%, var(--sv-primary) 3%) 0%, color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%) 100%);
      box-shadow: var(--sv-shadow-sm);
    }
    .sv-showcase-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 5px 12px;
      border: 1px solid color-mix(in srgb, var(--sv-primary) 30%, var(--sv-border));
      color: var(--sv-primary);
      font-size: .78rem;
      font-weight: 600;
      letter-spacing: .02em;
      margin-bottom: 12px;
    }
    .sv-showcase-title {
      margin: 0;
      font-size: clamp(2.08rem, 4.5vw, 3.45rem);
      line-height: 1.03;
    }
    .sv-showcase-title span {
      color: #45d39a;
    }
    .sv-showcase-subtitle {
      margin: 12px 0 16px;
      color: var(--sv-muted);
      font-size: 1rem;
      line-height: 1.4;
      max-width: 630px;
    }
    .sv-showcase-cta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .sv-btn-watch .play {
      font-size: .76rem;
      line-height: 1;
      opacity: .9;
    }
    .sv-pill-row {
      margin-top: 14px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .sv-info-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--sv-border);
      border-radius: 12px;
      background: color-mix(in srgb, var(--sv-surface) 88%, var(--sv-primary) 12%);
      padding: 7px 9px;
      min-width: 145px;
    }
    .sv-info-pill__icon {
      font-size: 1rem;
      width: 22px;
      text-align: center;
    }
    .sv-info-pill strong {
      display: block;
      font-size: .78rem;
      line-height: 1.1;
    }
    .sv-info-pill small {
      display: block;
      color: var(--sv-muted);
      font-size: .68rem;
      line-height: 1.1;
      margin-top: 2px;
    }
    .sv-showcase-visual {
      position: relative;
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--sv-border) 84%, transparent);
      background: linear-gradient(160deg, color-mix(in srgb, var(--sv-surface) 97%, var(--sv-primary) 3%) 0%, color-mix(in srgb, var(--sv-surface) 91%, var(--sv-primary) 9%) 100%);
      padding: 14px;
      min-height: 320px;
      box-shadow: var(--sv-shadow-sm);
      overflow: hidden;
    }
    .sv-dashboard-mock {
      border: 1px solid color-mix(in srgb, var(--sv-border) 80%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--sv-surface) 90%, var(--sv-primary) 10%);
      padding: 10px;
      min-height: 250px;
      position: relative;
    }
    .sv-dashboard-shell {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 10px;
    }
    .sv-dashboard-side {
      border: 1px solid color-mix(in srgb, var(--sv-border) 85%, transparent);
      border-radius: 10px;
      background: color-mix(in srgb, var(--sv-surface) 90%, var(--sv-primary) 10%);
      padding: 8px;
      display: grid;
      gap: 4px;
      align-content: start;
    }
    .sv-dashboard-side a {
      font-size: .66rem;
      padding: 4px 6px;
      border-radius: 6px;
      color: var(--sv-muted);
      text-decoration: none;
      font-weight: 600;
    }
    .sv-dashboard-side a:first-child {
      background: color-mix(in srgb, var(--sv-primary) 15%, var(--sv-surface));
      color: var(--sv-primary);
    }
    .sv-dashboard-main { min-width: 0; }
    .sv-dashboard-mock__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid color-mix(in srgb, var(--sv-border) 85%, transparent);
      font-size: .78rem;
      color: var(--sv-muted);
    }
    .sv-dashboard-mock__brand {
      display: grid;
      gap: 2px;
    }
    .sv-dashboard-mock__brand strong {
      font-size: .85rem;
      color: var(--sv-ink);
    }
    .sv-dashboard-mock__brand span,
    .sv-dashboard-mock__actions span {
      font-size: .64rem;
      color: var(--sv-muted);
    }
    .sv-dashboard-toolbar {
      margin-top: 8px;
      border: 1px solid color-mix(in srgb, var(--sv-border) 86%, transparent);
      border-radius: 9px;
      background: color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%);
      padding: 6px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .sv-dashboard-search {
      flex: 1;
      min-width: 0;
      border: 1px solid color-mix(in srgb, var(--sv-border) 80%, transparent);
      border-radius: 8px;
      height: 24px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      color: var(--sv-muted);
      font-size: .6rem;
      background: color-mix(in srgb, var(--sv-surface) 94%, var(--sv-primary) 6%);
    }
    .sv-dashboard-icons {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sv-dashboard-icons span {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--sv-border) 84%, transparent);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: .62rem;
      background: color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%);
    }
    .sv-dashboard-mock__kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .sv-dashboard-mock__kpis > div {
      border: 1px solid color-mix(in srgb, var(--sv-border) 88%, transparent);
      border-radius: 10px;
      background: color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%);
      padding: 8px;
    }
    .sv-dashboard-mock__kpis .kpi {
      position: relative;
      overflow: hidden;
    }
    .sv-dashboard-mock__kpis .kpi::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 3px;
      opacity: .8;
    }
    .sv-dashboard-mock__kpis .kpi span {
      display: block;
      margin-top: 2px;
      font-size: .58rem;
      color: var(--sv-muted);
    }
    .kpi-students::after { background: #4fb8ff; }
    .kpi-fees::after { background: #31d49a; }
    .kpi-attendance::after { background: #f3af4b; }
    .kpi-staff::after { background: #8e7aff; }
    .sv-dashboard-mock__kpis b {
      display: block;
      font-size: .95rem;
      line-height: 1.1;
    }
    .sv-dashboard-mock__kpis small {
      color: var(--sv-muted);
      font-size: .67rem;
    }
    .sv-dashboard-mock__chart {
      margin-top: 6px;
      height: 164px;
      padding: 8px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--sv-border) 88%, transparent);
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--sv-surface) 96%, var(--sv-primary) 4%) 0%, color-mix(in srgb, var(--sv-surface) 86%, var(--sv-primary) 14%) 100%);
      position: relative;
      overflow: hidden;
    }
    .sv-dashboard-core {
      margin-top: 8px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 8px;
      align-items: stretch;
    }
    .sv-widget {
      border: 1px solid color-mix(in srgb, var(--sv-border) 88%, transparent);
      border-radius: 8px;
      background: color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%);
      padding: 7px 8px;
    }
    .sv-widget header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .sv-widget h5 {
      margin: 0;
      font-size: .62rem;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: var(--sv-muted);
    }
    .sv-widget small {
      display: block;
      font-size: .58rem;
      color: var(--sv-muted);
      line-height: 1.2;
    }
    .sv-snapshot-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      font-size: .61rem;
      color: var(--sv-muted);
      padding: 4px 0;
      border-bottom: 1px dashed color-mix(in srgb, var(--sv-border) 84%, transparent);
    }
    .sv-snapshot-row:last-child {
      border-bottom: 0;
    }
    .sv-snapshot-row strong {
      color: var(--sv-ink);
      font-size: .64rem;
    }
    .sv-chart-legend {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: .58rem;
      color: var(--sv-muted);
    }
    .sv-chart-legend--below {
      margin-top: 8px;
      padding-left: 2px;
    }
    .sv-chart-legend .line {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      display: inline-block;
    }
    .sv-chart-legend .line-green { background: #36cf98; }
    .sv-chart-legend .line-orange { background: #f3af4b; }
    .sv-chart-canvas {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 6px;
    }
    .sv-chart-canvas--main {
      height: 146px;
    }
    .sv-chart-widget {
      min-height: 230px;
    }
    .sv-notification-widget {
      min-height: 230px;
    }
    .sv-notification-widget header small {
      font-size: .58rem;
      color: #8aa5c0;
    }
    .sv-notification-list {
      margin-top: 8px;
      display: grid;
      gap: 8px;
    }
    .sv-notification-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sv-notification-row__icon {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--sv-border) 80%, transparent);
      background: color-mix(in srgb, var(--sv-surface) 88%, var(--sv-primary) 12%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: .66rem;
      flex-shrink: 0;
    }
    .sv-notification-row__body {
      min-width: 0;
      display: grid;
      gap: 2px;
      flex: 1;
    }
    .sv-notification-row__body strong {
      color: var(--sv-ink);
      font-size: .62rem;
      line-height: 1.15;
    }
    .sv-notification-row__body small,
    .sv-notification-row > small {
      color: var(--sv-muted);
      font-size: .56rem;
      line-height: 1.1;
      margin: 0;
    }
    @media (max-width: 900px) {
      .sv-dashboard-core {
        grid-template-columns: 1fr;
      }
    }
    [data-theme='dark'] .sv-showcase {
      background:
        radial-gradient(1000px 420px at 86% -16%, color-mix(in srgb, var(--sv-primary) 30%, transparent), transparent 66%),
        radial-gradient(700px 340px at -2% 8%, color-mix(in srgb, var(--sv-accent) 18%, transparent), transparent 60%),
        linear-gradient(180deg, #071328 0%, #0a1d34 100%);
    }
    [data-theme='dark'] .sv-showcase-copy,
    [data-theme='dark'] .sv-showcase-visual,
    [data-theme='dark'] .sv-dashboard-mock,
    [data-theme='dark'] .sv-dashboard-side,
    [data-theme='dark'] .sv-dashboard-mock__kpis > div,
    [data-theme='dark'] .sv-dashboard-panels article {
      background: color-mix(in srgb, #0d233d 88%, var(--sv-primary) 12%);
      border-color: color-mix(in srgb, #88a2be 22%, transparent);
    }
    .sv-showcase-trust {
      margin-top: 10px;
    }
    .sv-showcase-trust--dual {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .sv-bottom-stat {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 96px;
      text-align: left;
    }
    .sv-bottom-stat h3,
    .sv-bottom-stat p {
      margin: 0;
    }
    .sv-bottom-stat__icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      background: color-mix(in srgb, var(--sv-surface) 84%, var(--sv-primary) 16%);
      border: 1px solid color-mix(in srgb, var(--sv-border) 84%, transparent);
      flex-shrink: 0;
    }
    .sv-showcase-module-head {
      margin-top: 16px;
      text-align: center;
    }
    .sv-showcase-module-head h2 {
      margin-top: 8px;
      font-size: clamp(1.45rem, 2.4vw, 2rem);
    }
    .sv-showcase-modules {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .sv-module-quick {
      border: 1px solid color-mix(in srgb, var(--sv-border) 90%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--sv-surface) 90%, var(--sv-primary) 10%);
      padding: 12px 13px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      min-height: 86px;
      position: relative;
      overflow: hidden;
      transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease;
    }
    .sv-module-quick::after {
      content: '';
      position: absolute;
      inset: -45% auto auto -22%;
      width: 56%;
      height: 180%;
      background: linear-gradient(120deg, color-mix(in srgb, #ffffff 12%, transparent) 0%, transparent 70%);
      opacity: 0;
      transform: translateX(-16px);
      transition: opacity .26s ease, transform .26s ease;
      pointer-events: none;
    }
    .sv-module-quick:hover,
    .sv-module-quick:focus-within {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--sv-primary) 34%, var(--sv-border));
      box-shadow: 0 14px 28px color-mix(in srgb, var(--sv-primary) 18%, transparent);
      background: color-mix(in srgb, var(--sv-surface) 84%, var(--sv-primary) 16%);
    }
    .sv-module-quick:hover::after,
    .sv-module-quick:focus-within::after {
      opacity: .9;
      transform: translateX(0);
    }
    .sv-module-quick__icon {
      font-size: 1.04rem;
      width: 30px;
      height: 30px;
      text-align: center;
      margin-top: 1px;
      border-radius: 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--sv-surface) 86%, var(--sv-primary) 14%);
      border: 1px solid color-mix(in srgb, var(--sv-border) 84%, transparent);
      transition: transform .22s ease, background .22s ease, border-color .22s ease;
      flex-shrink: 0;
    }
    .sv-module-quick:hover .sv-module-quick__icon,
    .sv-module-quick:focus-within .sv-module-quick__icon {
      transform: translateY(-1px) scale(1.04);
      background: color-mix(in srgb, var(--sv-primary) 24%, var(--sv-surface));
      border-color: color-mix(in srgb, var(--sv-primary) 38%, var(--sv-border));
    }
    .sv-module-quick h4 {
      margin: 0;
      font-size: .83rem;
      line-height: 1.15;
      font-weight: 700;
    }
    .sv-module-quick p {
      margin: 5px 0 0;
      color: var(--sv-muted);
      font-size: .72rem;
      line-height: 1.3;
    }
    @media (prefers-reduced-motion: reduce) {
      .sv-module-quick,
      .sv-module-quick::after,
      .sv-module-quick__icon {
        transition: none;
      }
      .sv-module-quick:hover,
      .sv-module-quick:focus-within {
        transform: none;
      }
    }
    .sv-section + .sv-section {
      position: relative;
    }
    .sv-section + .sv-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: min(24px, 4vw);
      right: min(24px, 4vw);
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--sv-border) 85%, transparent) 14%,
        color-mix(in srgb, var(--sv-primary) 16%, var(--sv-border)) 50%,
        color-mix(in srgb, var(--sv-border) 85%, transparent) 86%,
        transparent 100%
      );
      opacity: 0.72;
      pointer-events: none;
    }
    .sv-tagline-band { display: none; }
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
      padding: 6px 0 0;
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
    .sv-trust-row { display: none; }
    .trust-grid { display:grid; gap:10px; grid-template-columns: repeat(4, minmax(160px, 1fr)); }
    .trust-item {
      position: relative;
      overflow: hidden;
      background: linear-gradient(
        150deg,
        var(--sv-surface) 0%,
        color-mix(in srgb, var(--sv-primary) 5%, var(--sv-surface)) 100%
      );
      border:1px solid var(--sv-border);
      border-radius:16px;
      padding:14px 16px;
      text-align:center;
      box-shadow: var(--sv-shadow-sm);
      transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
      animation: trustCardIn .45s ease both;
      will-change: transform;
    }
    .trust-item::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        120deg,
        transparent 24%,
        color-mix(in srgb, var(--sv-primary) 8%, transparent) 42%,
        transparent 62%
      );
      opacity: 0;
      transition: opacity .24s ease;
      pointer-events: none;
    }
    .trust-item:hover {
      transform: translateY(-5px);
      border-color: color-mix(in srgb, var(--sv-primary) 34%, var(--sv-border));
      box-shadow: var(--sv-shadow-lg), 0 0 0 1px color-mix(in srgb, var(--sv-primary) 16%, transparent);
    }
    .trust-item:hover::after {
      opacity: 1;
    }
    .trust-item h3 { margin:0; font-size:1.5rem; color: var(--sv-primary); }
    .trust-item p { margin:6px 0 0; color:var(--sv-muted); font-size:.92rem; }
    .trust-item--1 { animation-delay: .02s; }
    .trust-item--2 { animation-delay: .08s; }
    .trust-item--3 { animation-delay: .14s; }
    .trust-item--4 { animation-delay: .2s; }
    .benefit-grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); margin-top:18px; }
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
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }
    .benefit-card:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--sv-primary) 34%, var(--sv-border));
      box-shadow: var(--sv-shadow-lg);
    }
    .benefit-card h3 { margin:0 0 10px; font-size:1.25rem; }
    .sv-role-section {
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--sv-surface) 98%, var(--sv-primary) 2%) 0%,
        color-mix(in srgb, var(--sv-surface) 94%, var(--sv-primary) 6%) 100%
      );
    }
    .pillar-layout {
      margin-top: 20px;
      display: grid;
      grid-template-columns: minmax(220px, .8fr) minmax(0, 1.4fr);
      gap: 14px;
      align-items: start;
    }
    .pillar-tabs {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top: 0;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--sv-border) 88%, transparent);
      background: color-mix(in srgb, var(--sv-surface) 92%, var(--sv-primary) 8%);
      box-shadow: var(--sv-shadow-sm);
      align-content: flex-start;
      min-height: 100%;
    }
    .pillar-tabs .sv-btn {
      width: 100%;
      justify-content: flex-start;
      padding: 11px 14px;
      font-size: .88rem;
    }
    .pillar-panel {
      border: 1px solid var(--sv-border);
      border-radius: 18px;
      background: linear-gradient(
        145deg,
        var(--sv-surface) 0%,
        color-mix(in srgb, var(--sv-primary) 7%, var(--sv-surface)) 100%
      );
      padding: 20px;
      box-shadow: var(--sv-shadow-sm);
    }
    .pillar-metrics {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pillar-metric {
      border: 1px solid color-mix(in srgb, var(--sv-border) 84%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--sv-surface) 88%, var(--sv-primary) 12%);
      padding: 8px 10px;
      min-height: 64px;
      display: grid;
      align-content: center;
      gap: 2px;
    }
    .pillar-metric strong {
      font-size: 1rem;
      color: var(--sv-primary);
      line-height: 1.1;
    }
    .pillar-metric small {
      color: var(--sv-muted);
      font-size: .68rem;
      line-height: 1.2;
    }
    .pillar-bullets {
      margin: 12px 0 0;
      padding: 0;
      color: var(--sv-ink);
      list-style: none;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pillar-bullets li {
      margin: 0;
      border: 1px solid color-mix(in srgb, var(--sv-border) 84%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--sv-surface) 88%, var(--sv-primary) 12%);
      padding: 8px 10px;
      font-size: .78rem;
      line-height: 1.3;
    }
    .feature-section-head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; }
    .feature-nav-btns { display:flex; gap:8px; flex-wrap:wrap; }
    .feature-rail {
      margin-top: 20px;
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
      transition: transform .22s ease;
    }
    .feature-rail-item:hover {
      transform: translateY(-4px);
    }
    h1, h2, h3 { font-family: var(--sv-font-heading); color: var(--sv-ink); letter-spacing: -0.02em; line-height: 1.1; margin: 0; }
    h1 { font-weight: 700; font-size: clamp(2.25rem, 4.5vw, 3.5rem); }
    h2 { font-weight: 600; font-size: clamp(1.625rem, 3vw, 2.25rem); }
    h3 { font-weight: 600; font-size: 1.375rem; }
    .sv-muted { color: var(--sv-muted); line-height: 1.45; }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 600; color: var(--sv-accent); }
    .sv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.95rem; border: 1px solid transparent; cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease, transform .15s ease; text-decoration: none; }
    .sv-btn-primary { background: var(--sv-accent); color: #fff; }
    .sv-btn-primary:hover { background: var(--sv-accent-dark); color: #fff; transform: translateY(-1px); text-decoration: none; }
    .sv-btn-secondary { background: var(--sv-primary); color: #fff; }
    .sv-btn-secondary:hover { background: var(--sv-primary-light); color: #fff; text-decoration: none; }
    .sv-btn-ghost { background: transparent; color: var(--sv-primary); border-color: var(--sv-border); }
    .sv-btn-ghost:hover { background: var(--sv-surface); border-color: var(--sv-primary); text-decoration: none; }
    .sv-card { background: var(--sv-surface); border: 1px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 22px; box-shadow: var(--sv-shadow-sm); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
    .sv-card:hover { box-shadow: var(--sv-shadow); border-color: #d6d3d1; transform: translateY(-2px); }
    .sv-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
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
      .sv-showcase-grid { grid-template-columns: 1fr; gap: 12px; }
      .sv-dashboard-shell { grid-template-columns: 1fr; }
      .sv-dashboard-side { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .sv-showcase-modules { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .sv-container[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
      .trust-grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
      .trust-item { padding: 14px 12px; }
      .trust-item h3 { font-size: 1.28rem; }
      .trust-item p { font-size: .86rem; }
      .pillar-layout { grid-template-columns: 1fr; }
      .pillar-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .pillar-bullets { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-showcase { padding: 20px 0 16px; }
      .sv-showcase-copy { padding: 16px; }
      .sv-showcase-title { font-size: clamp(1.7rem, 7.6vw, 2.3rem); }
      .sv-showcase-subtitle { font-size: .96rem; margin: 10px 0 12px; }
      .sv-pill-row { gap: 6px; }
      .sv-info-pill { min-width: calc(50% - 3px); }
      .sv-showcase-modules { grid-template-columns: 1fr; gap: 10px; }
      .sv-showcase-module-head { margin-top: 10px; }
      .sv-module-quick { padding: 11px 12px; min-height: 0; }
      .sv-btn { width: 100%; justify-content: center; }
      .feature-nav-btns { width: 100%; }
      .feature-nav-btns .sv-btn { flex: 1 1 0; width: auto; }
      .feature-rail-item { flex: 0 0 min(88vw, 340px); }
      .sv-card { padding: 18px; }
      .pillar-panel { padding: 18px; }
      .pillar-tabs { padding: 10px; }
      .pillar-tabs .sv-btn { width: auto; }
      .pillar-metrics { grid-template-columns: 1fr; }
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
export class MarketingLandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('featureRail') featureRail?: ElementRef<HTMLDivElement>;
  @ViewChild('collectionsChart') collectionsChart?: ElementRef<HTMLCanvasElement>;
  private readonly fb = inject(FormBuilder);
  private collectionsChartRef?: Chart;
  readonly heroPills: HeroPill[] = [
    { icon: '🛡️', label: 'Secure & Reliable', hint: '99.9% Uptime' },
    { icon: '☁️', label: 'Cloud Based', hint: 'Anytime, Anywhere' },
    { icon: '🔒', label: 'Data Protection', hint: 'ISO/SOC Ready' },
    { icon: '🎧', label: '24x7 Support', hint: 'Always Here to Help' },
  ];
  readonly heroModules: HeroModuleQuick[] = [
    { icon: '🧾', title: 'Admissions', blurb: 'Enquiry to enrollment made simple' },
    { icon: '📘', title: 'Academics', blurb: 'Curriculum, classes, exams, results' },
    { icon: '💳', title: 'Fees & Finance', blurb: 'Fee collection, invoices, reports' },
    { icon: '👥', title: 'HR & Payroll', blurb: 'Staff management and payroll' },
    { icon: '🚌', title: 'Transport', blurb: 'Routes, tracking, student safety' },
    { icon: '📱', title: 'Parent App', blurb: 'Real-time updates for families' },
  ];
  readonly dashboardMenu: string[] = [
    'Dashboard',
    'Students',
    'Admissions',
    'Attendance',
    'Exams',
    'Fees',
    'Finance',
    'HR & Payroll',
    'Transport',
    'Reports',
    'Settings',
  ];
  readonly dashboardDateLabel = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());
  readonly dashboardNotifications: DashboardNotification[] = [
    { icon: '🟢', title: 'New admission received', subtitle: 'Class 5 · Aryan Sharma', time: '10m ago' },
    { icon: '🟠', title: 'Fee reminder sent', subtitle: 'Class 8 · 45 students', time: '1h ago' },
    { icon: '🟣', title: 'Staff payroll processed', subtitle: 'May 2024', time: '2h ago' },
    { icon: '🔵', title: 'Exam schedule published', subtitle: 'Mid-term timetable', time: '1d ago' }
  ];
  readonly valuePillars: ValuePillar[] = [
    {
      id: 'owners',
      label: 'For School Owners',
      title: 'Get owner-level school visibility in one place',
      description: 'Monitor academics, fee collection, and operations across your institution from one trusted dashboard.',
      bullets: ['Executive dashboard', 'Cross-campus consistency', 'Decision-ready insights'],
      metrics: [
        { label: 'Campuses monitored', value: '12+' },
        { label: 'Ops visibility', value: '360°' },
        { label: 'Decision cycle', value: '-32%' }
      ]
    },
    {
      id: 'principals',
      label: 'For Principals',
      title: 'Run academics with predictable outcomes',
      description: 'Align classes, attendance, assessments, and communication workflows without manual coordination chaos.',
      bullets: ['Academic planning', 'Staff accountability', 'Better parent communication'],
      metrics: [
        { label: 'Class coverage', value: '98%' },
        { label: 'Attendance compliance', value: '+21%' },
        { label: 'Parent response SLA', value: '<4h' }
      ]
    },
    {
      id: 'ops',
      label: 'For Operations',
      title: 'Standardize daily execution across teams',
      description: 'Use role-safe workflows and audit-friendly operations to reduce delays and manual dependencies.',
      bullets: ['Defined workflows', 'Role-safe actions', 'Audit-ready operations'],
      metrics: [
        { label: 'Task turnaround', value: '-27%' },
        { label: 'Manual errors', value: '-41%' },
        { label: 'Audit readiness', value: 'Always on' }
      ]
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

  ngAfterViewInit(): void {
    this.initCollectionsChart();
  }

  ngOnDestroy(): void {
    this.collectionsChartRef?.destroy();
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

  private initCollectionsChart(): void {
    const canvas = this.collectionsChart?.nativeElement;
    if (!canvas) return;
    this.collectionsChartRef?.destroy();
    this.collectionsChartRef = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['1 May', '7 May', '14 May', '21 May', '31 May'],
        datasets: [
          {
            label: 'Collected',
            data: [8, 14, 22, 29, 38],
            tension: 0.35,
            borderWidth: 2.5,
            borderColor: '#35cf98',
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Pending',
            data: [4, 7, 11, 16, 24],
            tension: 0.35,
            borderWidth: 2.5,
            borderColor: '#f3af4b',
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 750 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: {
              color: '#8fa8c0',
              font: { size: 8 },
              maxRotation: 0,
              autoSkip: false
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            suggestedMax: 40,
            ticks: {
              color: '#8fa8c0',
              font: { size: 8 },
              stepSize: 10,
              callback: value => `${value}L`
            },
            grid: { display: true, color: 'rgba(148, 163, 184, 0.16)' }
          }
        }
      }
    });
  }
}
