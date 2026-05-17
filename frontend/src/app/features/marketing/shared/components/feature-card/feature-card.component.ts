import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MarketingFeature } from '../../../../../core/services/marketing.service';

@Component({
  selector: 'sv-feature-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="sv-card">
      <span class="sv-eyebrow">{{ feature.category }}</span>
      <h3>{{ feature.name }}</h3>
      <p class="sv-muted">{{ feature.shortDescription }}</p>
      <ul *ngIf="feature.highlights?.length">
        <li *ngFor="let h of feature.highlights">{{ h }}</li>
      </ul>
    </article>
  `,
  styles: [`
    .sv-card { background:var(--clr-surface); border:1px solid var(--clr-border); border-radius:16px; padding:24px; }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: .76rem; font-weight: 600; color:var(--clr-accent); }
    h3 { margin:10px 0 8px; font-family:'Fraunces', Georgia, serif; }
    .sv-muted { color:var(--clr-text-secondary); margin:0; }
    ul { margin:10px 0 0; padding-left:18px; }
  `]
})
export class FeatureCardComponent {
  @Input({ required: true }) feature!: MarketingFeature;
}
