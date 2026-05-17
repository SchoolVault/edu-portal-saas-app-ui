import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  MarketingLeadAdmin,
  MarketingLeadDashboard,
  MarketingService,
} from '../../core/services/marketing.service';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';

type LeadStatus = 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'CLOSED';

@Component({
  selector: 'app-super-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ErpDatePickerComponent, ErpPaginationComponent],
  template: `
    <section data-testid="super-admin-leads-page">
      <div class="erp-filter-toolbar mb-4 animate-in">
        <div>
          <div class="badge-erp badge-info mb-2">Platform · Growth Desk</div>
          <h2 class="sa-leads-title">Super Admin Leads Dashboard</h2>
          <p class="text-muted mb-0 sa-leads-subtitle">Track lead inflow, source trends and school-level demand.</p>
        </div>
        <div class="erp-filter-toolbar__actions">
          <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm erp-filter-toolbar__action">
            <i class="bi bi-arrow-left me-1"></i>Platform overview
          </a>
          <button class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="refresh()" [disabled]="loading()">
            <i class="bi bi-arrow-clockwise me-1"></i>{{ loading() ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div class="alert alert-danger py-2 mb-3" *ngIf="errorMessage()">{{ errorMessage() }}</div>
      <div class="alert alert-success py-2 mb-3" *ngIf="successMessage()">{{ successMessage() }}</div>

      <div class="row g-3 mb-3" *ngIf="dashboard() as d">
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon sa-icon-bg"><i class="bi bi-people-fill"></i></div>
            <div class="stat-value">{{ d.totalLeads }}</div>
            <div class="stat-label">Total Leads</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon sa-icon-bg"><i class="bi bi-calendar2-week"></i></div>
            <div class="stat-value">{{ d.leadsLast7Days }}</div>
            <div class="stat-label">Last 7 Days</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon sa-icon-bg"><i class="bi bi-calendar3"></i></div>
            <div class="stat-value">{{ d.leadsLast30Days }}</div>
            <div class="stat-label">Last 30 Days</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon sa-icon-bg"><i class="bi bi-funnel-fill"></i></div>
            <div class="stat-value">{{ d.newLeads }} / {{ d.qualifiedLeads }} / {{ d.contactedLeads }}</div>
            <div class="stat-label">Pipeline (New / Qualified / Contacted)</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3" *ngIf="dashboard() as d">
        <div class="col-lg-4">
          <div class="erp-card p-3 h-100">
            <div class="erp-card-header px-0 pt-0"><h3 class="erp-card-title">Status Distribution</h3></div>
            <div class="d-flex justify-content-between small mb-2" *ngFor="let row of d.byStatus">
              <span>{{ row.key }}</span>
              <strong>{{ row.count }}</strong>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="erp-card p-3 h-100">
            <div class="erp-card-header px-0 pt-0"><h3 class="erp-card-title">Top Sources</h3></div>
            <div class="d-flex justify-content-between small mb-2" *ngFor="let row of d.bySource | slice:0:8">
              <span>{{ row.key }}</span>
              <strong>{{ row.count }}</strong>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="erp-card p-3 h-100">
            <div class="erp-card-header px-0 pt-0"><h3 class="erp-card-title">Top Schools Contacting</h3></div>
            <div class="d-flex justify-content-between small mb-2" *ngFor="let row of d.topSchools">
              <span class="text-truncate pe-2">{{ row.key }}</span>
              <strong>{{ row.count }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="erp-card p-3 mb-3" *ngIf="dashboard() as d">
        <div class="erp-card-header px-0 pt-0"><h3 class="erp-card-title">Lead Trend</h3></div>
        <div class="sa-trend-wrap" *ngIf="d.trend.length > 0; else trendEmpty">
          <div class="sa-trend-axis">
            <span>{{ trendMax(d.trend) }}</span>
            <span>{{ trendMid(d.trend) }}</span>
            <span>0</span>
          </div>
          <div class="sa-trend-scroll">
            <div class="sa-trend-grid"></div>
            <div class="trend-bar" *ngFor="let point of d.trend" [title]="point.label + ': ' + point.count">
              <div class="trend-fill" [style.height.%]="trendHeight(point.count, d.trend)">
                <span class="trend-count">{{ point.count }}</span>
              </div>
              <small>{{ point.label }}</small>
            </div>
          </div>
        </div>
        <ng-template #trendEmpty>
          <div class="sa-trend-empty">No trend points yet for this range.</div>
        </ng-template>
      </div>

      <div class="erp-card p-3">
        <div class="erp-card-header px-0 pt-0">
          <h3 class="erp-card-title">Lead Pipeline</h3>
        </div>
        <div class="sa-quick-range mb-3">
          <button class="btn-outline-erp btn-sm" type="button" (click)="applyQuickRange(7)">Last 7 days</button>
          <button class="btn-outline-erp btn-sm" type="button" (click)="applyQuickRange(30)">Last 30 days</button>
          <button class="btn-outline-erp btn-sm" type="button" (click)="clearDateRange()">All time</button>
        </div>
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-3"><label class="erp-label">Search</label><input class="erp-input" [(ngModel)]="q" placeholder="name/email/school"/></div>
          <div class="col-md-2"><label class="erp-label">Status</label><select class="erp-input" [(ngModel)]="status"><option value="">All</option><option *ngFor="let option of statusOptions" [value]="option">{{ option }}</option></select></div>
          <div class="col-md-2"><label class="erp-label">Source</label><input class="erp-input" [(ngModel)]="source" placeholder="WEBSITE/CALLBACK"/></div>
          <div class="col-md-2"><label class="erp-label">From</label><app-erp-date-picker [(ngModel)]="fromDate" placeholder="From date" [maxDate]="toDate || undefined" /></div>
          <div class="col-md-2"><label class="erp-label">To</label><app-erp-date-picker [(ngModel)]="toDate" placeholder="To date" [minDate]="fromDate || undefined" /></div>
          <div class="col-md-1"><button class="btn-primary-erp btn-sm w-100" (click)="applyFilters()">Apply</button></div>
        </div>

        <div class="table-responsive">
          <table class="erp-table align-middle">
            <thead>
              <tr><th>Lead</th><th>School</th><th>Source</th><th>Status</th><th>Next Action Notes</th><th>Created</th><th class="text-end">Action</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of leads()">
                <td>
                  <strong>{{ lead.fullName }}</strong>
                  <div><small class="text-muted">{{ lead.workEmail }} · {{ lead.phone || 'n/a' }}</small></div>
                  <span class="badge-erp mt-1" [ngClass]="statusBadgeClass(displayStatus(lead.status))">{{ displayStatus(lead.status) }}</span>
                </td>
                <td>{{ lead.schoolName || 'Unknown' }}</td>
                <td>{{ lead.source }}</td>
                <td>
                  <select class="erp-input sa-status-select" [ngModel]="displayStatus(lead.status)" (ngModelChange)="onLeadStatusChange(lead.id, $event)">
                    <option *ngFor="let option of statusOptions" [value]="option">{{ option }}</option>
                  </select>
                </td>
                <td><input class="erp-input sa-note-input" [ngModel]="pendingNote.get(lead.id) ?? lead.notes ?? ''" (ngModelChange)="pendingNote.set(lead.id, $event)" placeholder="Add follow-up note" /></td>
                <td>{{ lead.createdAt | date:'medium' }}</td>
                <td class="text-end"><button class="btn-outline-erp btn-sm" (click)="saveLeadStatus(lead)" [disabled]="isSaving(lead.id)">{{ isSaving(lead.id) ? 'Saving...' : 'Save' }}</button></td>
              </tr>
              <tr *ngIf="leads().length === 0"><td colspan="7" class="text-center text-muted py-3">No leads found for selected filters.</td></tr>
            </tbody>
          </table>
        </div>
        <app-erp-pagination
          *ngIf="totalElements() > 0"
          [totalElements]="totalElements()"
          [pageIndex]="page()"
          [pageSize]="size()"
          (pageIndexChange)="onPageChange($event)"
          (pageSizeChange)="onSizeChange($event)"
        />
      </div>
    </section>
  `,
  styles: [`
    .sa-leads-title { font-size: 28px; font-weight: 800; margin: 0; }
    .sa-leads-subtitle { font-size: 13px; }
    .sa-icon-bg {
      background: color-mix(in srgb, var(--clr-primary, #1b3a30) 12%, var(--clr-surface, #fff));
      color: var(--clr-primary, #1b3a30);
    }
    .sa-trend-wrap {
      position: relative;
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: 10px;
      border: 1px solid var(--clr-border-light, #e8eef0);
      border-radius: 12px;
      padding: 0.75rem;
      background: color-mix(in srgb, var(--clr-surface, #fff) 90%, var(--clr-primary, #1b3a30) 10%);
      min-height: 176px;
    }
    .sa-trend-axis {
      height: 132px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      padding: 2px 0;
      color: var(--clr-text-muted);
      font-size: 10px;
      font-weight: 600;
    }
    .sa-trend-scroll {
      position: relative;
      min-height: 132px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding-bottom: 20px;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }
    .sa-trend-grid {
      position: absolute;
      inset: 0 0 20px 0;
      background:
        repeating-linear-gradient(
          to top,
          color-mix(in srgb, var(--clr-border-light, #e8eef0) 70%, transparent) 0,
          color-mix(in srgb, var(--clr-border-light, #e8eef0) 70%, transparent) 1px,
          transparent 1px,
          transparent 33.3%
        );
      pointer-events: none;
      border-radius: 8px;
    }
    .trend-bar {
      position: relative;
      z-index: 1;
      width: 52px;
      min-width: 52px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      justify-content: flex-end;
      height: 132px;
    }
    .trend-fill {
      width: 100%;
      min-height: 8px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--clr-primary, #1b3a30) 70%, #4f9f84 30%) 0%, var(--clr-primary, #1b3a30) 100%);
      border-radius: 8px 8px 4px 4px;
      box-shadow: 0 6px 14px color-mix(in srgb, var(--clr-primary, #1b3a30) 30%, transparent);
      position: relative;
    }
    .trend-count {
      position: absolute;
      top: -18px;
      right: 4px;
      font-size: 10px;
      font-weight: 700;
      color: var(--clr-text-muted);
    }
    .trend-bar small {
      font-size: 10px;
      color: var(--clr-text-muted);
      text-align: center;
      width: 100%;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sa-trend-empty {
      border: 1px dashed var(--clr-border-light, #e8eef0);
      border-radius: 10px;
      padding: 22px;
      text-align: center;
      color: var(--clr-text-muted);
      background: color-mix(in srgb, var(--clr-surface, #fff) 92%, var(--clr-primary, #1b3a30) 8%);
      font-size: 13px;
    }
    .sa-status-select {
      min-width: 132px;
      font-size: 12px;
      padding: 6px 10px;
      height: auto;
    }
    .sa-note-input {
      min-width: 220px;
      font-size: 12px;
      padding: 6px 10px;
    }
    .sa-quick-range {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    @media (max-width: 767.98px) {
      .sa-leads-title { font-size: 24px; }
      .erp-filter-toolbar__actions { width: 100%; }
      .erp-filter-toolbar__actions > * { flex: 1; justify-content: center; }
      .sa-note-input { min-width: 160px; }
      .sa-trend-wrap { grid-template-columns: 26px 1fr; min-height: 164px; }
      .trend-bar { width: 46px; min-width: 46px; }
    }
  `]
})
export class SuperAdminLeadsComponent implements OnInit {
  readonly statusOptions: LeadStatus[] = ['NEW', 'QUALIFIED', 'CONTACTED', 'CLOSED'];
  readonly loading = signal(false);
  readonly dashboard = signal<MarketingLeadDashboard | null>(null);
  readonly leads = signal<MarketingLeadAdmin[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(20);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly savingLeadIds = signal<Set<string>>(new Set());
  readonly pendingStatus = new Map<string, string>();
  readonly pendingNote = new Map<string, string>();

  q = '';
  status = '';
  source = '';
  fromDate = '';
  toDate = '';

  constructor(private readonly marketing: MarketingService) {}

  ngOnInit(): void {
    this.refresh();
  }

  applyFilters(): void {
    if (!this.validateDateRange()) {
      return;
    }
    this.page.set(0);
    this.refresh();
  }

  applyQuickRange(days: number): void {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    this.fromDate = this.toIsoDate(from);
    this.toDate = this.toIsoDate(to);
    this.applyFilters();
  }

  clearDateRange(): void {
    this.fromDate = '';
    this.toDate = '';
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadLeads();
  }

  onSizeChange(size: number): void {
    this.size.set(size);
    this.page.set(0);
    this.loadLeads();
  }

  refresh(): void {
    if (!this.validateDateRange()) {
      return;
    }
    this.errorMessage.set('');
    this.loading.set(true);
    this.marketing.getAdminLeadDashboard({
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined
    }).subscribe({
      next: d => {
        this.dashboard.set(d);
        this.loadLeads();
      },
      error: () => {
        this.errorMessage.set('Unable to load lead dashboard right now. Please retry.');
        this.dashboard.set(null);
        this.loading.set(false);
      }
    });
  }

  onLeadStatusChange(leadId: string, rawStatus: string): void {
    this.pendingStatus.set(leadId, this.normalizeStatus(rawStatus));
  }

  displayStatus(status: string | null | undefined): LeadStatus {
    return this.normalizeStatus(status);
  }

  statusBadgeClass(status: LeadStatus): string {
    if (status === 'NEW') return 'badge-info';
    if (status === 'QUALIFIED') return 'badge-primary';
    if (status === 'CONTACTED') return 'badge-warning';
    return 'badge-success';
  }

  isSaving(id: string): boolean {
    return this.savingLeadIds().has(id);
  }

  saveLeadStatus(lead: MarketingLeadAdmin): void {
    const status = this.normalizeStatus(this.pendingStatus.get(lead.id) ?? lead.status);
    const note = (this.pendingNote.get(lead.id) ?? lead.notes ?? '').trim();
    this.errorMessage.set('');
    this.successMessage.set('');
    const next = new Set(this.savingLeadIds());
    next.add(lead.id);
    this.savingLeadIds.set(next);
    this.marketing.updateLeadStatus(lead.id, status, note || undefined).subscribe({
      next: () => {
        lead.status = status;
        lead.notes = note || undefined;
        this.pendingStatus.delete(lead.id);
        this.pendingNote.delete(lead.id);
        this.successMessage.set('Lead updated successfully.');
        this.refresh();
        this.removeSavingId(lead.id);
      },
      error: () => {
        this.errorMessage.set('Failed to update lead status. Please try again.');
        this.removeSavingId(lead.id);
      },
    });
  }

  trendHeight(value: number, trend: Array<{ label: string; count: number }>): number {
    const max = Math.max(1, ...trend.map(p => p.count || 0));
    return Math.max(10, Math.round((value / max) * 100));
  }

  trendMax(trend: Array<{ label: string; count: number }>): number {
    return Math.max(1, ...trend.map(p => p.count || 0));
  }

  trendMid(trend: Array<{ label: string; count: number }>): number {
    return Math.round(this.trendMax(trend) / 2);
  }

  private loadLeads(): void {
    if (!this.validateDateRange()) {
      this.loading.set(false);
      return;
    }
    this.marketing.listAdminLeads({
      q: this.q || undefined,
      status: this.status ? this.normalizeStatus(this.status) : undefined,
      source: this.source || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      page: this.page(),
      size: this.size()
    }).subscribe({
      next: resp => {
        this.leads.set(resp.content ?? []);
        this.totalElements.set(resp.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Unable to load leads. Please adjust filters and retry.');
        this.leads.set([]);
        this.totalElements.set(0);
        this.loading.set(false);
      }
    });
  }

  private validateDateRange(): boolean {
    this.errorMessage.set('');
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage.set('From date cannot be later than To date.');
      return false;
    }
    return true;
  }

  private normalizeStatus(raw: string | null | undefined): LeadStatus {
    const status = (raw ?? '').trim().toUpperCase();
    if (status === 'QUALIFIED') return 'QUALIFIED';
    if (status === 'CONTACTED') return 'CONTACTED';
    if (status === 'CLOSED') return 'CLOSED';
    return 'NEW';
  }

  private removeSavingId(id: string): void {
    const next = new Set(this.savingLeadIds());
    next.delete(id);
    this.savingLeadIds.set(next);
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

