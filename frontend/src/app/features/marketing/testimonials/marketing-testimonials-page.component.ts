import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketingService, MarketingTestimonial } from '../../../core/services/marketing.service';
import { MarketingSeoService } from '../../../core/services/marketing-seo.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { TestimonialCardComponent } from '../shared/components/testimonial-card/testimonial-card.component';
import { CtaBandComponent } from '../shared/components/cta-band/cta-band.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-marketing-testimonials-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TestimonialCardComponent, CtaBandComponent, FooterComponent],
  template: `
    <sv-header />
    <section class="sv-section">
      <div class="sv-container">
        <span class="sv-eyebrow">Customers</span>
        <h1 style="margin-top:10px; max-width:780px">Why school leaders choose SchoolVault.</h1>
        <div class="sv-grid" style="margin-top:40px">
          <sv-testimonial-card *ngFor="let testimonial of testimonials()" [t]="testimonial" />
        </div>
      </div>
    </section>
    <sv-cta-band />
    <sv-footer />
  `,
  styles: [`
    :host {
      --sv-primary: var(--clr-primary); --sv-accent: var(--clr-accent); --sv-bg: var(--clr-bg); --sv-surface: var(--clr-surface); --sv-ink: var(--clr-text); --sv-muted: var(--clr-text-secondary); --sv-border: var(--clr-border);
      --sv-radius-lg: 16px; --sv-shadow-sm: 0 1px 2px rgba(28,25,23,.04), 0 1px 3px rgba(28,25,23,.06); --sv-shadow: 0 4px 14px rgba(28,25,23,.06), 0 2px 6px rgba(28,25,23,.04);
      --sv-font-heading: 'Fraunces', 'Avenir Next', 'Iowan Old Style', Georgia, serif; --sv-font-body: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
      display: block; background: var(--sv-bg); color: var(--sv-ink); font-family: var(--sv-font-body);
    }
    .sv-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
    .sv-section { padding: clamp(56px, 9vw, 112px) 0; }
    h1, h3 { font-family: var(--sv-font-heading); color: var(--sv-ink); letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
    h1 { font-weight: 700; font-size: clamp(2.25rem, 4.5vw, 3.5rem); }
    h3 { font-weight: 600; font-size: 1.375rem; }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 600; color: var(--sv-accent); }
    .sv-muted { color: var(--sv-muted); }
    .sv-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .sv-card { background: var(--sv-surface); border: 1px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 28px; box-shadow: var(--sv-shadow-sm); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
    .sv-card:hover { box-shadow: var(--sv-shadow); border-color: #d6d3d1; transform: translateY(-2px); }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MarketingTestimonialsPageComponent implements OnInit {
  readonly testimonials = signal<MarketingTestimonial[]>([]);

  constructor(
    private readonly marketing: MarketingService,
    private readonly seo: MarketingSeoService
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'EduPortal Testimonials - Outcomes from School Leaders',
      description: 'Read testimonials from school leaders using EduPortal for end-to-end operations.',
      canonicalPath: '/testimonials'
    });
    this.marketing.listTestimonials(false).subscribe({
      next: list => this.testimonials.set(list),
      error: () => this.testimonials.set([])
    });
  }
}
