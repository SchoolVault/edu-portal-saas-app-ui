import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sv-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="sv-hero">
      <div class="sv-container">
        <div class="sv-hero__content">
          <h1>{{ title }}</h1>
          <p class="sv-hero__lead">{{ subtitle }}</p>
          <div class="sv-hero__ctas">
            <a class="sv-btn sv-btn-primary" routerLink="/request-demo">Request a Demo</a>
            <a class="sv-btn sv-btn-ghost" routerLink="/features">Modules</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sv-container { width:100%; max-width:100%; margin:0 auto; padding:0 clamp(14px, 2.2vw, 32px); }
    .sv-hero {
      position: relative;
      overflow: hidden;
      padding: clamp(44px, 6.4vw, 76px) 0 clamp(14px, 2.8vw, 26px);
      background:
        radial-gradient(900px 380px at 88% -8%, color-mix(in srgb, var(--clr-primary) 24%, transparent), transparent 65%),
        radial-gradient(760px 300px at -4% 8%, color-mix(in srgb, var(--clr-accent) 14%, transparent), transparent 62%);
    }
    .sv-hero__content {
      max-width: 760px;
      padding: clamp(16px, 2.4vw, 24px) 0;
    }
    h1 { margin:0; font-family:'Fraunces', Georgia, serif; font-size: clamp(2.25rem, 4.5vw, 3.5rem); line-height:1.08; letter-spacing:-0.02em; }
    .sv-hero__lead { font-size:1.08rem; color:var(--clr-text-secondary); max-width:640px; margin:14px 0 18px; line-height:1.42; }
    .sv-hero__ctas { display:flex; gap:12px; flex-wrap:wrap; justify-content:flex-start; }
    .sv-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border-radius:999px; font-weight:600; text-decoration:none; }
    .sv-btn-primary { background:var(--clr-accent); color:#fff; }
    .sv-btn-ghost { color:var(--clr-primary); border:1px solid var(--clr-border); }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-hero { padding: clamp(36px, 7.8vw, 48px) 0 14px; }
      .sv-hero__content { max-width: 100%; }
      .sv-hero__lead { margin: 12px 0 14px; font-size: 1rem; }
      .sv-hero__ctas { gap: 10px; }
      .sv-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class HeroComponent {
  @Input() title = 'School operations, unified and simplified.';
  @Input() subtitle = 'Manage admissions, academics, attendance, fees, payroll and communication in one secure platform.';
}
