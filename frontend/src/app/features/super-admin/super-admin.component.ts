import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { PlatformDashboardData, PlatformSchoolAdmin, PlatformSchoolSummary } from '../../core/models/models';
import { PlatformService } from '../../core/services/platform.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

Chart.register(...registerables);

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ErpPaginationComponent, TranslateModule],
  styles: [
    `
      .sa-detail-shell {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
      }
      .sa-hero {
        border-radius: var(--radius-lg, 12px);
        border: 1px solid var(--clr-border-light, #e8eef0);
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--clr-primary, #1b3a30) 12%, var(--clr-surface, #fff)) 0%,
          var(--clr-surface, #fff) 55%
        );
        padding: 1rem 1.1rem;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .sa-hero__title {
        font-size: 1.05rem;
        font-weight: 800;
        margin: 0 0 0.25rem;
        color: var(--clr-text-primary, #0f172a);
      }
      .sa-hero__meta {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
        margin-bottom: 0.75rem;
      }
      .sa-stat-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
      }
      .sa-stat-pill {
        border-radius: var(--radius-md, 10px);
        background: var(--clr-surface, #fff);
        border: 1px solid var(--clr-border-light, #e8eef0);
        padding: 0.55rem 0.65rem;
        text-align: center;
      }
      .sa-stat-pill__value {
        font-weight: 800;
        font-size: 1.1rem;
        color: var(--clr-text-primary, #0f172a);
        line-height: 1.1;
      }
      .sa-stat-pill__label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--clr-text-muted, #64748b);
        margin-top: 0.15rem;
      }
      .sa-admin-card {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.85rem 0.9rem;
        border-radius: var(--radius-md, 10px);
        border: 1px solid var(--clr-border-light, #e8eef0);
        background: var(--clr-surface, #fff);
        margin-bottom: 0.6rem;
      }
      .sa-admin-card:last-child {
        margin-bottom: 0;
      }
      .sa-admin-card__body {
        flex: 1;
        min-width: 0;
      }
      .sa-admin-card__name {
        font-weight: 700;
        font-size: 0.95rem;
        margin: 0 0 0.15rem;
        color: var(--clr-text-primary, #0f172a);
      }
      .sa-admin-card__sub {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
        margin: 0;
        word-break: break-word;
      }
    `,
  ],
  template: `
    <div data-testid="super-admin-page">
      <div class="d-flex justify-content-between align-items-end mb-4 animate-in flex-wrap gap-2">
        <div>
          <div class="badge-erp badge-info mb-2">{{ 'superAdmin.badge' | translate }}</div>
          <h2 style="font-size: 28px; font-weight: 800;">{{ 'superAdmin.title' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'superAdmin.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 align-self-center flex-wrap">
          <a routerLink="/app/platform-schools" class="btn-outline-erp btn-sm">{{ 'superAdmin.schoolDirectory' | translate }}</a>
          <a
            routerLink="/app/platform-feature-rollout"
            [queryParams]="selectedSchool ? { tenantId: selectedSchool.tenantId } : {}"
            class="btn-outline-erp btn-sm">
            {{ 'nav.featureRollout' | translate }}
          </a>
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshPlatform()" [disabled]="refreshing">
            <i class="bi bi-arrow-clockwise"></i>
            {{ refreshing ? ('superAdmin.refreshing' | translate) : ('superAdmin.refresh' | translate) }}
          </button>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-sm-6 col-xl-3" *ngFor="let card of summaryCards">
          <div class="stat-card">
            <div class="stat-icon" [style.background]="card.bg" [style.color]="card.color"><i class="bi" [ngClass]="card.icon"></i></div>
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.labelKey | translate }}</div>
            <div class="stat-change positive">{{ card.subtextKey | translate: card.subtextParams }}</div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-7">
          <div class="erp-card">
            <div class="erp-card-header"><h3 class="erp-card-title">{{ 'superAdmin.charts.schoolGrowth' | translate }}</h3></div>
            <div class="chart-container" style="height: 280px;"><canvas #growthChart></canvas></div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="erp-card" style="height: 100%;">
            <div class="erp-card-header"><h3 class="erp-card-title">{{ 'superAdmin.charts.revenueTrend' | translate }}</h3></div>
            <div class="chart-container" style="height: 280px;"><canvas #revenueChart></canvas></div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-7">
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h3 class="erp-card-title">{{ 'superAdmin.portfolio.title' | translate }}</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">{{ 'superAdmin.portfolio.subtitle' | translate }}</p>
              </div>
            </div>
            <div class="px-3 pt-3 pb-0">
              <label class="erp-label small mb-1">{{ 'superAdmin.portfolio.search' | translate }}</label>
              <input
                type="search"
                class="erp-input"
                [(ngModel)]="schoolSearchInput"
                (ngModelChange)="schoolSearch$.next($event)"
                [placeholder]="'superAdmin.portfolio.searchPh' | translate"
              />
            </div>
            <table class="erp-table">
              <thead>
                <tr>
                  <th>{{ 'superAdmin.portfolio.thSchool' | translate }}</th>
                  <th>{{ 'superAdmin.portfolio.thStudents' | translate }}</th>
                  <th>{{ 'superAdmin.portfolio.thTeachers' | translate }}</th>
                  <th>{{ 'superAdmin.portfolio.thAdmins' | translate }}</th>
                  <th>{{ 'superAdmin.portfolio.thStatus' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let school of schools"
                  (click)="selectSchool(school)"
                  style="cursor: pointer;"
                  [style.background]="selectedSchool?.tenantId === school.tenantId ? 'var(--clr-surface-alt)' : ''"
                >
                  <td>
                    <div style="font-weight: 700;">{{ school.schoolName }}</div>
                    <div style="font-size: 12px; color: var(--clr-text-muted);">
                      {{ school.schoolCode }} · {{ school.address || ('superAdmin.noAddress' | translate) }}
                    </div>
                  </td>
                  <td>{{ school.studentCount }}</td>
                  <td>{{ school.teacherCount }}</td>
                  <td>{{ school.adminCount }}</td>
                  <td>
                    <span class="badge-erp" [ngClass]="school.active ? 'badge-success' : 'badge-warning'">
                      {{ school.active ? ('superAdmin.status.active' | translate) : ('superAdmin.status.attention' | translate) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <app-erp-pagination
              *ngIf="schoolsTotal > 0"
              [totalElements]="schoolsTotal"
              [pageIndex]="schoolsPageIndex"
              [pageSize]="schoolsPageSize"
              (pageIndexChange)="onSchoolsPageIndexChange($event)"
              (pageSizeChange)="onSchoolsPageSizeChange($event)"
            />
          </div>
        </div>
        <div class="col-lg-5">
          <div class="erp-card sa-detail-shell">
            <div class="erp-card-header pb-0">
              <div>
                <h3 class="erp-card-title">{{ 'superAdmin.admins.title' | translate }}</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">
                  {{ selectedSchool?.schoolName || ('superAdmin.admins.selectPrompt' | translate) }}
                </p>
              </div>
            </div>
            <div class="px-3 pb-3 flex-grow-1 d-flex flex-column">
              <div *ngIf="!selectedSchool" class="empty-state" style="padding: 40px 12px;">
                <i class="bi bi-building"></i>
                <h3>{{ 'superAdmin.admins.emptyTitle' | translate }}</h3>
                <p>{{ 'superAdmin.admins.emptyLead' | translate }}</p>
              </div>
              <ng-container *ngIf="selectedSchool as sch">
                <div class="sa-hero mb-2">
                  <div class="sa-hero__title">{{ sch.schoolName }}</div>
                  <div class="sa-hero__meta">
                    <span class="me-2"><i class="bi bi-hash me-1"></i>{{ sch.schoolCode }}</span>
                    <span class="d-block mt-1"><i class="bi bi-hdd-network me-1"></i>{{ 'superAdmin.admins.tenantId' | translate }}: {{ sch.tenantId }}</span>
                  </div>
                  <div class="sa-stat-grid">
                    <div class="sa-stat-pill">
                      <div class="sa-stat-pill__value">{{ sch.studentCount }}</div>
                      <div class="sa-stat-pill__label">{{ 'superAdmin.portfolio.thStudents' | translate }}</div>
                    </div>
                    <div class="sa-stat-pill">
                      <div class="sa-stat-pill__value">{{ sch.teacherCount }}</div>
                      <div class="sa-stat-pill__label">{{ 'superAdmin.portfolio.thTeachers' | translate }}</div>
                    </div>
                    <div class="sa-stat-pill">
                      <div class="sa-stat-pill__value">{{ sch.adminCount }}</div>
                      <div class="sa-stat-pill__label">{{ 'superAdmin.portfolio.thAdmins' | translate }}</div>
                    </div>
                  </div>
                  <div class="mt-2 small text-muted">
                    <i class="bi bi-telephone me-1"></i>{{ 'superAdmin.admins.contactStrip' | translate }}:
                    {{ sch.phone || ('superAdmin.admins.noPhone' | translate) }}
                  </div>
                </div>
                <div class="mb-2" style="font-size: 12px; font-weight: 700; color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
                  {{ 'superAdmin.admins.adminCardTitle' | translate }}
                </div>
                <div *ngFor="let admin of schoolAdmins" class="sa-admin-card">
                  <div
                    class="activity-icon flex-shrink-0"
                    style="width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;"
                    [style.background]="admin.active ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)'"
                    [style.color]="admin.active ? 'var(--clr-success)' : 'var(--clr-warning)'"
                  >
                    <i class="bi" [ngClass]="admin.active ? 'bi-person-check-fill' : 'bi-person-dash-fill'"></i>
                  </div>
                  <div class="sa-admin-card__body">
                    <p class="sa-admin-card__name">{{ admin.name }}</p>
                    <p class="sa-admin-card__sub">{{ admin.email }}</p>
                    <p class="sa-admin-card__sub mb-0">{{ admin.phone || ('superAdmin.admins.noPhone' | translate) }}</p>
                    <span class="badge-erp mt-1" [ngClass]="admin.active ? 'badge-success' : 'badge-warning'" style="font-size: 10px;">
                      {{ admin.active ? ('superAdmin.admins.adminActive' | translate) : ('superAdmin.admins.adminSuspended' | translate) }}
                    </span>
                  </div>
                  <button type="button" class="btn-outline-erp btn-sm align-self-center" (click)="toggleAdmin(admin); $event.stopPropagation()">
                    {{ admin.active ? ('superAdmin.admins.suspend' | translate) : ('superAdmin.admins.activate' | translate) }}
                  </button>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <div class="erp-card">
        <div class="erp-card-header"><h3 class="erp-card-title">{{ 'superAdmin.activity.title' | translate }}</h3></div>
        <div *ngFor="let item of dashboard?.recentActivities" class="activity-item">
          <div class="activity-icon" [style.background]="toneBg(item.tone)" [style.color]="toneColor(item.tone)">
            <i class="bi" [ngClass]="toneIcon(item.tone)"></i>
          </div>
          <div class="activity-content">
            <h5>{{ item.title }}</h5>
            <p>{{ item.description }}</p>
          </div>
          <div style="font-size: 12px; color: var(--clr-text-muted); white-space: nowrap;">{{ item.timestamp }}</div>
        </div>
      </div>
    </div>
  `,
})
export class SuperAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('growthChart') growthChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef?: ElementRef<HTMLCanvasElement>;

  dashboard: PlatformDashboardData | null = null;
  schools: PlatformSchoolSummary[] = [];
  schoolsTotal = 0;
  schoolsPageIndex = 0;
  schoolsPageSize = DEFAULT_ERP_PAGE_SIZE;
  schoolQuery = '';
  schoolSearchInput = '';
  readonly schoolSearch$ = new Subject<string>();
  schoolAdmins: PlatformSchoolAdmin[] = [];
  selectedSchool: PlatformSchoolSummary | null = null;
  summaryCards: Array<{
    labelKey: string;
    value: string;
    subtextKey: string;
    subtextParams?: Record<string, string | number>;
    icon: string;
    bg: string;
    color: string;
  }> = [];
  refreshing = false;
  private growthChart?: Chart;
  private revenueChart?: Chart;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private platformService: PlatformService,
    private translate: TranslateService,
    private confirmDialog: ConfirmDialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cdr.markForCheck();
      setTimeout(() => this.initCharts(), 0);
    });
    this.schoolSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => {
        this.schoolQuery = (q || '').trim();
        this.schoolsPageIndex = 0;
        this.loadSchoolsPage();
      });
    this.refreshPlatform();
  }

  refreshPlatform(): void {
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;
    const prevTenant = this.selectedSchool?.tenantId;
    this.schoolsPageIndex = 0;
    forkJoin({
      dashboard: this.platformService.getDashboard(),
      page: this.platformService.getSchoolsPage(0, this.schoolsPageSize, this.schoolQuery || undefined),
    }).subscribe({
      next: ({ dashboard, page }) => {
        this.applyDashboard(dashboard);
        this.schools = page.content;
        this.schoolsTotal = page.totalElements;
        this.schoolsPageIndex = page.page;
        if (page.content.length) {
          const onPage = prevTenant ? page.content.find(s => s.tenantId === prevTenant) : undefined;
          this.selectSchool(onPage ?? page.content[0]);
        } else {
          this.selectedSchool = null;
          this.schoolAdmins = [];
        }
        this.refreshing = false;
        setTimeout(() => this.initCharts(), 0);
      },
      error: () => {
        this.refreshing = false;
      },
    });
  }

  private loadSchoolsPage(): void {
    this.platformService.getSchoolsPage(this.schoolsPageIndex, this.schoolsPageSize, this.schoolQuery || undefined).subscribe({
      next: page => {
        this.schools = page.content;
        this.schoolsTotal = page.totalElements;
        this.schoolsPageIndex = page.page;
        if (this.selectedSchool && !page.content.some(s => s.tenantId === this.selectedSchool?.tenantId)) {
          /* selection may refer to a row on another page — keep admins panel as-is */
        }
      },
    });
  }

  private applyDashboard(dashboard: PlatformDashboardData): void {
    this.dashboard = dashboard;
    this.summaryCards = [
      {
        labelKey: 'superAdmin.cards.totalSchools',
        value: String(dashboard.totalSchools),
        subtextKey: 'superAdmin.cards.totalSchoolsSub',
        subtextParams: { count: dashboard.activeSchools },
        icon: 'bi-buildings-fill',
        bg: 'rgba(15,23,42,0.08)',
        color: '#0F172A',
      },
      {
        labelKey: 'superAdmin.cards.students',
        value: String(dashboard.totalStudents),
        subtextKey: 'superAdmin.cards.studentsSub',
        icon: 'bi-people-fill',
        bg: 'rgba(14,165,233,0.10)',
        color: '#0284C7',
      },
      {
        labelKey: 'superAdmin.cards.teachers',
        value: String(dashboard.totalTeachers),
        subtextKey: 'superAdmin.cards.teachersSub',
        icon: 'bi-person-badge-fill',
        bg: 'rgba(192,92,61,0.10)',
        color: '#C05C3D',
      },
      {
        labelKey: 'superAdmin.cards.admins',
        value: String(dashboard.totalAdmins),
        subtextKey: 'superAdmin.cards.adminsSub',
        icon: 'bi-shield-lock-fill',
        bg: 'rgba(5,150,105,0.10)',
        color: '#059669',
      },
    ];
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.growthChart?.destroy();
    this.revenueChart?.destroy();
  }

  onSchoolsPageIndexChange(idx: number): void {
    this.schoolsPageIndex = idx;
    this.loadSchoolsPage();
  }

  onSchoolsPageSizeChange(size: number): void {
    this.schoolsPageSize = size;
    this.schoolsPageIndex = 0;
    this.loadSchoolsPage();
  }

  selectSchool(school: PlatformSchoolSummary): void {
    this.selectedSchool = school;
    this.platformService.getSchoolAdmins(school.tenantId).subscribe(admins => (this.schoolAdmins = admins));
  }

  toggleAdmin(admin: PlatformSchoolAdmin): void {
    if (!this.selectedSchool) {
      return;
    }
    const activating = !admin.active;
    this.confirmDialog
      .confirm({
        title: this.translate.instant(
          activating ? 'superAdmin.confirm.toggleActivateTitle' : 'superAdmin.confirm.toggleSuspendTitle'
        ),
        message: this.translate.instant(
          activating ? 'superAdmin.confirm.toggleActivateMessage' : 'superAdmin.confirm.toggleSuspendMessage',
          { name: admin.name }
        ),
        details: activating
          ? undefined
          : [this.translate.instant('superAdmin.confirm.toggleSuspendDetail')],
        variant: activating ? 'primary' : 'warning',
        confirmLabel: activating
          ? this.translate.instant('superAdmin.admins.activate')
          : this.translate.instant('superAdmin.admins.suspend'),
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        this.platformService.toggleSchoolAdminStatus(this.selectedSchool!.tenantId, admin.id, activating).subscribe(updated => {
          this.schoolAdmins = this.schoolAdmins.map(current => (current.id === updated.id ? updated : current));
        });
      });
  }

  toneBg(tone: string): string {
    if (tone === 'success') return 'rgba(5,150,105,0.12)';
    if (tone === 'warning') return 'rgba(217,119,6,0.12)';
    return 'rgba(2,132,199,0.12)';
  }

  toneColor(tone: string): string {
    if (tone === 'success') return 'var(--clr-success)';
    if (tone === 'warning') return 'var(--clr-warning)';
    return 'var(--clr-info)';
  }

  toneIcon(tone: string): string {
    if (tone === 'success') return 'bi-check-circle-fill';
    if (tone === 'warning') return 'bi-exclamation-triangle-fill';
    return 'bi-lightning-charge-fill';
  }

  private initCharts(): void {
    if (!this.dashboard || !this.growthChartRef || !this.revenueChartRef) {
      return;
    }

    this.growthChart?.destroy();
    this.revenueChart?.destroy();

    const newSchoolsLabel = this.translate.instant('superAdmin.charts.datasetNewSchools');
    const mrrLabel = this.translate.instant('superAdmin.charts.datasetMrr');

    this.growthChart = new Chart(this.growthChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.dashboard.schoolGrowth.map(point => point.label),
        datasets: [
          {
            label: newSchoolsLabel,
            data: this.dashboard.schoolGrowth.map(point => point.value),
            borderColor: '#0F172A',
            backgroundColor: 'rgba(15,23,42,0.10)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });

    this.revenueChart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.dashboard.revenueTrend.map(point => point.label),
        datasets: [
          {
            label: mrrLabel,
            data: this.dashboard.revenueTrend.map(point => point.value),
            backgroundColor: 'rgba(14,165,233,0.85)',
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });
  }
}
