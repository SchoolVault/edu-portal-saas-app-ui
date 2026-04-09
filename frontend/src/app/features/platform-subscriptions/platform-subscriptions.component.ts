import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlatformService } from '../../core/services/platform.service';
import { PlatformSubscriptionPlan } from '../../core/models/models';

@Component({
  selector: 'app-platform-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="platform-subs-root" data-testid="platform-subscriptions-page">
      <div class="platform-subs-inner animate-in">
        <div class="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
          <div>
            <div class="badge-erp badge-info mb-2">Platform</div>
            <h2 class="platform-subs-title">Subscription plans</h2>
            <p class="text-muted mb-0 platform-subs-lead">
              Commercial packaging for school workspaces: capacity, modules, and support. Provisioning and billing integrations plug into the same catalog the UI loads today.
            </p>
          </div>
          <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm"><i class="bi bi-arrow-left me-1"></i>Platform overview</a>
        </div>

        <div *ngIf="error" class="alert alert-danger py-2 mb-4">{{ error }}</div>

        <div class="erp-card platform-compare-intro mb-4">
          <div class="row g-3 align-items-center">
            <div class="col-md-8">
              <h3 class="mb-2" style="font-size: 17px; font-weight: 800;">How schools are licensed</h3>
              <p class="text-muted mb-0" style="font-size: 14px; line-height: 1.6;">
                Each plan defines student capacity, included product modules, and support expectations. The same catalog powers this screen and your
                billing integration—swap the data source when you connect invoicing or payment automation.
              </p>
            </div>
            <div class="col-md-4 text-md-end">
              <span class="platform-pill-soft"><i class="bi bi-layers me-1"></i>{{ plans.length }} public tiers</span>
            </div>
          </div>
        </div>

        <div class="row g-4 align-items-stretch">
          <div class="col-lg-4" *ngFor="let p of plans">
            <div class="erp-card platform-plan-card h-100" [class.platform-plan-featured]="p.recommended">
              <div *ngIf="p.recommended" class="platform-plan-ribbon">Most schools</div>
              <div class="platform-plan-head">
                <div class="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h3 class="platform-plan-name">{{ p.name }}</h3>
                    <span class="platform-plan-code">{{ p.code }}</span>
                  </div>
                  <div class="platform-plan-price">
                    <ng-container *ngIf="p.monthlyPriceMinorUnits > 0; else customPrice">
                      <span class="platform-price-num">{{ p.currency }} {{ (p.monthlyPriceMinorUnits / 100) | number:'1.0-0' }}</span>
                      <span class="platform-price-suffix">/ mo / workspace</span>
                    </ng-container>
                    <ng-template #customPrice>
                      <span class="platform-price-num">Custom</span>
                      <span class="platform-price-suffix">annual agreement</span>
                    </ng-template>
                  </div>
                </div>
                <p class="platform-plan-desc">{{ p.description }}</p>
                <div class="platform-plan-meta">
                  <div><i class="bi bi-people me-2 text-primary-erp"></i><strong>Capacity</strong><br /><span class="text-muted">{{ p.maxStudentsLabel }}</span></div>
                  <div><i class="bi bi-headset me-2 text-primary-erp"></i><strong>Support</strong><br /><span class="text-muted">{{ p.supportTier }}</span></div>
                  <div class="platform-meta-full"><i class="bi bi-calendar3 me-2 text-primary-erp"></i><strong>Billing</strong><br /><span class="text-muted">{{ p.billingCadence }}</span></div>
                </div>
              </div>
              <div class="platform-plan-body">
                <h4 class="platform-subhead">Included modules</h4>
                <div class="platform-module-chips">
                  <span class="platform-chip" *ngFor="let m of p.modules">{{ m }}</span>
                </div>
                <h4 class="platform-subhead mt-3">Also highlighted</h4>
                <ul class="platform-plan-highlights">
                  <li *ngFor="let h of p.highlights">{{ h }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .platform-subs-root { position: relative; }
    .platform-subs-inner { max-width: 1180px; margin: 0 auto; }
    .platform-subs-title { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .platform-subs-lead { font-size: 13px; max-width: 46rem; line-height: 1.55; }
    .platform-compare-intro { padding: 20px 22px; }
    .platform-pill-soft {
      display: inline-flex; align-items: center; font-size: 12px; font-weight: 600;
      padding: 8px 14px; border-radius: 999px; background: var(--clr-surface-alt); border: 1px solid var(--clr-border-light);
    }
    .platform-plan-card {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--clr-border-light);
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .platform-plan-card:hover { box-shadow: var(--shadow-md); border-color: var(--clr-border); }
    .platform-plan-featured {
      border-color: rgba(192, 92, 61, 0.45);
      box-shadow: 0 8px 28px rgba(27, 58, 48, 0.08);
    }
    .platform-plan-ribbon {
      position: absolute; top: 14px; right: -32px;
      transform: rotate(45deg);
      background: var(--clr-accent); color: white;
      font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
      padding: 6px 40px; text-transform: uppercase;
    }
    .platform-plan-head { padding: 22px 22px 16px; border-bottom: 1px solid var(--clr-border-light); }
    .platform-plan-name { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .platform-plan-code { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--clr-text-muted); }
    .platform-plan-price { text-align: right; }
    .platform-price-num { display: block; font-size: 1.35rem; font-weight: 800; line-height: 1.2; }
    .platform-price-suffix { font-size: 11px; color: var(--clr-text-muted); }
    .platform-plan-desc { font-size: 13px; line-height: 1.55; color: var(--clr-text-secondary); margin: 14px 0 0; }
    .platform-plan-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      margin-top: 16px;
      font-size: 12px;
      line-height: 1.45;
    }
    .platform-meta-full { grid-column: 1 / -1; }
    .platform-plan-body { padding: 18px 22px 22px; flex: 1; }
    .platform-subhead {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
      color: var(--clr-text-muted); margin-bottom: 10px;
    }
    .platform-module-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .platform-chip {
      font-size: 11px; font-weight: 600;
      padding: 5px 10px; border-radius: var(--radius-md);
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border-light);
      color: var(--clr-text-secondary);
    }
    .platform-plan-highlights { margin: 0; padding-left: 1.15rem; font-size: 13px; line-height: 1.55; color: var(--clr-text-secondary); }
    .platform-plan-highlights li { margin-bottom: 6px; }
  `]
})
export class PlatformSubscriptionsComponent implements OnInit {
  plans: PlatformSubscriptionPlan[] = [];
  error = '';

  constructor(private platform: PlatformService) {}

  ngOnInit(): void {
    this.platform.listSubscriptionPlans().subscribe({
      next: p => {
        this.plans = p.map(row => ({
          ...row,
          highlights: [...(row.highlights || [])],
          modules: [...(row.modules || [])]
        }));
      },
      error: e => { this.error = e?.message || 'Could not load plans.'; }
    });
  }
}
