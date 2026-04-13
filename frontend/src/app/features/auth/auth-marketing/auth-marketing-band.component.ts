import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AUTH_MARKETING_EN } from './auth-marketing.constants';

@Component({
  selector: 'app-auth-marketing-band',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="auth-marketing-band"
      lang="en"
      dir="ltr"
      aria-label="Marketing and contact (English)"
    >
      <div class="auth-testimonials">
        <h4 class="auth-marketing-kicker">{{ copy.kicker }}</h4>
        <div
          *ngFor="let q of copy.quotes; let last = last"
          class="auth-quote"
          [class.auth-quote-compact]="last"
        >
          <span class="auth-quote-mark" aria-hidden="true">“</span>
          <p>{{ q.text }}</p>
          <div class="auth-quote-meta">{{ q.meta }}</div>
        </div>
      </div>
      <aside class="auth-contact-card" lang="en" dir="ltr">
        <div class="auth-contact-accent" aria-hidden="true"></div>
        <h4 class="auth-marketing-card-title">{{ copy.contactTitle }}</h4>
        <p class="auth-contact-lead">{{ copy.contactLead }}</p>
        <div class="auth-contact-row">
          <span class="auth-contact-icon"><i class="bi bi-envelope"></i></span>
          <a [href]="mailtoHref">{{ copy.email }}</a>
        </div>
        <div class="auth-contact-row">
          <span class="auth-contact-icon"><i class="bi bi-telephone"></i></span>
          <span>{{ copy.phone }}</span>
        </div>
        <div class="auth-contact-row">
          <span class="auth-contact-icon"><i class="bi bi-globe2"></i></span>
          <span>{{ copy.contactSla }}</span>
        </div>
      </aside>
    </section>
  `,
})
export class AuthMarketingBandComponent {
  readonly copy = AUTH_MARKETING_EN;
  readonly mailtoHref = `mailto:${AUTH_MARKETING_EN.email}`;
}
