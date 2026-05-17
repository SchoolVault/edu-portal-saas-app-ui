import { Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingFeature, MarketingService } from '../../../core/services/marketing.service';
import { MarketingSeoService } from '../../../core/services/marketing-seo.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FeatureCardComponent } from '../shared/components/feature-card/feature-card.component';
import { CtaBandComponent } from '../shared/components/cta-band/cta-band.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-marketing-features-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FeatureCardComponent, CtaBandComponent, FooterComponent],
  template: `
    <sv-header />
    <section class="sv-section">
      <div class="sv-container">
        <span class="sv-eyebrow">Platform</span>
        <h1 style="margin-top:10px; max-width:840px">One platform. Every school workflow.</h1>
        <p class="sv-muted" style="margin-top:16px; max-width:720px; font-size:1.1rem">
          Explore SchoolVault's full modular catalog. Pick what you need today, extend tomorrow - nothing ever locks you in.
        </p>

        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:36px">
          <input
            class="form-control"
            style="max-width:320px"
            type="search"
            placeholder="Search modules..."
            [ngModel]="q()"
            (ngModelChange)="q.set($event ?? '')"
          />
          <button class="sv-btn" [class.sv-btn-secondary]="selectedCategory()===null" [class.sv-btn-ghost]="selectedCategory()!==null" (click)="selectedCategory.set(null)">All</button>
          <button *ngFor="let c of categories(); trackBy: trackByCategory" class="sv-btn" [class.sv-btn-secondary]="selectedCategory()===c" [class.sv-btn-ghost]="selectedCategory()!==c" (click)="selectedCategory.set(c)">{{ c }}</button>
        </div>

        <div class="feature-section-head">
          <div class="sv-muted small">Showing {{ visible().length }} modules</div>
          <div class="feature-nav-btns">
            <button type="button" class="sv-btn sv-btn-ghost" (click)="scrollFeatureRail(-1)">← Prev</button>
            <button type="button" class="sv-btn sv-btn-ghost" (click)="scrollFeatureRail(1)">Next →</button>
          </div>
        </div>

        <div class="feature-rail" #featureRail>
          <div class="feature-rail-item" *ngFor="let f of visible(); trackBy: trackByFeature">
            <sv-feature-card [feature]="f" />
          </div>
          <div *ngIf="visible().length===0" class="sv-card" style="grid-column: 1 / -1; text-align:center">
            <p class="sv-muted">No modules matched your search.</p>
          </div>
        </div>
      </div>
    </section>
    <sv-cta-band />
    <sv-footer />
  `,
  styles: [`
    :host {
      --sv-primary: var(--clr-primary); --sv-primary-light: var(--clr-primary-light); --sv-accent: var(--clr-accent); --sv-accent-dark: var(--clr-accent-dark);
      --sv-bg: var(--clr-bg); --sv-surface: var(--clr-surface); --sv-ink: var(--clr-text); --sv-muted: var(--clr-text-secondary); --sv-border: var(--clr-border);
      --sv-radius: 12px; --sv-radius-lg: 16px;
      --sv-shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.04), 0 1px 3px rgba(28, 25, 23, 0.06);
      --sv-shadow: 0 4px 14px rgba(28, 25, 23, 0.06), 0 2px 6px rgba(28, 25, 23, 0.04);
      --sv-font-heading: 'Fraunces', 'Avenir Next', 'Iowan Old Style', Georgia, serif;
      --sv-font-body: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
      display: block; background: var(--sv-bg); color: var(--sv-ink); font-family: var(--sv-font-body);
    }
    .sv-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0 clamp(14px, 2.2vw, 32px); }
    .sv-section { padding: clamp(42px, 6.8vw, 78px) 0; }
    h1, h3 { font-family: var(--sv-font-heading); color: var(--sv-ink); letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
    h1 { font-weight: 700; font-size: clamp(2.25rem, 4.5vw, 3.5rem); }
    h3 { font-weight: 600; font-size: 1.375rem; }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 600; color: var(--sv-accent); }
    .sv-muted { color: var(--sv-muted); }
    .sv-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .sv-card { background: var(--sv-surface); border: 1px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 22px; box-shadow: var(--sv-shadow-sm); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
    .sv-card:hover { box-shadow: var(--sv-shadow); border-color: #d6d3d1; transform: translateY(-2px); }
    .sv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.95rem; border: 1px solid transparent; cursor: pointer; text-decoration: none; }
    .sv-btn-secondary { background: var(--sv-primary); color: #fff; }
    .sv-btn-secondary:hover { background: var(--sv-primary-light); color: #fff; }
    .sv-btn-ghost { background: transparent; color: var(--sv-primary); border-color: var(--sv-border); }
    .sv-btn-ghost:hover { background: var(--sv-surface); border-color: var(--sv-primary); }
    .form-control { width: 100%; padding: 12px 14px; border: 1px solid var(--sv-border); border-radius: var(--sv-radius); background: var(--sv-surface); color: var(--sv-ink); font-family: inherit; font-size: 1rem; }
    .form-control:focus { outline: none; border-color: var(--sv-primary); box-shadow: 0 0 0 3px rgba(27,58,48,.12); }
    .form-control::placeholder { color: color-mix(in srgb, var(--sv-muted) 88%, var(--sv-ink) 12%); opacity: 1; }
    [data-theme='dark'] .form-control::placeholder { color: color-mix(in srgb, #ffffff 86%, #cbd5e1 14%); opacity: 1; }
    .feature-section-head { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-top:16px; }
    .feature-nav-btns { display:flex; gap:8px; flex-wrap:wrap; }
    .feature-rail {
      margin-top: 14px;
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
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-section { padding: 34px 0; }
      .sv-btn { width: 100%; justify-content: center; }
      .feature-nav-btns { width: 100%; }
      .feature-nav-btns .sv-btn { flex: 1 1 0; width: auto; }
      .feature-rail-item { flex: 0 0 min(88vw, 340px); }
    }
  `]
})
export class MarketingFeaturesPageComponent implements OnInit {
  @ViewChild('featureRail') featureRail?: ElementRef<HTMLDivElement>;
  readonly features = signal<MarketingFeature[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly q = signal('');
  readonly categories = computed(() => Array.from(new Set(this.features().map(f => f.category))).sort());
  readonly visible = computed(() => {
    const term = this.q().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.features().filter(f => {
      const okCat = !cat || f.category === cat;
      const okTerm = !term
        || f.name.toLowerCase().includes(term)
        || f.shortDescription.toLowerCase().includes(term)
        || f.category.toLowerCase().includes(term)
        || (f.highlights ?? []).some(point => point.toLowerCase().includes(term));
      return okCat && okTerm;
    });
  });

  constructor(
    private readonly marketing: MarketingService,
    private readonly seo: MarketingSeoService
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'EduPortal Features - Unified Modules for School ERP',
      description: 'Explore EduPortal modules for academics, operations, fees, communication, and administration.',
      canonicalPath: '/features'
    });
    this.marketing.listFeatures().subscribe({
      next: list => this.features.set(list),
      error: () => this.features.set([])
    });
  }

  scrollFeatureRail(direction: 1 | -1): void {
    const rail = this.featureRail?.nativeElement;
    if (!rail) return;
    const step = Math.max(rail.clientWidth * 0.8, 280);
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  trackByCategory(_: number, category: string): string {
    return category;
  }

  trackByFeature(_: number, feature: MarketingFeature): string {
    return feature.slug;
  }
}
