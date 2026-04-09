import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformHealthSnapshot } from '../../core/models/models';
import { PlatformHealthService } from '../../core/services/platform-health.service';

@Component({
  selector: 'app-platform-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-in" style="max-width: 960px; margin: 0 auto;" data-testid="platform-health-page">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">System health</h2>
          <p class="text-muted mb-0 small">Platform runtime snapshot for super administrators. School-scoped data is not shown here.</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm" (click)="load()" [disabled]="loading">
          <i class="bi bi-arrow-clockwise"></i> {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
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
          <div class="erp-card">
            <h3 class="erp-card-title" style="font-size: 15px;">Components</h3>
            <table class="erp-table mb-0">
              <thead><tr><th>Service</th><th>Status</th><th>Detail</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of snap.components">
                  <td><strong>{{ c.name }}</strong></td>
                  <td>
                    <span class="badge-erp" [ngClass]="badgeClass(c.status)">{{ c.status }}</span>
                  </td>
                  <td class="text-muted small">{{ c.detail || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p class="text-muted small mb-0 mt-3">Last checked: {{ snap.checkedAt | date: 'medium' }}</p>
          </div>
        </div>
      </div>
      <p *ngIf="loading && !snap" class="text-muted py-5 text-center">Loading health data…</p>
    </div>
  `
})
export class PlatformHealthComponent implements OnInit {
  snap: PlatformHealthSnapshot | null = null;
  loading = false;
  error = '';

  constructor(private health: PlatformHealthService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.health.getSnapshot().subscribe({
      next: s => {
        this.snap = s;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load platform health.';
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
