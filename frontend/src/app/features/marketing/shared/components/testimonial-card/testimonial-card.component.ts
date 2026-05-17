import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MarketingTestimonial } from '../../../../../core/services/marketing.service';

@Component({
  selector: 'sv-testimonial-card',
  standalone: true,
  imports: [NgIf],
  template: `
    <article class="sv-card">
      <div class="sv-stars">{{ stars }}</div>
      <p class="sv-quote">"{{ t.quote }}"</p>
      <h3>{{ t.name }}</h3>
      <small>{{ t.designation }}<span *ngIf="t.designation && t.institution"> · </span>{{ t.institution }}</small>
    </article>
  `,
  styles: [`
    .sv-card { background:var(--clr-surface); border:1px solid var(--clr-border); border-radius:16px; padding:24px; }
    .sv-stars { color:var(--clr-accent); letter-spacing:2px; }
    .sv-quote { margin:12px 0 16px; color:var(--clr-text); }
    h3 { margin:0; font-family:'Fraunces', Georgia, serif; }
    small { color:var(--clr-text-secondary); }
  `]
})
export class TestimonialCardComponent {
  @Input({ required: true }) t!: MarketingTestimonial;
  get stars(): string {
    const rating = Math.max(0, Math.min(5, this.t?.rating ?? 0));
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
