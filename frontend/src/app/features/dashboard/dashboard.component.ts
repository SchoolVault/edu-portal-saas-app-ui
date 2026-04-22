import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErpMonthPickerComponent } from '../../shared/erp-month-picker/erp-month-picker.component';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ParentSelectionService } from '../../core/services/parent-selection.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { OperationsService } from '../../core/services/operations.service';
import { ThemeService } from '../../core/services/theme.service';
import { TenantModuleGateService } from '../../core/services/tenant-module-gate.service';
import {
  AdminDashboardData,
  ParentDashboardData,
  TeacherDashboardData,
  TeacherHomeroomDailyPoint,
} from '../../core/models/models';
import { localIsoDateString } from '../../core/utils/local-date';

Chart.register(...registerables);

interface DashboardAdminKpi {
  labelKey: string;
  value: string;
  icon: string;
  bgColor: string;
  color: string;
  subtextKey: string;
  subtextParams?: Record<string, string | number>;
}

interface DashboardTeacherKpi {
  labelKey: string;
  value: string;
  /** When set, stat-value shows this i18n key instead of {@link value}. */
  valueLabelKey?: string;
  icon: string;
  bgColor: string;
  color: string;
  link: string;
  queryParams?: Record<string, string>;
  /** Secondary line under the title (i18n), e.g. homeroom context. */
  subtextKey?: string;
  /** Optional accent for attendance status tiles. */
  kpiVariant?: 'attendance-pending' | 'attendance-done';
}

interface DashboardParentKpi {
  labelKey: string;
  value: string;
  icon: string;
  bgColor: string;
  color: string;
  /** Secondary line under the label (i18n). */
  contextKey?: string;
  contextParams?: Record<string, string | number>;
  /** When set, shown as plain text (already passed through {@link TranslateService#instant}). */
  resolvedContext?: string;
  tile?: 'children' | 'attendance' | 'result' | 'fee';
  feeUrgency?: 'none' | 'low' | 'medium' | 'high';
}

interface DashboardAdmissionInsight {
  labelKey: string;
  value: string;
  subtextKey: string;
  subtextParams?: Record<string, string | number>;
  icon: string;
  iconBg: string;
  iconColor: string;
  /** Optional trend pill (e.g. vs previous month). */
  badgeKey?: string;
  badgeParams?: Record<string, string | number>;
  badgeVariant?: 'positive' | 'negative' | 'neutral';
}

interface DashboardChartPalette {
  text: string;
  muted: string;
  grid: string;
  tooltipBg: string;
  tooltipText: string;
  admissionsBar: string;
  feeBar: string;
  line: string;
  lineFill: string;
  present: string;
  absent: string;
  late: string;
  excused: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ErpMonthPickerComponent, SchoolClassNamePipe],
  styles: [
    `
      .parent-fee-urgency--high {
        border-color: color-mix(in srgb, var(--clr-danger) 45%, var(--clr-border-light)) !important;
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-danger) 28%, transparent), var(--shadow-sm);
      }
      .parent-fee-urgency--low {
        border-color: color-mix(in srgb, var(--clr-warning) 35%, var(--clr-border-light)) !important;
      }
      a.teacher-kpi-link {
        color: inherit;
        display: block;
        border-radius: var(--radius-md, 12px);
        outline: none;
      }
      a.teacher-kpi-link:focus-visible {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--clr-primary) 45%, transparent);
      }
      a.teacher-kpi-link .stat-card {
        transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        height: 100%;
      }
      a.teacher-kpi-link:hover .stat-card {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.08));
        border-color: color-mix(in srgb, var(--clr-primary) 28%, var(--clr-border-light));
      }
      a.teacher-kpi--att-pending .stat-card {
        border-color: color-mix(in srgb, var(--clr-warning) 35%, var(--clr-border-light));
      }
      a.teacher-kpi--att-done .stat-card {
        border-color: color-mix(in srgb, var(--clr-success) 35%, var(--clr-border-light));
      }
      .teacher-homeroom-legend__swatch {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      .teacher-homeroom-legend__line {
        width: 18px;
        border-top-width: 3px;
        border-top-style: solid;
        display: inline-block;
        vertical-align: middle;
      }
      .dashboard-table-wrap {
        width: 100%;
        overflow-x: auto;
      }
      .dashboard-table-wrap .erp-table {
        min-width: 620px;
      }
      @media (max-width: 992px) {
        .chart-container {
          min-height: 220px;
          height: auto !important;
        }
      }
      @media (max-width: 576px) {
        .erp-card-header {
          align-items: flex-start !important;
        }
        .erp-card-header .d-flex {
          width: 100%;
          justify-content: flex-start !important;
        }
        .stat-card {
          min-height: 132px;
        }
        .chart-container {
          min-height: 190px;
        }
        .dashboard-table-wrap .erp-table {
          min-width: 560px;
        }
      }
    `,
  ],
  template: `
    <div data-testid="dashboard-page">
      <div class="d-flex justify-content-end mb-2" *ngIf="role !== 'parent' || loading">
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshDashboard()" [disabled]="loading || refreshing" data-testid="dashboard-refresh">
          <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? ('dashboard.refreshing' | translate) : ('dashboard.refresh' | translate) }}
        </button>
      </div>
      <div *ngIf="loading" class="empty-state">
        <i class="bi bi-hourglass-split"></i><h3>{{ 'dashboard.loadingTitle' | translate }}</h3><p>{{ 'dashboard.loadingLead' | translate }}</p>
      </div>

      <ng-container *ngIf="!loading && role === 'admin'">
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3" *ngFor="let kpi of adminKPIs">
            <div class="stat-card">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color"><i class="bi" [ngClass]="kpi.icon"></i></div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.labelKey | translate }}</div>
              <div class="stat-change positive">{{ kpi.subtextKey | translate: kpi.subtextParams }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-8">
            <div class="erp-card">
              <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
                <h3 class="erp-card-title mb-0">{{ 'dashboard.admin.intakeCollections' | translate }}</h3>
                <div class="d-flex flex-wrap gap-3 align-items-center small">
                  <label class="d-flex align-items-center gap-2 mb-0" style="cursor: pointer;">
                    <input type="checkbox" [(ngModel)]="showAdmissionsSeries" (change)="updateCombinedTrendChart()" />
                    {{ 'dashboard.admin.legendAdmissions' | translate }}
                  </label>
                  <label class="d-flex align-items-center gap-2 mb-0" style="cursor: pointer;">
                    <input type="checkbox" [(ngModel)]="showFeesSeries" (change)="updateCombinedTrendChart()" />
                    {{ 'dashboard.admin.legendFees' | translate }}
                  </label>
                </div>
              </div>
              <div class="chart-container"><canvas #combinedTrendChart></canvas></div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h3 class="erp-card-title mb-0">{{ 'dashboard.admin.attendanceOverview' | translate }}</h3>
                <div class="d-flex flex-wrap gap-2 small">
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" [attr.title]="'dashboard.admin.slicePresent' | translate">
                    <input type="checkbox" [(ngModel)]="attSlicePresent" (change)="updateAttendanceChart()" />
                    P
                  </label>
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" [attr.title]="'dashboard.admin.sliceAbsent' | translate">
                    <input type="checkbox" [(ngModel)]="attSliceAbsent" (change)="updateAttendanceChart()" />
                    A
                  </label>
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" [attr.title]="'dashboard.admin.sliceLate' | translate">
                    <input type="checkbox" [(ngModel)]="attSliceLate" (change)="updateAttendanceChart()" />
                    L
                  </label>
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" [attr.title]="'dashboard.admin.sliceExcused' | translate">
                    <input type="checkbox" [(ngModel)]="attSliceExcused" (change)="updateAttendanceChart()" />
                    E
                  </label>
                </div>
              </div>
              <div class="chart-container" style="height: 220px;"><canvas #attendanceChart></canvas></div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-5">
            <div class="erp-card erp-card--admissions-snapshot" style="height: 100%;">
              <div class="erp-card-header erp-card-header--stack">
                <div>
                  <h3 class="erp-card-title mb-0">{{ 'dashboard.admin.admissionsSnapshot' | translate }}</h3>
                  <p class="erp-card-subtitle mb-0">{{ 'dashboard.admin.admissionsSnapshotLead' | translate }}</p>
                </div>
              </div>
              <div class="admissions-snapshot-list" role="list">
                <div *ngFor="let insight of admissionInsights" class="admission-snapshot-row" role="listitem">
                  <div class="admission-snapshot-row__icon" [style.background]="insight.iconBg" [style.color]="insight.iconColor">
                    <i class="bi" [ngClass]="insight.icon"></i>
                  </div>
                  <div class="admission-snapshot-row__body">
                    <div class="admission-snapshot-row__label">{{ insight.labelKey | translate }}</div>
                    <div class="admission-snapshot-row__sub">{{ insight.subtextKey | translate: insight.subtextParams }}</div>
                  </div>
                  <div class="admission-snapshot-row__meta">
                    <div class="admission-snapshot-row__value">{{ insight.value }}</div>
                    <div class="admission-snapshot-row__footer" *ngIf="insight.badgeKey">
                      <span
                        class="stat-change"
                        [class.positive]="insight.badgeVariant === 'positive'"
                        [class.negative]="insight.badgeVariant === 'negative'"
                        [class.neutral]="insight.badgeVariant === 'neutral'"
                      >{{ insight.badgeKey | translate: insight.badgeParams }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.admin.admissionsTrend' | translate }}</h3></div>
              <div class="chart-container" style="height: 280px;"><canvas #admissionsTrendChart></canvas></div>
            </div>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.admin.recentActivity' | translate }}</h3></div>
              <div *ngFor="let activity of adminDashboard?.recentActivities" class="activity-item">
                <div class="activity-icon" style="background: rgba(27,58,48,0.1); color: var(--clr-primary);"><i class="bi bi-bell"></i></div>
                <div class="activity-content">
                  <h5>{{ activity.title }}</h5>
                  <p>{{ activity.description || activity.timestamp }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.admin.upcomingEvents' | translate }}</h3></div>
              <div *ngFor="let event of adminDashboard?.upcomingEvents" class="activity-item">
                <div class="activity-icon" style="background: rgba(2,132,199,0.1); color: var(--clr-info);"><i class="bi bi-calendar-event"></i></div>
                <div class="activity-content">
                  <h5>{{ event.title }}</h5>
                  <p>{{ event.date }} &middot; {{ event.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && role === 'teacher'">
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3" *ngFor="let kpi of teacherKPIs">
            <a
              class="teacher-kpi-link"
              [routerLink]="kpi.link"
              [queryParams]="kpi.queryParams || null"
              [attr.aria-label]="kpi.labelKey | translate"
              [ngClass]="{
                'teacher-kpi--att-pending': kpi.kpiVariant === 'attendance-pending',
                'teacher-kpi--att-done': kpi.kpiVariant === 'attendance-done'
              }"
            >
              <div class="stat-card">
                <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color"><i class="bi" [ngClass]="kpi.icon"></i></div>
                <div
                  class="stat-value"
                  [class.text-success]="kpi.kpiVariant === 'attendance-done'"
                  [style.color]="kpi.kpiVariant === 'attendance-pending' ? '#B45309' : null"
                >
                  {{ kpi.valueLabelKey ? (kpi.valueLabelKey | translate) : kpi.value }}
                </div>
                <div class="stat-label">{{ kpi.labelKey | translate }}</div>
                <p class="text-muted small mb-0 mt-1 teacher-kpi-sub" *ngIf="kpi.subtextKey" style="font-size: 11px; line-height: 1.35;">{{ kpi.subtextKey | translate }}</p>
              </div>
            </a>
          </div>
        </div>

        <div class="row g-4 mb-4" *ngIf="teacherDashboard?.homeroomAttendance?.daily?.length">
          <div class="col-lg-8">
            <div class="erp-card">
              <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <h3 class="erp-card-title mb-0">{{ 'dashboard.teacher.homeroomDailyTitle' | translate }}</h3>
                  <p class="text-muted small mb-0 mt-1" *ngIf="teacherDashboard?.homeroomAttendance?.classLabel">{{ teacherDashboard?.homeroomAttendance?.classLabel }}</p>
                </div>
                <div class="teacher-dash-month-field" style="min-width: 200px; max-width: 280px;">
                  <label class="erp-label mb-1" for="teacher-homeroom-month">{{ 'dashboard.teacher.attendanceMonth' | translate }}</label>
                  <app-erp-month-picker
                    inputId="teacher-homeroom-month"
                    dataTestId="teacher-homeroom-month"
                    [(ngModel)]="teacherTrendMonth"
                    (ngModelChange)="onTeacherTrendMonthChange()"
                    placeholderI18nKey="dashboard.teacher.attendanceMonthPh"
                    [maxYm]="teacherHomeroomMaxYm"
                    yearNavMode="plain"
                  />
                </div>
              </div>
              <div class="chart-container" style="height: 300px;"><canvas #teacherHomeroomDailyChart></canvas></div>
              <div class="d-flex flex-wrap gap-3 mt-2 px-1 small align-items-center teacher-homeroom-legend">
                <span class="d-inline-flex align-items-center gap-2 text-muted mb-0">
                  <span class="teacher-homeroom-legend__swatch" [style.background]="chartPalette.present"></span>
                  {{ 'dashboard.chart.present' | translate }}
                </span>
                <span class="d-inline-flex align-items-center gap-2 text-muted mb-0">
                  <span class="teacher-homeroom-legend__swatch" [style.background]="chartPalette.absent"></span>
                  {{ 'dashboard.chart.absent' | translate }}
                </span>
                <span class="d-inline-flex align-items-center gap-2 text-muted mb-0">
                  <span class="teacher-homeroom-legend__swatch" [style.background]="chartPalette.late"></span>
                  {{ 'dashboard.chart.late' | translate }}
                </span>
                <span class="d-inline-flex align-items-center gap-2 text-muted mb-0">
                  <span class="teacher-homeroom-legend__swatch" [style.background]="chartPalette.excused"></span>
                  {{ 'dashboard.chart.excused' | translate }}
                </span>
              </div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="erp-card h-100 d-flex flex-column">
              <h4 class="erp-card-title" style="font-size: 15px;">{{ 'dashboard.teacher.homeroomRingTitle' | translate }}</h4>
              <div class="chart-container flex-grow-1" style="min-height: 200px;"><canvas #teacherHomeroomRingChart></canvas></div>
              <div class="text-center mt-2">
                <div style="font-size: 32px; font-weight: 800; color: var(--clr-primary); line-height: 1.1;">{{ teacherHomeroomMonthPresentPercentText }}%</div>
                <p class="text-muted small mb-0">{{ 'dashboard.teacher.homeroomPresentRate' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div [ngClass]="(teacherDashboard?.recentActivities || []).length ? 'col-lg-8' : 'col-12'">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.teacher.todayTimetable' | translate }}</h3></div>
              <div class="dashboard-table-wrap">
                <table class="erp-table">
                  <thead><tr><th>{{ 'dashboard.teacher.thPeriod' | translate }}</th><th>{{ 'dashboard.teacher.thTime' | translate }}</th><th>{{ 'dashboard.teacher.thSubject' | translate }}</th><th>{{ 'dashboard.teacher.thClass' | translate }}</th><th>{{ 'dashboard.teacher.thRoom' | translate }}</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let slot of teacherDashboard?.todaySchedule">
                      <td>{{ slot.period }}</td>
                      <td>{{ slot.startTime }} - {{ slot.endTime }}</td>
                      <td><strong>{{ slot.subject }}</strong></td>
                      <td>{{ slot.className | schoolClassName }}{{ slot.sectionName ? ' - ' + slot.sectionName : '' }}</td>
                      <td>{{ slot.room || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="col-lg-4" *ngIf="(teacherDashboard?.recentActivities || []).length">
            <div class="erp-card h-100 d-flex flex-column">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.teacher.recentActivity' | translate }}</h3></div>
              <div class="flex-grow-1 overflow-auto" style="max-height: 420px;">
                <a
                  *ngFor="let act of teacherDashboard?.recentActivities"
                  class="activity-item text-decoration-none"
                  style="cursor: pointer; color: inherit; display: flex;"
                  [routerLink]="act.linkRoute"
                  [queryParams]="act.linkQueryParams || null"
                >
                  <div
                    class="activity-icon"
                    [style.background]="act.type === 'success' ? 'rgba(5,150,105,0.12)' : act.type === 'warning' ? 'rgba(217,119,6,0.12)' : 'rgba(2,132,199,0.12)'"
                    [style.color]="act.type === 'success' ? 'var(--clr-success)' : act.type === 'warning' ? 'var(--clr-warning)' : 'var(--clr-info)'"
                  >
                    <i
                      class="bi"
                      [ngClass]="
                        act.code === 'EXAM_SCHEDULED'
                          ? 'bi-journal-text'
                          : act.code === 'ADMIN_ANNOUNCEMENT'
                            ? 'bi-megaphone'
                            : act.code === 'TIMETABLE_UPDATED'
                              ? 'bi-calendar-week'
                              : act.code === 'ATTENDANCE_PENDING'
                                ? 'bi-calendar-check'
                                : 'bi-people'
                      "
                    ></i>
                  </div>
                  <div class="activity-content flex-grow-1">
                    <h5>{{ ('dashboard.teacher.activity.' + act.code + '.title') | translate: (act.params || {}) }}</h5>
                    <p class="mb-0">{{ ('dashboard.teacher.activity.' + act.code + '.desc') | translate: (act.params || {}) }}</p>
                    <span class="text-muted small">{{ act.timestamp | date: 'medium' }}</span>
                  </div>
                  <span class="text-muted small align-self-center"><i class="bi bi-chevron-right"></i></span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && role === 'parent'">
        <div class="d-flex justify-content-between align-items-start mb-4 animate-in flex-wrap gap-2">
          <div class="flex-grow-1 min-w-0">
            <h2 class="mb-1 lh-sm" style="font-size: 24px; font-weight: 800;">{{ 'dashboard.parent.pageTitle' | translate }}</h2>
            <p class="text-muted mb-0 lh-sm" style="font-size: 13px;">
              {{ 'parentPortal.leadBefore' | translate }}
              <ng-container *ngIf="showParentExamsJourney; else parentLeadNoExams">
                <strong>{{ 'parentPortal.leadExams' | translate }}</strong>
                {{ 'parentPortal.leadAfter' | translate }}
              </ng-container>
              <ng-template #parentLeadNoExams>{{ 'dashboard.parent.leadNoExams' | translate }}</ng-template>
            </p>
          </div>
          <button
            type="button"
            class="btn-outline-erp btn-sm flex-shrink-0 align-self-start"
            (click)="refreshDashboard()"
            [disabled]="loading || refreshing"
            data-testid="dashboard-refresh-parent"
          >
            <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? ('dashboard.refreshing' | translate) : ('dashboard.refresh' | translate) }}
          </button>
        </div>
        <div class="erp-card mb-4" *ngIf="(parentDashboard?.children || []).length">
          <div class="row g-3 align-items-end">
            <div class="col-md-6">
              <label class="erp-label">{{ 'dashboard.parent.child' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedParentChildId" (change)="onParentChildChange()">
                <option *ngFor="let c of parentDashboard?.children" [ngValue]="c.id">
                  {{ c.firstName }} {{ c.lastName }} · {{ (c.className | schoolClassName) || ('dashboard.parent.classFallback' | translate: { id: c.classId }) }}{{ c.sectionName ? ' - ' + c.sectionName : '' }}
                </option>
              </select>
            </div>
            <div class="col-md-6 d-flex justify-content-end gap-2">
              <a class="btn-outline-erp btn-sm" [routerLink]="['/app/inbox']"><i class="bi bi-inbox-fill me-1"></i> {{ 'dashboard.parent.inbox' | translate }}</a>
              <a class="btn-primary-erp btn-sm" [routerLink]="['/app/parent/children']" [queryParams]="parentFeesDeepLink"><i class="bi bi-credit-card-fill me-1"></i> {{ 'dashboard.parent.fees' | translate }}</a>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3" *ngFor="let kpi of parentKPIs">
            <div
              class="stat-card h-100"
              [class.parent-fee-urgency--high]="kpi.tile === 'fee' && (kpi.feeUrgency === 'high' || kpi.feeUrgency === 'medium')"
              [class.parent-fee-urgency--low]="kpi.tile === 'fee' && kpi.feeUrgency === 'low'"
            >
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color"><i class="bi" [ngClass]="kpi.icon"></i></div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.labelKey | translate }}</div>
              <p
                class="small text-muted mb-0 mt-1 lh-sm parent-kpi-context"
                *ngIf="kpi.resolvedContext || kpi.contextKey"
                style="font-size: 12px;"
              >
                {{ kpi.resolvedContext || ((kpi.contextKey ?? '') | translate: (kpi.contextParams || {})) }}
              </p>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4" *ngIf="(parentDashboard?.recentActivities || []).length">
          <div class="col-lg-12">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.parent.recentActivityTitle' | translate }}</h3></div>
              <div *ngFor="let act of parentDashboard?.recentActivities" class="activity-item">
                <div
                  class="activity-icon"
                  [style.background]="act.type === 'success' ? 'rgba(5,150,105,0.12)' : act.type === 'warning' ? 'rgba(217,119,6,0.12)' : 'rgba(2,132,199,0.12)'"
                  [style.color]="act.type === 'success' ? 'var(--clr-success)' : act.type === 'warning' ? 'var(--clr-warning)' : 'var(--clr-info)'"
                >
                  <i
                    class="bi"
                    [ngClass]="act.code === 'FEE_PAYMENT_RECORDED' ? 'bi-credit-card-2-front' : act.code === 'RESULT_PUBLISHED' ? 'bi-journal-check' : act.code === 'ATTENDANCE_MARKED' ? 'bi-calendar-check' : 'bi-megaphone'"
                  ></i>
                </div>
                <div class="activity-content">
                  <h5>{{ ('dashboard.parent.activity.' + act.code + '.title') | translate: (act.params || {}) }}</h5>
                  <p class="mb-0">{{ ('dashboard.parent.activity.' + act.code + '.desc') | translate: (act.params || {}) }}</p>
                  <span class="text-muted small">{{ act.timestamp | date: 'medium' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4" *ngIf="(parentDashboard?.alerts || []).length">
          <div class="col-lg-12">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.parent.alertsTitle' | translate }}</h3></div>
              <div *ngFor="let a of parentDashboard?.alerts" class="activity-item">
                <div class="activity-icon" [style.background]="a.type === 'warning' ? 'rgba(217,119,6,0.12)' : 'rgba(2,132,199,0.12)'" [style.color]="a.type === 'warning' ? 'var(--clr-warning)' : 'var(--clr-info)'">
                  <i class="bi" [ngClass]="a.type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ a.titleKey ? (a.titleKey | translate: (a.messageParams || {})) : a.title }}</h5>
                  <p>{{ a.messageKey ? (a.messageKey | translate: (a.messageParams || {})) : a.message }}</p>
                </div>
                <a
                  *ngIf="a.ctaRoute"
                  class="btn-outline-erp btn-sm"
                  [routerLink]="a.ctaRoute"
                  [queryParams]="a.ctaQueryParams || null"
                >{{ a.ctaLabelKey ? (a.ctaLabelKey | translate) : (a.ctaLabel || ('dashboard.common.open' | translate)) }}</a>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('combinedTrendChart') combinedTrendChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('attendanceChart') attendanceChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('admissionsTrendChart') admissionsTrendChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('teacherHomeroomDailyChart') teacherHomeroomDailyChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('teacherHomeroomRingChart') teacherHomeroomRingChartRef?: ElementRef<HTMLCanvasElement>;

  role = 'admin';
  loading = true;
  refreshing = false;
  adminDashboard: AdminDashboardData | null = null;
  teacherDashboard: TeacherDashboardData | null = null;
  parentDashboard: ParentDashboardData | null = null;
  adminKPIs: DashboardAdminKpi[] = [];
  admissionInsights: DashboardAdmissionInsight[] = [];
  teacherKPIs: DashboardTeacherKpi[] = [];
  parentKPIs: DashboardParentKpi[] = [];
  private langSub?: Subscription;
  private coverMutSub?: Subscription;
  private themeSub?: Subscription;
  selectedParentChildId: number | null = null;
  showAdmissionsSeries = true;
  showFeesSeries = true;
  attSlicePresent = true;
  attSliceAbsent = true;
  attSliceLate = true;
  attSliceExcused = true;
  private combinedTrendChart?: Chart;
  private attendanceChart?: Chart;
  private admissionsTrendChart?: Chart;
  private teacherHomeroomDailyChart?: Chart;
  private teacherHomeroomRingChart?: Chart;
  chartPalette: DashboardChartPalette = {
    text: '#1F2937',
    muted: '#4B5563',
    grid: 'rgba(148, 163, 184, 0.25)',
    tooltipBg: '#111827',
    tooltipText: '#F9FAFB',
    admissionsBar: 'rgba(27, 58, 48, 0.85)',
    feeBar: 'rgba(192, 92, 61, 0.85)',
    line: '#1B3A30',
    lineFill: 'rgba(27, 58, 48, 0.12)',
    present: 'rgba(27, 58, 48, 0.92)',
    absent: 'rgba(192, 92, 61, 0.90)',
    late: 'rgba(217, 119, 6, 0.90)',
    excused: 'rgba(2, 132, 199, 0.88)',
  };
  /** Local month filter for teacher attendance chart (YYYY-MM). */
  teacherTrendMonth = new Date().toISOString().slice(0, 7);

  /** Max selectable month for homeroom picker (current calendar month). */
  get teacherHomeroomMaxYm(): string {
    return new Date().toISOString().slice(0, 7);
  }

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private operationsService: OperationsService,
    private parentSelection: ParentSelectionService,
    private themeService: ThemeService,
    private moduleGate: TenantModuleGateService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  get showParentExamsJourney(): boolean {
    return this.moduleGate.isModuleEnabled('exams');
  }

  /** Keeps dashboard child selection aligned with Parent portal / fees deep links. */
  get parentFeesDeepLink(): Record<string, string | number> {
    const qp: Record<string, string | number> = { tab: 'fees' };
    if (this.selectedParentChildId != null) {
      qp['child'] = this.selectedParentChildId;
      qp['childId'] = this.selectedParentChildId;
    }
    return qp;
  }

  ngOnInit(): void {
    this.chartPalette = this.resolveChartPalette();
    this.role = this.authService.getRole() || 'admin';
    if (this.role === 'parent') {
      this.selectedParentChildId = this.parentSelection.readPreferredChildId();
    }
    this.langSub = this.translate.onLangChange.subscribe(() => {
      if (this.role === 'admin' && this.adminDashboard) {
        this.cdr.detectChanges();
        queueMicrotask(() => this.initAdminCharts());
      }
      if (this.role === 'teacher' && this.teacherDashboard) {
        this.cdr.detectChanges();
        queueMicrotask(() => this.initTeacherCharts());
      }
      if (this.role === 'parent' && this.parentDashboard) {
        this.parentKPIs = this.buildParentKpis(this.parentDashboard);
        this.cdr.markForCheck();
      }
    });
    this.refreshRoleContextThenLoad();
    this.coverMutSub = this.operationsService.attendanceCoverMutations$.subscribe(() => {
      if (!this.loading && !this.refreshing) {
        this.refreshDashboard();
      }
    });
    this.themeSub = this.themeService.theme$.subscribe(() => {
      this.chartPalette = this.resolveChartPalette();
      if (this.role === 'admin' && this.adminDashboard) {
        this.cdr.detectChanges();
        queueMicrotask(() => this.initAdminCharts());
      }
      if (this.role === 'teacher' && this.teacherDashboard) {
        this.cdr.detectChanges();
        queueMicrotask(() => this.initTeacherCharts());
      }
    });
  }

  private refreshRoleContextThenLoad(): void {
    if (this.role === 'teacher' || this.role === 'admin') {
      this.authService.fetchProfileSummary().subscribe({
        next: () => this.loadDashboard(),
        error: () => this.loadDashboard(),
      });
      return;
    }
    this.loadDashboard();
  }

  refreshDashboard(): void {
    if (this.loading || this.refreshing) {
      return;
    }
    this.refreshing = true;
    const finish = () => {
      this.refreshing = false;
    };
    const runRefresh = () => {
      if (this.role === 'admin') {
        this.dashboardService.getAdminDashboard().subscribe({
          next: dashboard => {
            this.adminDashboard = dashboard;
            this.adminKPIs = this.buildAdminKpis(dashboard);
            this.admissionInsights = this.buildAdmissionInsights(dashboard);
            this.cdr.detectChanges();
            this.initAdminCharts();
            finish();
          },
          error: () => finish()
        });
        return;
      }
      if (this.role === 'teacher') {
        this.dashboardService.getTeacherDashboard(this.teacherTrendMonth).subscribe({
          next: dashboard => {
            this.teacherDashboard = this.applyTeacherActivityVisibility(dashboard);
            this.teacherKPIs = this.buildTeacherKpis(dashboard);
            this.cdr.detectChanges();
            queueMicrotask(() => this.initTeacherCharts());
            finish();
          },
          error: () => finish()
        });
        return;
      }
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const to = today.toISOString().slice(0, 10);
      this.dashboardService.getParentDashboard(from, to, this.selectedParentChildId).subscribe({
        next: dashboard => {
          const visibleDashboard = this.applyParentModuleVisibility(dashboard);
          this.parentDashboard = visibleDashboard;
          this.selectedParentChildId = visibleDashboard.selectedChildId ?? visibleDashboard.selectedChild?.id ?? null;
          this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
          this.parentKPIs = this.buildParentKpis(visibleDashboard);
          finish();
        },
        error: () => finish()
      });
    };
    if (this.role === 'teacher' || this.role === 'admin') {
      this.authService.fetchProfileSummary().subscribe({
        next: () => runRefresh(),
        error: () => runRefresh(),
      });
      return;
    }
    runRefresh();
  }

  private loadDashboard(): void {
    this.loading = true;
    if (this.role === 'admin') {
      this.dashboardService.getAdminDashboard().subscribe({
        next: dashboard => {
          this.adminDashboard = dashboard;
          this.adminKPIs = this.buildAdminKpis(dashboard);
          this.admissionInsights = this.buildAdmissionInsights(dashboard);
          this.loading = false;
          this.cdr.detectChanges();
          this.initAdminCharts();
        },
        error: () => {
          this.loading = false;
        }
      });
      return;
    }
    if (this.role === 'teacher') {
      this.dashboardService.getTeacherDashboard(this.teacherTrendMonth).subscribe({
        next: dashboard => {
          this.teacherDashboard = this.applyTeacherActivityVisibility(dashboard);
          this.teacherKPIs = this.buildTeacherKpis(dashboard);
          this.loading = false;
          this.cdr.detectChanges();
          queueMicrotask(() => this.initTeacherCharts());
        },
        error: () => {
          this.loading = false;
        }
      });
      return;
    }
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const to = today.toISOString().slice(0, 10);
    this.dashboardService.getParentDashboard(from, to, this.selectedParentChildId).subscribe({
      next: dashboard => {
        const visibleDashboard = this.applyParentModuleVisibility(dashboard);
        this.parentDashboard = visibleDashboard;
        this.selectedParentChildId = visibleDashboard.selectedChildId ?? visibleDashboard.selectedChild?.id ?? null;
        this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
        this.parentKPIs = this.buildParentKpis(visibleDashboard);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onParentChildChange(): void {
    if (!this.parentDashboard?.children?.length || this.selectedParentChildId == null) return;
    const selected = this.parentDashboard.children.find(c => c.id === this.selectedParentChildId);
    if (!selected) return;
    this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
    if (this.loading || this.refreshing) return;
    this.refreshing = true;
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const to = today.toISOString().slice(0, 10);
    this.dashboardService.getParentDashboard(from, to, this.selectedParentChildId).subscribe({
      next: dashboard => {
        const visibleDashboard = this.applyParentModuleVisibility(dashboard);
        this.parentDashboard = visibleDashboard;
        this.selectedParentChildId = visibleDashboard.selectedChildId ?? visibleDashboard.selectedChild?.id ?? null;
        this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
        this.parentKPIs = this.buildParentKpis(visibleDashboard);
        this.refreshing = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.refreshing = false;
      },
    });
  }

  ngAfterViewInit(): void {
    if (!this.loading && this.role === 'admin') {
      this.initAdminCharts();
    }
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.coverMutSub?.unsubscribe();
    this.themeSub?.unsubscribe();
    this.combinedTrendChart?.destroy();
    this.attendanceChart?.destroy();
    this.admissionsTrendChart?.destroy();
    this.teacherHomeroomDailyChart?.destroy();
    this.teacherHomeroomRingChart?.destroy();
  }

  /**
   * Present ÷ (Present+Absent+Late+Excused) for the selected month; matches the homeroom doughnut breakdown.
   * Displayed beside the ring as the headline percentage.
   */
  get teacherHomeroomMonthPresentPercentText(): string {
    const b = this.teacherDashboard?.homeroomAttendance?.breakdown;
    if (!b) {
      return '0';
    }
    const t = b.present + b.absent + b.late + b.excused;
    if (t <= 0) {
      return '0';
    }
    return ((100 * b.present) / t).toFixed(1);
  }

  onTeacherTrendMonthChange(): void {
    this.refreshing = true;
    this.dashboardService.getTeacherDashboard(this.teacherTrendMonth).subscribe({
      next: dashboard => {
        this.teacherDashboard = this.applyTeacherActivityVisibility(dashboard);
        this.teacherKPIs = this.buildTeacherKpis(dashboard);
        this.refreshing = false;
        this.cdr.detectChanges();
        queueMicrotask(() => this.initTeacherCharts());
      },
      error: () => {
        this.refreshing = false;
      },
    });
  }

  private initTeacherCharts(): void {
    this.initTeacherHomeroomCharts();
  }

  private buildAdminKpis(dashboard: AdminDashboardData): DashboardAdminKpi[] {
    return [
      {
        labelKey: 'dashboard.admin.kpi.totalStudents',
        value: String(dashboard.totalStudents),
        icon: 'bi-people-fill',
        bgColor: 'rgba(27,58,48,0.1)',
        color: '#1B3A30',
        subtextKey: 'dashboard.admin.kpi.totalStudentsSub',
      },
      {
        labelKey: 'dashboard.admin.kpi.totalTeachers',
        value: String(dashboard.totalTeachers),
        icon: 'bi-person-badge-fill',
        bgColor: 'rgba(192,92,61,0.1)',
        color: '#C05C3D',
        subtextKey: 'dashboard.admin.kpi.totalTeachersSub',
      },
      {
        labelKey: 'dashboard.admin.kpi.feesCollected',
        value: this.asCurrency(dashboard.feesCollected),
        icon: 'bi-credit-card-fill',
        bgColor: 'rgba(5,150,105,0.1)',
        color: '#059669',
        subtextKey: 'dashboard.admin.kpi.feesCollectedSub',
        subtextParams: { rate: dashboard.collectionRate },
      },
      {
        labelKey: 'dashboard.admin.kpi.attendanceLogged',
        value: String(dashboard.attendanceOverview?.total ?? 0),
        icon: 'bi-calendar-check-fill',
        bgColor: 'rgba(2,132,199,0.1)',
        color: '#0284C7',
        subtextKey: 'dashboard.admin.kpi.attendanceLoggedSub',
      },
    ];
  }

  private buildTeacherKpis(dashboard: TeacherDashboardData): DashboardTeacherKpi[] {
    const ct = dashboard.classTeacherOf?.[0];
    const hmLabel = dashboard.homeroomAttendance?.classLabel?.trim();
    const homeroomDisplay =
      hmLabel ||
      (ct ? `${ct.className?.trim() || ''}${ct.sectionName ? ' · ' + ct.sectionName : ''}`.trim() : '');
    const todayIso = localIsoDateString();
    const homeroomScopeParams: Record<string, string> | undefined =
      ct?.classId != null && ct.sectionId != null
        ? { classId: String(ct.classId), sectionId: String(ct.sectionId) }
        : ct?.classId != null
          ? { classId: String(ct.classId) }
          : undefined;
    const attendanceQuery: Record<string, string> = { ...(homeroomScopeParams ?? {}), date: todayIso };
    const rosterStrength =
      ct != null && ct.totalStudents != null && ct.totalStudents > 0 ? ct.totalStudents : dashboard.studentsAssigned;
    const attendanceDone = Boolean(dashboard.homeroomTodayAttendanceComplete);
    const todaysPeriods = dashboard.todaySchedule?.length ?? 0;
    return [
      {
        labelKey: 'dashboard.teacher.kpi.homeroomLabel',
        value: homeroomDisplay || '—',
        icon: 'bi-mortarboard-fill',
        bgColor: 'rgba(27,58,48,0.1)',
        color: '#1B3A30',
        link: '/app/students',
        queryParams: homeroomScopeParams,
        // subtextKey: homeroomDisplay ? 'dashboard.teacher.kpi.homeroomSubStudents' : 'dashboard.teacher.kpi.homeroomEmpty',
      },
      {
        labelKey: 'dashboard.teacher.kpi.studentsAssigned',
        value: String(rosterStrength),
        icon: 'bi-people-fill',
        bgColor: 'rgba(192,92,61,0.1)',
        color: '#C05C3D',
        link: '/app/students',
        queryParams: homeroomScopeParams,
        // subtextKey: ct ? 'dashboard.teacher.kpi.studentsAssignedHomeroomHint' : 'dashboard.teacher.kpi.studentsAssignedFallbackHint',
      },
      {
        labelKey: 'dashboard.teacher.kpi.todaySchedule',
        value: String(todaysPeriods),
        icon: 'bi-calendar-week-fill',
        bgColor: 'rgba(2,132,199,0.10)',
        color: '#0284C7',
        link: '/app/timetable',
        // subtextKey: 'dashboard.teacher.kpi.todayScheduleSub',
      },
      {
        labelKey: attendanceDone ? 'dashboard.teacher.kpi.homeAttendanceTitleDone' : 'dashboard.teacher.kpi.homeAttendanceTitlePending',
        value: '',
        valueLabelKey: attendanceDone
          ? 'dashboard.teacher.kpi.homeAttendanceValueMarked'
          : 'dashboard.teacher.kpi.homeAttendanceValuePending',
        icon: attendanceDone ? 'bi-check2-circle' : 'bi-calendar2-event',
        bgColor: attendanceDone ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)',
        color: attendanceDone ? '#059669' : '#D97706',
        link: '/app/attendance',
        queryParams: attendanceQuery,
        kpiVariant: attendanceDone ? 'attendance-done' : 'attendance-pending',
      },
    ];
  }

  /**
   * Keeps teacher dashboard activity feed aligned with tenant feature toggles.
   * Exam-related activities are hidden only when the exams module is OFF.
   * When the module is ON, all exam activities pass through untouched.
   */
  private applyTeacherActivityVisibility(dashboard: TeacherDashboardData): TeacherDashboardData {
    const activities = dashboard.recentActivities ?? [];
    if (!activities.length) {
      return dashboard;
    }
    if (this.moduleGate.isModuleEnabled('exams')) {
      return dashboard;
    }
    const hiddenWhenExamOff = new Set<string>(['EXAM_SCHEDULED']);
    const filteredActivities = activities.filter(activity => !hiddenWhenExamOff.has(activity.code));
    if (filteredActivities.length === activities.length) {
      return dashboard;
    }
    return {
      ...dashboard,
      recentActivities: filteredActivities,
    };
  }

  /**
   * Prevents parent dashboard from surfacing exam-specific content while exams module is disabled.
   * When exams is enabled, payload is returned unchanged.
   */
  private applyParentModuleVisibility(dashboard: ParentDashboardData): ParentDashboardData {
    if (this.moduleGate.isModuleEnabled('exams')) {
      return dashboard;
    }
    const recentActivities = (dashboard.recentActivities ?? []).filter(activity => activity.code !== 'RESULT_PUBLISHED');
    const alerts = (dashboard.alerts ?? []).filter(alert => !this.isExamLinkedParentAlert(alert));
    const hadExamLinkedData =
      recentActivities.length !== (dashboard.recentActivities ?? []).length
      || alerts.length !== (dashboard.alerts ?? []).length
      || (dashboard.upcoming?.length ?? 0) > 0
      || (dashboard.childPerformance?.length ?? 0) > 0
      || (dashboard.overallGrade ?? '').trim() !== '';
    if (!hadExamLinkedData) {
      return dashboard;
    }
    return {
      ...dashboard,
      recentActivities,
      alerts,
      upcoming: [],
      childPerformance: [],
      overallGrade: '-',
      resultMetric: undefined,
    };
  }

  private isExamLinkedParentAlert(alert: NonNullable<ParentDashboardData['alerts']>[number]): boolean {
    if (!alert) {
      return false;
    }
    return alert.titleKey === 'dashboard.parent.alert.resultsTitle'
      || alert.messageKey === 'dashboard.parent.alert.resultsMessage'
      || alert.ctaLabelKey === 'dashboard.parent.cta.viewExams'
      || alert.ctaRoute === '/app/exams';
  }

  private buildParentKpis(dashboard: ParentDashboardData): DashboardParentKpi[] {
    const th = dashboard.attendanceMetric?.schoolThresholdPct ?? 85;
    const feeU = dashboard.feeMetric?.urgency ?? 'none';
    return [
      {
        labelKey: 'dashboard.parent.kpi.childrenLinked',
        value: String(dashboard.childCount),
        icon: 'bi-person-heart',
        bgColor: 'rgba(27,58,48,0.1)',
        color: '#1B3A30',
        contextKey: 'dashboard.parent.kpi.childrenLinkedContext',
        contextParams: { count: dashboard.childCount },
        tile: 'children',
      },
      {
        labelKey: 'dashboard.parent.kpi.attendance',
        value: `${dashboard.attendancePercentage.toFixed(1)}%`,
        icon: 'bi-calendar-check-fill',
        bgColor: 'rgba(5,150,105,0.1)',
        color: '#059669',
        contextKey: dashboard.attendanceMetric?.labelKey,
        contextParams: { threshold: th },
        tile: 'attendance',
      },
      {
        labelKey: 'dashboard.parent.kpi.overallGrade',
        value: dashboard.overallGrade,
        icon: 'bi-trophy-fill',
        bgColor: 'rgba(217,119,6,0.1)',
        color: '#D97706',
        contextKey: dashboard.resultMetric?.labelKey,
        contextParams: {
          pct: dashboard.resultMetric?.averagePercent != null ? dashboard.resultMetric.averagePercent : '—',
        },
        tile: 'result',
      },
      {
        labelKey: 'dashboard.parent.kpi.feeDue',
        value: this.asCurrency(dashboard.feeDue),
        icon: 'bi-credit-card-fill',
        bgColor: 'rgba(220,38,38,0.1)',
        color: '#DC2626',
        contextKey: dashboard.feeMetric?.labelKey,
        contextParams: {
          date: this.formatParentFeeDueDate(dashboard.feeMetric?.nextDueDate),
          days: dashboard.feeMetric?.daysUntilDue ?? '—',
        },
        resolvedContext: this.resolveParentFeeContext(dashboard),
        tile: 'fee',
        feeUrgency: feeU,
      },
    ];
  }

  updateCombinedTrendChart(): void {
    if (!this.combinedTrendChart) return;
    const ds = this.combinedTrendChart.data.datasets;
    if (ds[0]) ds[0].hidden = !this.showAdmissionsSeries;
    if (ds[1]) ds[1].hidden = !this.showFeesSeries;
    this.combinedTrendChart.update();
  }

  updateAttendanceChart(): void {
    this.applyAttendanceVisibility();
  }

  private applyAttendanceVisibility(): void {
    if (!this.attendanceChart) return;
    const meta = this.attendanceChart.getDatasetMeta(0);
    const flags = [this.attSlicePresent, this.attSliceAbsent, this.attSliceLate, this.attSliceExcused];
    meta.data.forEach((arc, i) => {
      if (arc && 'hidden' in arc) {
        (arc as { hidden?: boolean }).hidden = !flags[i];
      }
    });
    this.attendanceChart.update();
  }

  private initAdminCharts(): void {
    if (!this.adminDashboard || !this.combinedTrendChartRef || !this.attendanceChartRef || !this.admissionsTrendChartRef) {
      return;
    }
    this.combinedTrendChart?.destroy();
    this.attendanceChart?.destroy();
    this.admissionsTrendChart?.destroy();

    const monthlyAdmissions = this.adminDashboard.monthlyAdmissions ?? [];
    const monthlyCollections = this.adminDashboard.monthlyCollections ?? [];
    const overview = this.adminDashboard.attendanceOverview ?? {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    const t = (k: string) => this.translate.instant(k);
    const p = this.chartPalette;
    this.combinedTrendChart = new Chart(this.combinedTrendChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: monthlyAdmissions.map(point => point.label),
        datasets: [
          { label: t('dashboard.chart.admissions'), data: monthlyAdmissions.map(point => Number(point.value)), backgroundColor: p.admissionsBar, borderRadius: 6, barPercentage: 0.55, hidden: !this.showAdmissionsSeries },
          { label: t('dashboard.chart.feeCollection'), data: monthlyCollections.map(point => Number(point.value)), backgroundColor: p.feeBar, borderRadius: 6, barPercentage: 0.55, hidden: !this.showFeesSeries }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: p.text } },
          tooltip: { backgroundColor: p.tooltipBg, titleColor: p.tooltipText, bodyColor: p.tooltipText },
        },
        scales: {
          x: { grid: { color: p.grid }, ticks: { color: p.muted } },
          y: { beginAtZero: true, grid: { color: p.grid }, ticks: { color: p.muted } }
        }
      }
    });

    this.attendanceChart = new Chart(this.attendanceChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [t('dashboard.chart.present'), t('dashboard.chart.absent'), t('dashboard.chart.late'), t('dashboard.chart.excused')],
        datasets: [{
          data: [
            Number(overview.present),
            Number(overview.absent),
            Number(overview.late),
            Number(overview.excused)
          ],
          backgroundColor: [p.present, p.absent, p.late, p.excused],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { labels: { color: p.text } },
          tooltip: { backgroundColor: p.tooltipBg, titleColor: p.tooltipText, bodyColor: p.tooltipText },
        }
      }
    });
    this.applyAttendanceVisibility();

    this.admissionsTrendChart = new Chart(this.admissionsTrendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: monthlyAdmissions.map(point => point.label),
        datasets: [{
          label: t('dashboard.chart.admissions'),
          data: monthlyAdmissions.map(point => Number(point.value)),
          borderColor: p.line,
          backgroundColor: p.lineFill,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: p.line
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: p.tooltipBg, titleColor: p.tooltipText, bodyColor: p.tooltipText },
        },
        scales: {
          x: { grid: { color: p.grid }, ticks: { color: p.muted } },
          y: { beginAtZero: true, ticks: { precision: 0, color: p.muted }, grid: { color: p.grid } }
        }
      }
    });
  }

  private buildAdmissionInsights(dashboard: AdminDashboardData): DashboardAdmissionInsight[] {
    const admissions = dashboard.monthlyAdmissions.map(point => point.value);
    const total = admissions.reduce((sum, value) => sum + value, 0);
    const average = admissions.length ? total / admissions.length : 0;
    const peakValue = admissions.length ? Math.max(...admissions) : 0;
    const peakMonth = dashboard.monthlyAdmissions.find(point => point.value === peakValue)?.label || '-';
    const latest = admissions[admissions.length - 1] ?? 0;
    const previous = admissions[admissions.length - 2] ?? 0;
    const trend = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    const signed = trend > 0 ? '+' : '';

    return [
      {
        labelKey: 'dashboard.admin.insight.sixMonth',
        value: String(total),
        subtextKey: 'dashboard.admin.insight.sixMonthSub',
        icon: 'bi-graph-up-arrow',
        iconBg: 'rgba(27,58,48,0.12)',
        iconColor: 'var(--clr-primary)',
      },
      {
        labelKey: 'dashboard.admin.insight.peakMonth',
        value: `${peakMonth} · ${peakValue}`,
        subtextKey: 'dashboard.admin.insight.peakMonthSub',
        icon: 'bi-calendar2-week-fill',
        iconBg: 'rgba(192,92,61,0.12)',
        iconColor: 'var(--clr-accent)',
      },
      {
        labelKey: 'dashboard.admin.insight.monthlyAvg',
        value: average.toFixed(1),
        subtextKey: 'dashboard.admin.insight.monthlyAvgLead',
        icon: 'bi-activity',
        iconBg: 'rgba(2,132,199,0.12)',
        iconColor: 'var(--clr-info)',
        badgeKey: 'dashboard.admin.insight.vsPrevMonth',
        badgeParams: { signed, pct: trend.toFixed(1) },
        badgeVariant: trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral',
      },
    ];
  }

  /** Locale-aware due date for parent fee KPI (ISO yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss). */
  private formatParentFeeDueDate(raw: string | null | undefined): string {
    if (!raw || raw === '—') {
      return '—';
    }
    const head = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) {
      return raw;
    }
    const d = new Date(raw.includes('T') ? raw : `${head}T12:00:00`);
    if (Number.isNaN(d.getTime())) {
      return raw;
    }
    const loc = this.translate.currentLang?.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    return d.toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Pre-resolve fee urgency line so placeholders always interpolate (ngx-translate pipe edge cases on nested KPI rows).
   */
  private resolveParentFeeContext(dashboard: ParentDashboardData): string | undefined {
    const key = dashboard.feeMetric?.labelKey;
    if (!key || !dashboard.feeDue || dashboard.feeDue <= 0) {
      return undefined;
    }
    const date = this.formatParentFeeDueDate(dashboard.feeMetric?.nextDueDate);
    const du = dashboard.feeMetric?.daysUntilDue;
    const days = du === null || du === undefined ? '—' : du;
    return this.translate.instant(key, { date, days });
  }

  private asCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  }

  private homeroomRosterHintForChart(): number {
    const ct = this.teacherDashboard?.classTeacherOf?.[0]?.totalStudents;
    if (typeof ct === 'number' && ct > 0) {
      return ct;
    }
    const sa = this.teacherDashboard?.studentsAssigned;
    if (typeof sa === 'number' && sa > 0) {
      return sa;
    }
    return 40;
  }

  /**
   * Stacked day chart uses headcounts when API sends {@link TeacherHomeroomDailyPoint} counts; otherwise scales % × roster hint.
   */
  private homeroomStackCounts(row: TeacherHomeroomDailyPoint): { p: number; a: number; l: number; e: number } {
    if (
      row.presentCount != null ||
      row.absentCount != null ||
      row.lateCount != null ||
      row.excusedCount != null
    ) {
      return {
        p: Math.max(0, Math.round(row.presentCount ?? 0)),
        a: Math.max(0, Math.round(row.absentCount ?? 0)),
        l: Math.max(0, Math.round(row.lateCount ?? 0)),
        e: Math.max(0, Math.round(row.excusedCount ?? 0)),
      };
    }
    const roster = Math.max(1, this.homeroomRosterHintForChart());
    const seg = this.homeroomPercentShares(row);
    return {
      p: Math.round((seg.p / 100) * roster),
      a: Math.round((seg.a / 100) * roster),
      l: Math.round((seg.l / 100) * roster),
      e: Math.round((seg.e / 100) * roster),
    };
  }

  /** Normalizes API percent fields to four shares summing to 100 when detail exists. */
  private homeroomPercentShares(row: TeacherHomeroomDailyPoint): { p: number; a: number; l: number; e: number } {
    const hasSplit =
      row.absentPercent != null || row.latePercent != null || row.excusedPercent != null;
    if (hasSplit) {
      const p = Math.max(0, row.presentPercent ?? 0);
      const a = Math.max(0, row.absentPercent ?? 0);
      const l = Math.max(0, row.latePercent ?? 0);
      const e = Math.max(0, row.excusedPercent ?? 0);
      const s = p + a + l + e;
      if (s <= 0) {
        return { p: 0, a: 0, l: 0, e: 0 };
      }
      return {
        p: (100 * p) / s,
        a: (100 * a) / s,
        l: (100 * l) / s,
        e: (100 * e) / s,
      };
    }
    const pOnly = Math.min(100, Math.max(0, row.presentPercent ?? 0));
    return { p: pOnly, a: 0, l: 0, e: 0 };
  }

  private initTeacherHomeroomCharts(): void {
    const h = this.teacherDashboard?.homeroomAttendance;
    const dailyCanvas = this.teacherHomeroomDailyChartRef?.nativeElement;
    const ringCanvas = this.teacherHomeroomRingChartRef?.nativeElement;
    if (!h?.daily?.length || !dailyCanvas || !ringCanvas) {
      return;
    }
    this.teacherHomeroomDailyChart?.destroy();
    this.teacherHomeroomRingChart?.destroy();
    const loc = this.translate.currentLang?.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const dayLabels = h.daily.map(row => {
      const head = row.date.slice(0, 10);
      const d = new Date(head.includes('T') ? head : `${head}T12:00:00`);
      return Number.isNaN(d.getTime()) ? row.date : d.toLocaleDateString(loc, { day: 'numeric' });
    });
    const t = this.translate;
    const p = this.chartPalette;
    const gridColor = p.grid;
    const presentData: number[] = [];
    const absentData: number[] = [];
    const lateData: number[] = [];
    const excusedData: number[] = [];
    let maxDayTotal = 0;
    for (const row of h.daily) {
      const seg = this.homeroomStackCounts(row);
      presentData.push(seg.p);
      absentData.push(seg.a);
      lateData.push(seg.l);
      excusedData.push(seg.e);
      maxDayTotal = Math.max(maxDayTotal, seg.p + seg.a + seg.l + seg.e);
    }
    this.teacherHomeroomDailyChart = new Chart(dailyCanvas, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: t.instant('dashboard.chart.present'),
            data: presentData,
            backgroundColor: p.present,
            borderRadius: 4,
            stack: 'att',
          },
          {
            label: t.instant('dashboard.chart.absent'),
            data: absentData,
            backgroundColor: p.absent,
            borderRadius: 4,
            stack: 'att',
          },
          {
            label: t.instant('dashboard.chart.late'),
            data: lateData,
            backgroundColor: p.late,
            borderRadius: 4,
            stack: 'att',
          },
          {
            label: t.instant('dashboard.chart.excused'),
            data: excusedData,
            backgroundColor: p.excused,
            borderRadius: 4,
            stack: 'att',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: p.tooltipBg,
            titleColor: p.tooltipText,
            bodyColor: p.tooltipText,
            callbacks: {
              label: ctx => {
                const dsLabel = ctx.dataset.label || '';
                const y = ctx.parsed.y;
                const n = typeof y === 'number' ? Math.round(y) : y;
                return `${dsLabel}: ${n}`;
              },
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { color: gridColor }, ticks: { color: p.muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 16 } },
          y: {
            stacked: true,
            min: 0,
            suggestedMax: Math.max(6, maxDayTotal + 1),
            grace: '12%',
            ticks: {
              precision: 0,
              callback: (v: string | number) => {
                const n = typeof v === 'number' ? v : parseFloat(String(v));
                return Number.isFinite(n) ? String(Math.round(n)) : '';
              },
            },
            grid: { color: gridColor },
            title: {
              display: true,
              text: t.instant('dashboard.teacher.homeroomAxisDailyCounts'),
              color: p.text,
              font: { size: 11, weight: 600 },
            },
          },
        },
      },
    });
    const b = h.breakdown;
    this.teacherHomeroomRingChart = new Chart(ringCanvas, {
      type: 'doughnut',
      data: {
        labels: [
          t.instant('dashboard.chart.present'),
          t.instant('dashboard.chart.absent'),
          t.instant('dashboard.chart.late'),
          t.instant('dashboard.chart.excused'),
        ],
        datasets: [
          {
            data: [b.present, b.absent, b.late, b.excused],
            backgroundColor: [p.present, p.absent, p.late, p.excused],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { color: p.text, boxWidth: 12, font: { size: 11 } } },
          tooltip: { backgroundColor: p.tooltipBg, titleColor: p.tooltipText, bodyColor: p.tooltipText },
        },
      },
    });
  }

  private resolveChartPalette(): DashboardChartPalette {
    const isDark = this.themeService.getTheme() === 'dark';
    if (isDark) {
      return {
        text: '#E5E7EB',
        muted: '#C3CDD9',
        grid: 'rgba(148, 163, 184, 0.25)',
        tooltipBg: '#0B1220',
        tooltipText: '#F8FAFC',
        admissionsBar: 'rgba(52, 211, 153, 0.90)',
        feeBar: 'rgba(251, 146, 60, 0.92)',
        line: '#34D399',
        lineFill: 'rgba(52, 211, 153, 0.20)',
        present: 'rgba(52, 211, 153, 0.92)',
        absent: 'rgba(248, 113, 113, 0.92)',
        late: 'rgba(251, 191, 36, 0.92)',
        excused: 'rgba(56, 189, 248, 0.92)',
      };
    }
    return {
      text: '#1F2937',
      muted: '#4B5563',
      grid: 'rgba(148, 163, 184, 0.25)',
      tooltipBg: '#111827',
      tooltipText: '#F9FAFB',
      admissionsBar: 'rgba(27, 58, 48, 0.85)',
      feeBar: 'rgba(192, 92, 61, 0.85)',
      line: '#1B3A30',
      lineFill: 'rgba(27, 58, 48, 0.12)',
      present: 'rgba(27, 58, 48, 0.92)',
      absent: 'rgba(192, 92, 61, 0.90)',
      late: 'rgba(217, 119, 6, 0.90)',
      excused: 'rgba(2, 132, 199, 0.88)',
    };
  }

}
