import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sv-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="sv-hero">
      <div class="sv-container">
        <h1>{{ title }}</h1>
        <p class="sv-hero__lead">{{ subtitle }}</p>
        <div class="sv-hero__ctas">
          <a class="sv-btn sv-btn-primary" routerLink="/request-demo">Request a Demo</a>
          <a class="sv-btn sv-btn-ghost" routerLink="/features">Modules</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sv-container { max-width:1180px; margin:0 auto; padding:0 24px; }
    .sv-hero { padding: clamp(72px, 10vw, 128px) 0 clamp(56px, 8vw, 96px); }
    h1 { margin:0; font-family:'Fraunces', Georgia, serif; font-size: clamp(2.25rem, 4.5vw, 3.5rem); line-height:1.15; }
    .sv-hero__lead { font-size:1.15rem; color:var(--clr-text-secondary); max-width:640px; margin:20px 0 32px; }
    .sv-hero__ctas { display:flex; gap:14px; flex-wrap:wrap; }
    .sv-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border-radius:999px; font-weight:600; text-decoration:none; }
    .sv-btn-primary { background:var(--clr-accent); color:#fff; }
    .sv-btn-ghost { color:var(--clr-primary); border:1px solid var(--clr-border); }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-hero__lead { margin: 16px 0 22px; font-size: 1rem; }
      .sv-hero__ctas { gap: 10px; }
      .sv-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class HeroComponent {
  @Input() title = 'School operations, unified and simplified.';
  @Input() subtitle = 'Manage admissions, academics, attendance, fees, payroll and communication in one secure platform.';
}
