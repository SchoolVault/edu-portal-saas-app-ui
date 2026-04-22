import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PlatformHealthSnapshot,
  PlatformLifecycleObservability,
  PlatformLifecycleSummary,
  PlatformStorageReconciliation,
} from '../../core/models/models';
import { PlatformHealthService } from '../../core/services/platform-health.service';
import { PlatformService } from '../../core/services/platform.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-platform-health',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .ph-table-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 12px;
      border: 1px solid var(--clr-border-light);
    }
    .ph-table {
      min-width: 560px;
      margin-bottom: 0;
    }
    @media (max-width: 575.98px) {
      .ph-table-wrap {
        overflow: visible;
        border: 0;
      }
      .ph-table {
        min-width: 0;
      }
      .ph-table thead {
        display: none;
      }
      .ph-table tbody tr {
        display: block;
        border: 1px solid var(--clr-border-light);
        border-radius: 12px;
        padding: 0.6rem;
        margin-bottom: 0.55rem;
        background: var(--clr-surface);
      }
      .ph-table tbody td {
        display: flex;
        justify-content: space-between;
        gap: 0.6rem;
        border: 0;
        padding: 0.3rem 0;
        text-align: right;
      }
      .ph-table tbody td::before {
        content: attr(data-label);
        color: var(--clr-text-muted);
        font-weight: 600;
        text-align: left;
      }
    }
  `],
  template: `
    <div class="animate-in" style="max-width: 960px; margin: 0 auto;" data-testid="platform-health-page">
      <div class="erp-filter-toolbar mb-4">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">System health</h2>
          <p class="text-muted mb-0 small">Platform runtime snapshot for super administrators. School-scoped data is not shown here.</p>
        </div>
        <div class="erp-filter-toolbar__actions">
          <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="load()" [disabled]="loading">
            <i class="bi bi-arrow-clockwise me-1"></i>{{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </div>
      <div *ngIf="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <div *ngIf="snap && !loading" class="row g-3">
        <div class="col-md-6">
          <div class="erp-card h-100">
            <h3 class="erp-card-title" style="font-size: 15px;">JVM heap</h3>
            <p class="mb-1"><strong>{{ formatBytes(snap.jvm.heapUsedBytes) }}</strong> used · max {{ formatBytes(snap.jvm.heapMaxBytes) }}</p>
            <div class="progress" style="height: 8px; border-radius: 4px;">
              <div
                class="progress-bar"
                role="progressbar"
                [style.width.%]="snap.jvm.heapUsagePercent"
                [class.bg-warning]="snap.jvm.heapUsagePercent > 80"
                [class.bg-danger]="snap.jvm.heapUsagePercent > 92"></div>
            </div>
            <p class="text-muted small mb-0 mt-2">{{ snap.jvm.heapUsagePercent }}% of max heap</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="erp-card h-100">
            <h3 class="erp-card-title" style="font-size: 15px;">Disk ({{ snap.disk.path }})</h3>
            <p class="mb-1">Usable <strong>{{ formatBytes(snap.disk.usableBytes) }}</strong> of {{ formatBytes(snap.disk.totalBytes) }}</p>
            <div class="progress" style="height: 8px; border-radius: 4px;">
              <div
                class="progress-bar bg-secondary"
                role="progressbar"
                [style.width.%]="snap.disk.usagePercent"></div>
            </div>
            <p class="text-muted small mb-0 mt-2">{{ snap.disk.usagePercent }}% allocated</p>
          </div>
        </div>
        <div class="col-12">
          <div class="erp-card" *ngIf="snap.sloSignals?.length">
            <h3 class="erp-card-title" style="font-size: 15px;">SLO signals</h3>
            <div class="ph-table-wrap">
              <table class="erp-table ph-table">
                <thead><tr><th>Signal</th><th>Value</th><th>Warn</th><th>Critical</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let signal of snap.sloSignals">
                    <td data-label="Signal"><strong>{{ signal.label }}</strong></td>
                    <td data-label="Value">{{ signal.value }}{{ signal.unit || '' }}</td>
                    <td data-label="Warn">{{ signal.warnThreshold }}</td>
                    <td data-label="Critical">{{ signal.criticalThreshold }}</td>
                    <td data-label="Status"><span class="badge-erp" [ngClass]="badgeClass(signal.status)">{{ signal.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="erp-card">
            <h3 class="erp-card-title" style="font-size: 15px;">Components</h3>
            <div class="ph-table-wrap">
            <table class="erp-table ph-table">
              <thead><tr><th>Service</th><th>Status</th><th>Detail</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of snap.components">
                  <td data-label="Service"><strong>{{ c.name }}</strong></td>
                  <td data-label="Status">
                    <span class="badge-erp" [ngClass]="badgeClass(c.status)">{{ c.status }}</span>
                  </td>
                  <td data-label="Detail" class="text-muted small">{{ c.detail || '—' }}</td>
                </tr>
              </tbody>
            </table>
            </div>
            <p class="text-muted small mb-0 mt-3">Last checked: {{ snap.checkedAt | date: 'medium' }}</p>
          </div>
        </div>
        <div class="col-12" *ngIf="lifecycleSummary">
          <div class="erp-card">
            <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <h3 class="erp-card-title mb-0" style="font-size: 15px;">Lifecycle and storage</h3>
              <button type="button" class="btn-outline-erp btn-sm" (click)="runStorageReconcile()" [disabled]="reconciling">
                <i class="bi bi-shield-check"></i> {{ reconciling ? 'Reconciling…' : 'Run dry-run reconcile' }}
              </button>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <div class="small text-muted">Archived records</div>
                <div class="fw-semibold">{{ lifecycleSummary.archivedRecordCount }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Latest archive</div>
                <div class="fw-semibold">{{ lifecycleSummary.latestArchivedAt || '—' }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Tracked report files</div>
                <div class="fw-semibold">{{ lifecycleSummary.reportStorageTrackedRows }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Missing report files</div>
                <div class="fw-semibold">{{ lifecycleSummary.reportStorageMissingFiles }}</div>
              </div>
            </div>
            <div class="small text-muted mt-3" *ngIf="lifecycleObservability">
              Archive lag {{ lifecycleObservability.archiveLagDays }} day(s), total archived {{ lifecycleObservability.totalArchivedRecords }}.
            </div>
            <div class="small text-muted mt-2" *ngIf="lastReconcileResult">
              Reconcile result: scanned {{ lastReconcileResult.scannedFiles }}, referenced {{ lastReconcileResult.referencedFiles }},
              missing {{ lastReconcileResult.missingFiles }}, orphan {{ lastReconcileResult.orphanFiles }}.
            </div>
          </div>
        </div>
        <div class="col-12" *ngIf="snap.alerts?.length">
          <div class="erp-card">
            <h3 class="erp-card-title" style="font-size: 15px;">Operational alerts</h3>
            <div class="d-grid gap-2">
              <div
                *ngFor="let alert of snap.alerts"
                class="erp-alert-panel p-3"
                [ngClass]="{
                  'erp-alert-panel--warning': (alert.severity || '').toLowerCase() === 'warning',
                  'erp-alert-panel--danger': (alert.severity || '').toLowerCase() === 'critical'
                }">
                <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                  <div>
                    <div class="fw-semibold">{{ alert.title }}</div>
                    <div class="small text-muted">{{ alert.detail || 'No details' }}</div>
                    <div class="small mt-1"><strong>Action:</strong> {{ alert.suggestedAction || 'Inspect operational logs and metrics.' }}</div>
                  </div>
                  <span class="badge-erp" [ngClass]="badgeClass((alert.severity || '').toUpperCase())">{{ (alert.severity || 'warning') | uppercase }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p *ngIf="loading && !snap" class="text-muted py-5 text-center">Loading health data…</p>
    </div>
  `
})
export class PlatformHealthComponent implements OnInit {
  snap: PlatformHealthSnapshot | null = null;
  lifecycleSummary: PlatformLifecycleSummary | null = null;
  lifecycleObservability: PlatformLifecycleObservability | null = null;
  lastReconcileResult: PlatformStorageReconciliation | null = null;
  loading = false;
  reconciling = false;
  error = '';

  constructor(
    private health: PlatformHealthService,
    private platformService: PlatformService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      health: this.health.getSnapshot(),
      lifecycleSummary: this.platformService.getLifecycleSummary(),
      lifecycleObservability: this.platformService.getLifecycleObservability(),
    }).subscribe({
      next: ({ health, lifecycleSummary, lifecycleObservability }) => {
        this.snap = health;
        this.lifecycleSummary = lifecycleSummary;
        this.lifecycleObservability = lifecycleObservability;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load platform health.';
      }
    });
  }

  runStorageReconcile(): void {
    this.reconciling = true;
    this.platformService.reconcileReportStorage(true, false).subscribe({
      next: result => {
        this.lastReconcileResult = result;
        this.reconciling = false;
      },
      error: () => {
        this.reconciling = false;
      }
    });
  }

  formatBytes(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' GB';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' MB';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + ' KB';
    return String(n) + ' B';
  }

  badgeClass(status: string): string {
    const u = (status || '').toUpperCase();
    if (u === 'UP' || u === 'OK') return 'badge-success';
    if (u === 'WARN' || u === 'DEGRADED') return 'badge-warning';
    if (u === 'DOWN' || u === 'OUTAGE') return 'badge-danger';
    return 'badge-neutral';
  }
}
