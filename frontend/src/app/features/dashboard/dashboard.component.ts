import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ParentSelectionService } from '../../core/services/parent-selection.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AdminDashboardData, ParentDashboardData, TeacherDashboardData } from '../../core/models/models';

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
  icon: string;
  bgColor: string;
  color: string;
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  styles: [
    `
      .parent-fee-urgency--high {
        border-color: color-mix(in srgb, var(--clr-danger) 45%, var(--clr-border-light)) !important;
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-danger) 28%, transparent), var(--shadow-sm);
      }
      .parent-fee-urgency--low {
        border-color: color-mix(in srgb, var(--clr-warning) 35%, var(--clr-border-light)) !important;
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
            <div class="stat-card">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color"><i class="bi" [ngClass]="kpi.icon"></i></div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.labelKey | translate }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-5">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.teacher.messageQueue' | translate }}</h3></div>
              <div *ngIf="(teacherDashboard?.messageQueue || []).length; else noMsgQueue">
                <div *ngFor="let item of teacherDashboard?.messageQueue" class="activity-item" [routerLink]="['/app/chat']" style="cursor: pointer;">
                  <div class="activity-icon" style="background: rgba(2,132,199,0.1); color: var(--clr-info);">
                    <i class="bi bi-chat-left-dots"></i>
                  </div>
                  <div class="activity-content">
                    <h5>
                      {{ item.fromName }}
                      <span *ngIf="item.studentName" class="text-muted" style="font-weight: 600;">· {{ item.studentName }}</span>
                    </h5>
                    <p>{{ item.preview }} · {{ item.timestamp }}</p>
                  </div>
                  <span class="badge-erp" [ngClass]="item.priority === 'high' ? 'badge-danger' : 'badge-neutral'">{{ priorityLabel(item.priority) }}</span>
                </div>
              </div>
              <ng-template #noMsgQueue>
                <div class="empty-state" style="padding: 20px 12px;">
                  <i class="bi bi-inbox"></i>
                  <h3>{{ 'dashboard.teacher.noMessagesTitle' | translate }}</h3>
                  <p>{{ 'dashboard.teacher.noMessagesLead' | translate }}</p>
                </div>
              </ng-template>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.teacher.classOverview' | translate }}</h3></div>
              <div *ngIf="(teacherDashboard?.classTeacherOf || []).length; else noClassTeacher">
                <div *ngFor="let cls of teacherDashboard?.classTeacherOf" class="insight-card" style="margin-bottom: 10px;">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="insight-label">{{ 'dashboard.teacher.classTeacherLabel' | translate }}</div>
                      <div class="insight-value">{{ cls.className }}{{ cls.sectionName ? ' - ' + cls.sectionName : '' }}</div>
                      <div class="insight-subtext">{{ 'dashboard.teacher.classTeacherSub' | translate: { count: cls.totalStudents } }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <a class="btn-outline-erp btn-sm" [routerLink]="['/app/attendance']">{{ 'dashboard.teacher.btnAttendance' | translate }}</a>
                      <a class="btn-outline-erp btn-sm" [routerLink]="['/app/chat']">{{ 'dashboard.teacher.btnInbox' | translate }}</a>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noClassTeacher>
                <div class="empty-state" style="padding: 20px 12px;">
                  <i class="bi bi-person-badge"></i>
                  <h3>{{ 'dashboard.teacher.noClassTitle' | translate }}</h3>
                  <p>{{ 'dashboard.teacher.noClassLead' | translate }}</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-8">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.teacher.todayTimetable' | translate }}</h3></div>
              <table class="erp-table">
                <thead><tr><th>{{ 'dashboard.teacher.thPeriod' | translate }}</th><th>{{ 'dashboard.teacher.thTime' | translate }}</th><th>{{ 'dashboard.teacher.thSubject' | translate }}</th><th>{{ 'dashboard.teacher.thClass' | translate }}</th><th>{{ 'dashboard.teacher.thRoom' | translate }}</th></tr></thead>
                <tbody>
                  <tr *ngFor="let slot of teacherDashboard?.todaySchedule">
                    <td>{{ slot.period }}</td>
                    <td>{{ slot.startTime }} - {{ slot.endTime }}</td>
                    <td><strong>{{ slot.subject }}</strong></td>
                    <td>{{ slot.className }}{{ slot.sectionName ? ' - ' + slot.sectionName : '' }}</td>
                    <td>{{ slot.room || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">{{ 'dashboard.teacher.pendingTasks' | translate }}</h3></div>
              <div *ngFor="let task of teacherDashboard?.pendingTasks" class="activity-item">
                <div class="activity-icon" style="background: rgba(217,119,6,0.1); color: var(--clr-warning);"><i class="bi bi-list-task"></i></div>
                <div class="activity-content">
                  <h5>{{ task.title }}</h5>
                  <p>{{ task.description || task.timestamp }}</p>
                </div>
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
              <strong>{{ 'parentPortal.leadExams' | translate }}</strong>
              {{ 'parentPortal.leadAfter' | translate }}
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
                  {{ c.firstName }} {{ c.lastName }} · {{ c.className || ('dashboard.parent.classFallback' | translate: { id: c.classId }) }}{{ c.sectionName ? ' - ' + c.sectionName : '' }}
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

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private parentSelection: ParentSelectionService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

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
    this.role = this.authService.getRole() || 'admin';
    this.langSub = this.translate.onLangChange.subscribe(() => {
      if (this.role === 'admin' && this.adminDashboard) {
        this.cdr.detectChanges();
        queueMicrotask(() => this.initAdminCharts());
      }
      if (this.role === 'parent' && this.parentDashboard) {
        this.parentKPIs = this.buildParentKpis(this.parentDashboard);
        this.cdr.markForCheck();
      }
    });
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
      this.dashboardService.getTeacherDashboard().subscribe({
        next: dashboard => {
          this.teacherDashboard = dashboard;
          this.teacherKPIs = this.buildTeacherKpis(dashboard);
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
        this.parentDashboard = dashboard;
        this.selectedParentChildId = dashboard.selectedChildId ?? dashboard.selectedChild?.id ?? null;
        this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
        this.parentKPIs = this.buildParentKpis(dashboard);
        finish();
      },
      error: () => finish()
    });
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
      this.dashboardService.getTeacherDashboard().subscribe({
        next: dashboard => {
          this.teacherDashboard = dashboard;
          this.teacherKPIs = this.buildTeacherKpis(dashboard);
          this.loading = false;
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
        this.parentDashboard = dashboard;
        this.selectedParentChildId = dashboard.selectedChildId ?? dashboard.selectedChild?.id ?? null;
        this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
        this.parentKPIs = this.buildParentKpis(dashboard);
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
        this.parentDashboard = dashboard;
        this.selectedParentChildId = dashboard.selectedChildId ?? dashboard.selectedChild?.id ?? null;
        this.parentSelection.rememberSelectedChild(this.selectedParentChildId);
        this.parentKPIs = this.buildParentKpis(dashboard);
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
    this.combinedTrendChart?.destroy();
    this.attendanceChart?.destroy();
    this.admissionsTrendChart?.destroy();
  }

  priorityLabel(p: string | undefined): string {
    const key = 'dashboard.enums.priority.' + String(p || '').toLowerCase();
    const t = this.translate.instant(key);
    return t !== key ? t : (p || '');
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
    return [
      {
        labelKey: 'dashboard.teacher.kpi.myClasses',
        value: String(dashboard.assignedClasses),
        icon: 'bi-journal-bookmark-fill',
        bgColor: 'rgba(27,58,48,0.1)',
        color: '#1B3A30',
      },
      {
        labelKey: 'dashboard.teacher.kpi.studentsAssigned',
        value: String(dashboard.studentsAssigned),
        icon: 'bi-people-fill',
        bgColor: 'rgba(192,92,61,0.1)',
        color: '#C05C3D',
      },
      {
        labelKey: 'dashboard.teacher.kpi.upcomingExams',
        value: String(dashboard.upcomingExams),
        icon: 'bi-file-earmark-text',
        bgColor: 'rgba(217,119,6,0.1)',
        color: '#D97706',
      },
      {
        labelKey: 'dashboard.teacher.kpi.unreadAlerts',
        value: String(dashboard.unreadNotifications),
        icon: 'bi-bell-fill',
        bgColor: 'rgba(5,150,105,0.1)',
        color: '#059669',
      },
    ];
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
    this.combinedTrendChart = new Chart(this.combinedTrendChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: monthlyAdmissions.map(point => point.label),
        datasets: [
          { label: t('dashboard.chart.admissions'), data: monthlyAdmissions.map(point => Number(point.value)), backgroundColor: 'rgba(27,58,48,0.8)', borderRadius: 6, barPercentage: 0.55, hidden: !this.showAdmissionsSeries },
          { label: t('dashboard.chart.feeCollection'), data: monthlyCollections.map(point => Number(point.value)), backgroundColor: 'rgba(192,92,61,0.8)', borderRadius: 6, barPercentage: 0.55, hidden: !this.showFeesSeries }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
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
          backgroundColor: ['#1B3A30', '#C05C3D', '#D97706', '#0284C7'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%'
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
          borderColor: '#1B3A30',
          backgroundColor: 'rgba(27,58,48,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#1B3A30'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
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
}
