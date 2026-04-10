import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AdminDashboardData, ParentDashboardData, TeacherDashboardData } from '../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div data-testid="dashboard-page">
      <div class="d-flex justify-content-end mb-2">
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshDashboard()" [disabled]="loading || refreshing" data-testid="dashboard-refresh">
          <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
      <div *ngIf="loading" class="empty-state">
        <i class="bi bi-hourglass-split"></i><h3>Loading Dashboard</h3><p>Fetching live ERP insights</p>
      </div>

      <ng-container *ngIf="!loading && role === 'admin'">
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3" *ngFor="let kpi of adminKPIs">
            <div class="stat-card">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color"><i class="bi" [ngClass]="kpi.icon"></i></div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.label }}</div>
              <div class="stat-change positive">{{ kpi.subtext }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-8">
            <div class="erp-card">
              <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
                <h3 class="erp-card-title mb-0">Intake &amp; collections</h3>
                <div class="d-flex flex-wrap gap-3 align-items-center small">
                  <label class="d-flex align-items-center gap-2 mb-0" style="cursor: pointer;">
                    <input type="checkbox" [(ngModel)]="showAdmissionsSeries" (change)="updateCombinedTrendChart()" />
                    Admissions
                  </label>
                  <label class="d-flex align-items-center gap-2 mb-0" style="cursor: pointer;">
                    <input type="checkbox" [(ngModel)]="showFeesSeries" (change)="updateCombinedTrendChart()" />
                    Fee collection
                  </label>
                </div>
              </div>
              <div class="chart-container"><canvas #combinedTrendChart></canvas></div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h3 class="erp-card-title mb-0">Attendance overview</h3>
                <div class="d-flex flex-wrap gap-2 small">
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" title="Present">
                    <input type="checkbox" [(ngModel)]="attSlicePresent" (change)="updateAttendanceChart()" />
                    P
                  </label>
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" title="Absent">
                    <input type="checkbox" [(ngModel)]="attSliceAbsent" (change)="updateAttendanceChart()" />
                    A
                  </label>
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" title="Late">
                    <input type="checkbox" [(ngModel)]="attSliceLate" (change)="updateAttendanceChart()" />
                    L
                  </label>
                  <label class="d-flex align-items-center gap-1 mb-0" style="cursor: pointer;" title="Excused">
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
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">Admissions Snapshot</h3></div>
              <div class="insight-list">
                <div *ngFor="let insight of admissionInsights" class="insight-card">
                  <div class="insight-label">{{ insight.label }}</div>
                  <div class="insight-value" [style.color]="insight.tone">{{ insight.value }}</div>
                  <div class="insight-subtext">{{ insight.subtext }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">Admissions Trend</h3></div>
              <div class="chart-container" style="height: 280px;"><canvas #admissionsTrendChart></canvas></div>
            </div>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Recent Activity</h3></div>
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
              <div class="erp-card-header"><h3 class="erp-card-title">Upcoming Events</h3></div>
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
              <div class="stat-label">{{ kpi.label }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-5">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">Parent Message Queue</h3></div>
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
                  <span class="badge-erp" [ngClass]="item.priority === 'high' ? 'badge-danger' : 'badge-neutral'">{{ item.priority }}</span>
                </div>
              </div>
              <ng-template #noMsgQueue>
                <div class="empty-state" style="padding: 20px 12px;">
                  <i class="bi bi-inbox"></i>
                  <h3>No pending parent messages</h3>
                  <p>New requests will appear here for quick follow-up.</p>
                </div>
              </ng-template>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header"><h3 class="erp-card-title">Class Teacher Overview</h3></div>
              <div *ngIf="(teacherDashboard?.classTeacherOf || []).length; else noClassTeacher">
                <div *ngFor="let cls of teacherDashboard?.classTeacherOf" class="insight-card" style="margin-bottom: 10px;">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="insight-label">Class Teacher</div>
                      <div class="insight-value">{{ cls.className }}{{ cls.sectionName ? ' - ' + cls.sectionName : '' }}</div>
                      <div class="insight-subtext">{{ cls.totalStudents }} students · Attendance + announcements + parent communication</div>
                    </div>
                    <div class="d-flex gap-2">
                      <a class="btn-outline-erp btn-sm" [routerLink]="['/app/attendance']">Attendance</a>
                      <a class="btn-outline-erp btn-sm" [routerLink]="['/app/chat']">Inbox</a>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noClassTeacher>
                <div class="empty-state" style="padding: 20px 12px;">
                  <i class="bi bi-person-badge"></i>
                  <h3>No class teacher assignment</h3>
                  <p>Once assigned, you’ll see your class teacher duties here.</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-8">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Today's Timetable</h3></div>
              <table class="erp-table">
                <thead><tr><th>Period</th><th>Time</th><th>Subject</th><th>Class</th><th>Room</th></tr></thead>
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
              <div class="erp-card-header"><h3 class="erp-card-title">Pending Tasks</h3></div>
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
        <div class="erp-card mb-4" *ngIf="(parentDashboard?.children || []).length">
          <div class="row g-3 align-items-end">
            <div class="col-md-6">
              <label class="erp-label">Child</label>
              <select class="erp-select" [(ngModel)]="selectedParentChildId" (change)="onParentChildChange()">
                <option *ngFor="let c of parentDashboard?.children" [value]="c.id">
                  {{ c.firstName }} {{ c.lastName }} · {{ c.className || ('Class ' + c.classId) }}{{ c.sectionName ? ' - ' + c.sectionName : '' }}
                </option>
              </select>
            </div>
            <div class="col-md-6 d-flex justify-content-end gap-2">
              <a class="btn-outline-erp btn-sm" [routerLink]="['/app/chat']"><i class="bi bi-inbox-fill me-1"></i> Inbox</a>
              <a class="btn-primary-erp btn-sm" [routerLink]="['/app/parent']"><i class="bi bi-credit-card-fill me-1"></i> Fees</a>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3" *ngFor="let kpi of parentKPIs">
            <div class="stat-card">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color"><i class="bi" [ngClass]="kpi.icon"></i></div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.label }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4" *ngIf="(parentDashboard?.alerts || []).length">
          <div class="col-lg-12">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Alerts & Reminders</h3></div>
              <div *ngFor="let a of parentDashboard?.alerts" class="activity-item">
                <div class="activity-icon" [style.background]="a.type === 'warning' ? 'rgba(217,119,6,0.12)' : 'rgba(2,132,199,0.12)'" [style.color]="a.type === 'warning' ? 'var(--clr-warning)' : 'var(--clr-info)'">
                  <i class="bi" [ngClass]="a.type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ a.title }}</h5>
                  <p>{{ a.message }}</p>
                </div>
                <a *ngIf="a.ctaRoute" class="btn-outline-erp btn-sm" [routerLink]="[a.ctaRoute]">{{ a.ctaLabel || 'Open' }}</a>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-6">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Child Performance</h3></div>
              <table class="erp-table">
                <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                <tbody>
                  <tr *ngFor="let mark of parentDashboard?.childPerformance">
                    <td><strong>{{ mark.subjectName }}</strong></td>
                    <td>{{ mark.marksObtained }}/{{ mark.maxMarks }}</td>
                    <td>{{ mark.grade }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Fee Status</h3></div>
              <div *ngFor="let fee of parentDashboard?.feeStatus" class="activity-item">
                <div class="activity-icon" style="background: rgba(220,38,38,0.1); color: var(--clr-danger);"><i class="bi bi-credit-card"></i></div>
                <div class="activity-content">
                  <h5>{{ fee.studentName }} - {{ fee.dueAmount | currency:'INR':'symbol':'1.0-0' }}</h5>
                  <p>Due: {{ fee.dueDate }} &middot; <span style="font-weight: 600;">{{ fee.status }}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mt-1" *ngIf="(parentDashboard?.upcoming || []).length">
          <div class="col-lg-12">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Upcoming</h3></div>
              <div *ngFor="let u of parentDashboard?.upcoming" class="activity-item">
                <div class="activity-icon" style="background: rgba(5,150,105,0.1); color: var(--clr-success);"><i class="bi bi-calendar-event"></i></div>
                <div class="activity-content">
                  <h5>{{ u.title }}</h5>
                  <p>{{ u.date }} &middot; {{ u.description || '' }}</p>
                </div>
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
  adminKPIs: Array<{ label: string; value: string; icon: string; bgColor: string; color: string; subtext: string }> = [];
  admissionInsights: Array<{ label: string; value: string; subtext: string; tone: string }> = [];
  teacherKPIs: Array<{ label: string; value: string; icon: string; bgColor: string; color: string }> = [];
  parentKPIs: Array<{ label: string; value: string; icon: string; bgColor: string; color: string }> = [];
  selectedParentChildId = '';
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole() || 'admin';
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
          this.adminKPIs = [
            { label: 'Total Students', value: String(dashboard.totalStudents), icon: 'bi-people-fill', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30', subtext: 'Live enrolment' },
            { label: 'Total Teachers', value: String(dashboard.totalTeachers), icon: 'bi-person-badge-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D', subtext: 'Current staff strength' },
            { label: 'Fees Collected', value: this.asCurrency(dashboard.feesCollected), icon: 'bi-credit-card-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669', subtext: `${dashboard.collectionRate}% collection rate` },
            { label: 'Attendance Logged', value: String(dashboard.attendanceOverview?.total ?? 0), icon: 'bi-calendar-check-fill', bgColor: 'rgba(2,132,199,0.1)', color: '#0284C7', subtext: 'Today' }
          ];
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
          this.teacherKPIs = [
            { label: 'My Classes', value: String(dashboard.assignedClasses), icon: 'bi-journal-bookmark-fill', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
            { label: 'Students Assigned', value: String(dashboard.studentsAssigned), icon: 'bi-people-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D' },
            { label: 'Upcoming Exams', value: String(dashboard.upcomingExams), icon: 'bi-file-earmark-text', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
            { label: 'Unread Alerts', value: String(dashboard.unreadNotifications), icon: 'bi-bell-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' }
          ];
          finish();
        },
        error: () => finish()
      });
      return;
    }
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const to = today.toISOString().slice(0, 10);
    this.dashboardService.getParentDashboard(from, to).subscribe({
      next: dashboard => {
        this.parentDashboard = dashboard;
        this.selectedParentChildId = dashboard.selectedChildId || dashboard.selectedChild?.id || '';
        this.parentKPIs = [
          { label: 'Children Linked', value: String(dashboard.childCount), icon: 'bi-person-heart', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
          { label: 'Attendance', value: `${dashboard.attendancePercentage.toFixed(1)}%`, icon: 'bi-calendar-check-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' },
          { label: 'Overall Grade', value: dashboard.overallGrade, icon: 'bi-trophy-fill', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
          { label: 'Fee Due', value: this.asCurrency(dashboard.feeDue), icon: 'bi-credit-card-fill', bgColor: 'rgba(220,38,38,0.1)', color: '#DC2626' }
        ];
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
          this.adminKPIs = [
            { label: 'Total Students', value: String(dashboard.totalStudents), icon: 'bi-people-fill', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30', subtext: 'Live enrolment' },
            { label: 'Total Teachers', value: String(dashboard.totalTeachers), icon: 'bi-person-badge-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D', subtext: 'Current staff strength' },
            { label: 'Fees Collected', value: this.asCurrency(dashboard.feesCollected), icon: 'bi-credit-card-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669', subtext: `${dashboard.collectionRate}% collection rate` },
            { label: 'Attendance Logged', value: String(dashboard.attendanceOverview?.total ?? 0), icon: 'bi-calendar-check-fill', bgColor: 'rgba(2,132,199,0.1)', color: '#0284C7', subtext: 'Today' }
          ];
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
          this.teacherKPIs = [
            { label: 'My Classes', value: String(dashboard.assignedClasses), icon: 'bi-journal-bookmark-fill', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
            { label: 'Students Assigned', value: String(dashboard.studentsAssigned), icon: 'bi-people-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D' },
            { label: 'Upcoming Exams', value: String(dashboard.upcomingExams), icon: 'bi-file-earmark-text', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
            { label: 'Unread Alerts', value: String(dashboard.unreadNotifications), icon: 'bi-bell-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' }
          ];
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
    this.dashboardService.getParentDashboard(from, to).subscribe({
      next: dashboard => {
        this.parentDashboard = dashboard;
        this.selectedParentChildId = dashboard.selectedChildId || dashboard.selectedChild?.id || '';
        this.parentKPIs = [
          { label: 'Children Linked', value: String(dashboard.childCount), icon: 'bi-person-heart', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
          { label: 'Attendance', value: `${dashboard.attendancePercentage.toFixed(1)}%`, icon: 'bi-calendar-check-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' },
          { label: 'Overall Grade', value: dashboard.overallGrade, icon: 'bi-trophy-fill', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
          { label: 'Fee Due', value: this.asCurrency(dashboard.feeDue), icon: 'bi-credit-card-fill', bgColor: 'rgba(220,38,38,0.1)', color: '#DC2626' }
        ];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onParentChildChange(): void {
    if (!this.parentDashboard?.children?.length) return;
    const selected = this.parentDashboard.children.find(c => c.id === this.selectedParentChildId);
    if (!selected) return;
    // MVP: swap selectedChild locally; backend-backed version will re-fetch per-child
    this.parentDashboard = { ...this.parentDashboard, selectedChild: selected, selectedChildId: selected.id };
  }

  ngAfterViewInit(): void {
    if (!this.loading && this.role === 'admin') {
      this.initAdminCharts();
    }
  }

  ngOnDestroy(): void {
    this.combinedTrendChart?.destroy();
    this.attendanceChart?.destroy();
    this.admissionsTrendChart?.destroy();
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

    this.combinedTrendChart = new Chart(this.combinedTrendChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: monthlyAdmissions.map(point => point.label),
        datasets: [
          { label: 'Admissions', data: monthlyAdmissions.map(point => Number(point.value)), backgroundColor: 'rgba(27,58,48,0.8)', borderRadius: 6, barPercentage: 0.55, hidden: !this.showAdmissionsSeries },
          { label: 'Fee collection', data: monthlyCollections.map(point => Number(point.value)), backgroundColor: 'rgba(192,92,61,0.8)', borderRadius: 6, barPercentage: 0.55, hidden: !this.showFeesSeries }
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
        labels: ['Present', 'Absent', 'Late', 'Excused'],
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
          label: 'Admissions',
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

  private buildAdmissionInsights(dashboard: AdminDashboardData): Array<{ label: string; value: string; subtext: string; tone: string }> {
    const admissions = dashboard.monthlyAdmissions.map(point => point.value);
    const total = admissions.reduce((sum, value) => sum + value, 0);
    const average = admissions.length ? total / admissions.length : 0;
    const peakValue = admissions.length ? Math.max(...admissions) : 0;
    const peakMonth = dashboard.monthlyAdmissions.find(point => point.value === peakValue)?.label || '-';
    const latest = admissions[admissions.length - 1] ?? 0;
    const previous = admissions[admissions.length - 2] ?? 0;
    const trend = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

    return [
      {
        label: 'Six-Month Intake',
        value: String(total),
        subtext: 'Confirmed admissions across the current rolling window',
        tone: 'var(--clr-primary)'
      },
      {
        label: 'Peak Month',
        value: `${peakMonth} · ${peakValue}`,
        subtext: 'Strongest enrolment month in the current trend line',
        tone: 'var(--clr-accent)'
      },
      {
        label: 'Monthly Average',
        value: average.toFixed(1),
        subtext: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}% versus previous month`,
        tone: trend >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'
      }
    ];
  }

  private asCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  }
}
