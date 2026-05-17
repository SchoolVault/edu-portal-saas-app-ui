import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sv-cta-band',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="sv-section">
      <div class="sv-container">
        <div class="sv-cta-band">
          <span class="sv-cta-eyebrow">Next Step</span>
          <h2>Plan Your SchoolVault Rollout with Confidence</h2>
          <p>
            Get a role-based product walkthrough, migration blueprint, and implementation plan tailored to your school.
          </p>
          <div class="sv-cta-points">
            <span>Owner and principal focused demo</span>
            <span>Migration and onboarding strategy</span>
            <span>Timeline, scope, and pricing clarity</span>
          </div>
          <div class="sv-cta-actions">
            <a routerLink="/request-demo" class="sv-btn sv-btn-ghost sv-btn-callback">Request Callback</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sv-section { padding: 64px 0; }
    .sv-container { width:100%; max-width:100%; margin:0 auto; padding:0 clamp(14px, 2.2vw, 32px); }
    .sv-cta-band {
      position: relative;
      overflow: hidden;
      background: linear-gradient(
        140deg,
        color-mix(in srgb, var(--clr-surface) 92%, var(--clr-primary) 8%) 0%,
        color-mix(in srgb, var(--clr-surface-alt) 90%, var(--clr-primary) 10%) 100%
      );
      color: var(--clr-text);
      border: 1px solid color-mix(in srgb, var(--clr-primary) 22%, var(--clr-border));
      border-radius:24px;
      padding:40px;
      text-align:center;
      box-shadow: var(--shadow-md);
    }
    .sv-cta-band::after {
      content: '';
      position: absolute;
      inset: -10% -20% auto auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, color-mix(in srgb, var(--clr-accent) 22%, transparent) 0%, transparent 70%);
      pointer-events: none;
    }
    .sv-cta-eyebrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--clr-primary) 32%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-surface) 86%, var(--clr-primary) 14%);
      color: var(--clr-primary);
      font-size: .74rem;
      letter-spacing: .08em;
      text-transform: uppercase;
      font-weight: 700;
      padding: 5px 11px;
    }
    h2 { margin:0; font-family:'Fraunces', Georgia, serif; color:var(--clr-text); }
    p { margin:12px 0 20px; color:var(--clr-text-secondary); }
    .sv-cta-points {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      margin: -2px 0 20px;
    }
    .sv-cta-points span {
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 88%, transparent);
      background: color-mix(in srgb, var(--clr-surface) 90%, var(--clr-primary) 10%);
      padding: 6px 11px;
      color: var(--clr-text-secondary);
      font-size: .76rem;
      line-height: 1.2;
    }
    .sv-cta-actions { display:inline-flex; gap:12px; flex-wrap:wrap; justify-content:center; }
    .sv-btn { border-radius:999px; padding:12px 22px; font-weight:600; text-decoration:none; }
    .sv-btn-primary { background:var(--clr-accent); color:#fff; }
    .sv-btn-ghost { border:1px solid var(--clr-border); color:var(--clr-primary); }
    .sv-btn-callback {
      border-color: color-mix(in srgb, var(--clr-primary) 78%, #0f766e 22%);
      background: linear-gradient(
        145deg,
        color-mix(in srgb, var(--clr-primary) 86%, #22c55e 14%) 0%,
        color-mix(in srgb, var(--clr-primary) 70%, #15803d 30%) 100%
      );
      color: #fff;
    }
    .sv-btn-callback:hover {
      border-color: color-mix(in srgb, var(--clr-primary) 86%, #0f766e 14%);
      background: linear-gradient(
        145deg,
        color-mix(in srgb, var(--clr-primary) 92%, #22c55e 8%) 0%,
        color-mix(in srgb, var(--clr-primary) 78%, #15803d 22%) 100%
      );
      color: #fff;
      transform: translateY(-1px);
    }
    @media (max-width: 720px) {
      .sv-section { padding: 42px 0; }
      .sv-container { padding: 0 16px; }
      .sv-cta-band { padding: 24px 16px; border-radius: 16px; }
      .sv-cta-points { margin: 2px 0 16px; }
      .sv-cta-actions { display: flex; }
      .sv-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class CtaBandComponent {}
