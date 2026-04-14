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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PlatformDashboardData, PlatformSchoolAdmin, PlatformSchoolSummary } from '../../core/models/models';
import { PlatformService } from '../../core/services/platform.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';

Chart.register(...registerables);

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ErpPaginationComponent, TranslateModule],
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
          <div class="erp-card" style="height: 100%;">
            <div class="erp-card-header">
              <div>
                <h3 class="erp-card-title">{{ 'superAdmin.admins.title' | translate }}</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">
                  {{ selectedSchool?.schoolName || ('superAdmin.admins.selectPrompt' | translate) }}
                </p>
              </div>
            </div>
            <div *ngIf="!selectedSchool" class="empty-state" style="padding: 48px 16px;">
              <i class="bi bi-building"></i>
              <h3>{{ 'superAdmin.admins.emptyTitle' | translate }}</h3>
              <p>{{ 'superAdmin.admins.emptyLead' | translate }}</p>
            </div>
            <div *ngIf="selectedSchool">
              <div class="insight-card mb-3" [style.border-left]="'4px solid ' + (selectedSchool.primaryColor || 'var(--clr-primary)')">
                <div class="insight-label">{{ 'superAdmin.admins.snapshotLabel' | translate }}</div>
                <div class="insight-value">
                  {{ 'superAdmin.admins.snapshotStudents' | translate: { count: selectedSchool.studentCount } }}
                </div>
                <div class="insight-subtext">
                  {{
                    'superAdmin.admins.snapshotSub'
                      | translate
                        : {
                            teachers: selectedSchool.teacherCount,
                            admins: selectedSchool.adminCount,
                            phone: selectedSchool.phone || ('superAdmin.admins.noPhone' | translate),
                          }
                  }}
                </div>
              </div>
              <div *ngFor="let admin of schoolAdmins" class="activity-item">
                <div
                  class="activity-icon"
                  [style.background]="admin.active ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)'"
                  [style.color]="admin.active ? 'var(--clr-success)' : 'var(--clr-warning)'"
                >
                  <i class="bi" [ngClass]="admin.active ? 'bi-person-check-fill' : 'bi-person-dash-fill'"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ admin.name }}</h5>
                  <p>{{ admin.email }} · {{ admin.phone || ('superAdmin.admins.noPhone' | translate) }}</p>
                </div>
                <button class="btn-outline-erp btn-sm" (click)="toggleAdmin(admin); $event.stopPropagation()">
                  {{ admin.active ? ('superAdmin.admins.suspend' | translate) : ('superAdmin.admins.activate' | translate) }}
                </button>
              </div>
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
    this.platformService.toggleSchoolAdminStatus(this.selectedSchool.tenantId, admin.id, !admin.active).subscribe(updated => {
      this.schoolAdmins = this.schoolAdmins.map(current => (current.id === updated.id ? updated : current));
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
