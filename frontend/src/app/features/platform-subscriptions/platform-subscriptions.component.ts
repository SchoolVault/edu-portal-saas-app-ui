import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../core/services/platform.service';
import { PlatformSubscriptionPlan } from '../../core/models/models';

@Component({
  selector: 'app-platform-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="platform-subs-root" data-testid="platform-subscriptions-page">
      <div class="platform-subs-inner animate-in">
        <div class="erp-filter-toolbar mb-4">
          <div>
            <div class="badge-erp badge-info mb-2">Platform</div>
            <h2 class="platform-subs-title">Subscription plans</h2>
            <p class="text-muted mb-0 platform-subs-lead">
              Commercial packaging for school workspaces: capacity, modules, and support. Provisioning and billing integrations plug into the same catalog the UI loads today.
            </p>
          </div>
          <div class="erp-filter-toolbar__actions">
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="refreshPageData()" [disabled]="loadingPlans || saving">
              <i class="bi bi-arrow-clockwise me-1"></i>{{ loadingPlans ? 'Refreshing...' : 'Refresh' }}
            </button>
            <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm erp-filter-toolbar__action"><i class="bi bi-arrow-left me-1"></i>Platform overview</a>
          </div>
        </div>

        <div *ngIf="pageError" class="alert alert-danger py-2 mb-4">{{ pageError }}</div>
        <div *ngIf="saveBanner" class="alert alert-success py-2 mb-4">{{ saveBanner }}</div>

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
                <div class="d-flex flex-wrap gap-2 mt-auto pt-3 platform-plan-actions">
                  <button type="button" class="btn-outline-erp btn-sm" (click)="openDetail(p)">View details</button>
                  <button type="button" class="btn-primary-erp btn-sm" (click)="openEdit(p)">Edit catalog</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="detailPlan" (click)="closeDetail()">
        <div class="modal-content-erp platform-plan-modal" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ detailPlan.name }}</h3>
            <button type="button" class="btn-icon" (click)="closeDetail()" [attr.aria-label]="'platformUi.closeAlert' | translate"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="text-muted small mb-3">{{ detailPlan.code }} · Catalog row for provisioning &amp; billing adapters</p>
            <dl class="platform-detail-dl row g-3">
              <div class="col-md-6">
                <dt>Monthly price (minor units)</dt>
                <dd>{{ detailPlan.monthlyPriceMinorUnits }} {{ detailPlan.currency }}</dd>
              </div>
              <div class="col-md-6">
                <dt>Recommended default</dt>
                <dd>{{ detailPlan.recommended ? 'Yes' : 'No' }}</dd>
              </div>
              <div class="col-12">
                <dt>Description</dt>
                <dd>{{ detailPlan.description }}</dd>
              </div>
              <div class="col-md-6">
                <dt>Capacity</dt>
                <dd>{{ detailPlan.maxStudentsLabel || '—' }}</dd>
              </div>
              <div class="col-md-6">
                <dt>Support</dt>
                <dd>{{ detailPlan.supportTier || '—' }}</dd>
              </div>
              <div class="col-12">
                <dt>Billing cadence</dt>
                <dd>{{ detailPlan.billingCadence || '—' }}</dd>
              </div>
              <div class="col-12">
                <dt>Commercial notes</dt>
                <dd class="text-secondary">{{ detailPlan.commercialNotes || '—' }}</dd>
              </div>
              <div class="col-12">
                <dt>Integration price key</dt>
                <dd><code class="small">{{ detailPlan.integrationPriceKey || '—' }}</code></dd>
              </div>
              <div class="col-12">
                <dt>Modules</dt>
                <dd>
                  <div class="platform-module-chips">
                    <span class="platform-chip" *ngFor="let m of detailPlan.modules">{{ m }}</span>
                  </div>
                </dd>
              </div>
              <div class="col-12">
                <dt>Highlights</dt>
                <dd>
                  <ul class="platform-plan-highlights mb-0">
                    <li *ngFor="let h of detailPlan.highlights">{{ h }}</li>
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeDetail()">Close</button>
            <button type="button" class="btn-primary-erp" (click)="openEditFromDetail()">Edit catalog</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="editDraft" (click)="closeEdit()">
        <div class="modal-content-erp platform-plan-modal" style="max-width: 720px;" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>Edit {{ editDraft.code }}</h3>
            <button type="button" class="btn-icon" (click)="closeEdit()" [disabled]="saving" [attr.aria-label]="'platformUi.closeAlert' | translate"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div *ngIf="editError" class="alert alert-danger py-2 small">{{ editError }}</div>
            <p class="text-muted small">Uses the same JSON body as <code>PUT /api/v1/platform/subscription-plans/:code</code>; the tier code in the URL cannot be changed here.</p>
            <div class="row g-3">
              <div class="col-md-8 erp-form-group">
                <label class="erp-label">Display name</label>
                <input type="text" class="erp-input" [(ngModel)]="editDraft.name" />
              </div>
              <div class="col-md-4 erp-form-group">
                <label class="erp-label">Currency</label>
                <input type="text" class="erp-input" [(ngModel)]="editDraft.currency" maxlength="8" />
              </div>
              <div class="col-12 erp-form-group">
                <label class="erp-label">Description</label>
                <textarea class="erp-input" rows="3" [(ngModel)]="editDraft.description"></textarea>
              </div>
              <div class="col-md-6 erp-form-group">
                <label class="erp-label">Monthly price (minor units)</label>
                <input type="number" class="erp-input" [(ngModel)]="editDraft.monthlyPriceMinorUnits" min="0" />
              </div>
              <div class="col-md-6 erp-form-group d-flex align-items-end">
                <label class="d-flex align-items-center gap-2 mb-0">
                  <input type="checkbox" [(ngModel)]="editDraft.recommended" />
                  <span>Mark as recommended tier</span>
                </label>
              </div>
              <div class="col-md-6 erp-form-group">
                <label class="erp-label">Capacity label</label>
                <input type="text" class="erp-input" [(ngModel)]="editDraft.maxStudentsLabel" />
              </div>
              <div class="col-md-6 erp-form-group">
                <label class="erp-label">Support tier</label>
                <input type="text" class="erp-input" [(ngModel)]="editDraft.supportTier" />
              </div>
              <div class="col-12 erp-form-group">
                <label class="erp-label">Billing cadence</label>
                <input type="text" class="erp-input" [(ngModel)]="editDraft.billingCadence" />
              </div>
              <div class="col-12 erp-form-group">
                <label class="erp-label">Commercial notes (internal / GTM)</label>
                <textarea class="erp-input" rows="2" [(ngModel)]="editDraft.commercialNotes"></textarea>
              </div>
              <div class="col-12 erp-form-group">
                <label class="erp-label">Integration price key</label>
                <input type="text" class="erp-input" [(ngModel)]="editDraft.integrationPriceKey" placeholder="e.g. price_standard_monthly" />
              </div>
              <div class="col-12 erp-form-group">
                <label class="erp-label">Modules (one per line)</label>
                <textarea class="erp-input font-monospace small" rows="5" [(ngModel)]="editModulesText"></textarea>
              </div>
              <div class="col-12 erp-form-group">
                <label class="erp-label">Highlights (one per line)</label>
                <textarea class="erp-input font-monospace small" rows="4" [(ngModel)]="editHighlightsText"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeEdit()" [disabled]="saving">Cancel</button>
            <button type="button" class="btn-primary-erp" (click)="saveEdit()" [disabled]="saving">{{ saving ? 'Saving…' : 'Save catalog' }}</button>
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
    .platform-plan-body { padding: 18px 22px 22px; flex: 1; display: flex; flex-direction: column; }
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
    .platform-plan-actions { border-top: 1px solid var(--clr-border-light); }
    .platform-plan-modal { max-width: 640px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
    .platform-plan-modal .modal-body-erp { overflow-y: auto; }
    .platform-detail-dl dt {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--clr-text-muted); margin-bottom: 4px;
    }
    .platform-detail-dl dd { margin: 0; font-size: 14px; }
  `]
})
export class PlatformSubscriptionsComponent implements OnInit {
  plans: PlatformSubscriptionPlan[] = [];
  pageError = '';
  loadingPlans = false;
  saveBanner = '';
  detailPlan: PlatformSubscriptionPlan | null = null;
  editDraft: PlatformSubscriptionPlan | null = null;
  editModulesText = '';
  editHighlightsText = '';
  editError = '';
  saving = false;

  constructor(private platform: PlatformService) {}

  ngOnInit(): void {
    this.refreshPageData();
  }

  refreshPageData(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.pageError = '';
    this.loadingPlans = true;
    this.platform.listSubscriptionPlans().subscribe({
      next: p => {
        this.plans = p.map(row => ({
          ...row,
          highlights: [...(row.highlights || [])],
          modules: [...(row.modules || [])]
        }));
        this.loadingPlans = false;
      },
      error: e => {
        this.pageError = e?.message || 'Could not load plans.';
        this.loadingPlans = false;
      }
    });
  }

  openDetail(p: PlatformSubscriptionPlan): void {
    this.detailPlan = { ...p, highlights: [...(p.highlights || [])], modules: [...(p.modules || [])] };
  }

  closeDetail(): void {
    this.detailPlan = null;
  }

  openEdit(p: PlatformSubscriptionPlan): void {
    this.closeDetail();
    this.editError = '';
    this.editDraft = this.cloneForEdit(p);
    this.editModulesText = this.linesFromArray(p.modules);
    this.editHighlightsText = this.linesFromArray(p.highlights);
  }

  openEditFromDetail(): void {
    if (!this.detailPlan) return;
    const p = this.detailPlan;
    this.openEdit(p);
  }

  closeEdit(): void {
    if (this.saving) return;
    this.editDraft = null;
    this.editModulesText = '';
    this.editHighlightsText = '';
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.editDraft) return;
    this.saving = true;
    this.editError = '';
    const body: PlatformSubscriptionPlan = {
      ...this.editDraft,
      modules: this.arrayFromLines(this.editModulesText),
      highlights: this.arrayFromLines(this.editHighlightsText)
    };
    this.platform.updateSubscriptionPlan(body.code, body).subscribe({
      next: updated => {
        this.saving = false;
        this.saveBanner = `Saved catalog tier ${updated.code}.`;
        setTimeout(() => { this.saveBanner = ''; }, 4000);
        this.closeEdit();
        this.loadPlans();
      },
      error: e => {
        this.saving = false;
        this.editError = e?.message || 'Save failed.';
      }
    });
  }

  private cloneForEdit(p: PlatformSubscriptionPlan): PlatformSubscriptionPlan {
    return {
      ...p,
      highlights: [...(p.highlights || [])],
      modules: [...(p.modules || [])],
      commercialNotes: p.commercialNotes ?? '',
      integrationPriceKey: p.integrationPriceKey ?? ''
    };
  }

  private linesFromArray(arr?: string[]): string {
    return (arr || []).join('\n');
  }

  private arrayFromLines(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }
}
