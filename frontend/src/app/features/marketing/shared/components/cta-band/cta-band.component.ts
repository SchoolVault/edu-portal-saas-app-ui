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
          <h2>Ready to see SchoolVault for your school?</h2>
          <p>Guided walkthrough, rollout planning, and migration support.</p>
          <div class="sv-cta-actions">
            <a routerLink="/request-demo" class="sv-btn sv-btn-primary">Request a Demo</a>
            <a routerLink="/request-demo" class="sv-btn sv-btn-ghost">Request Callback</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sv-section { padding: 64px 0; }
    .sv-container { max-width:1180px; margin:0 auto; padding:0 24px; }
    .sv-cta-band {
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
    h2 { margin:0; font-family:'Fraunces', Georgia, serif; color:var(--clr-text); }
    p { margin:12px 0 20px; color:var(--clr-text-secondary); }
    .sv-cta-actions { display:inline-flex; gap:12px; flex-wrap:wrap; justify-content:center; }
    .sv-btn { border-radius:999px; padding:12px 22px; font-weight:600; text-decoration:none; }
    .sv-btn-primary { background:var(--clr-accent); color:#fff; }
    .sv-btn-ghost { border:1px solid var(--clr-border); color:var(--clr-primary); }
    @media (max-width: 720px) {
      .sv-section { padding: 42px 0; }
      .sv-container { padding: 0 16px; }
      .sv-cta-band { padding: 24px 16px; border-radius: 16px; }
      .sv-cta-actions { display: flex; }
      .sv-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class CtaBandComponent {}
