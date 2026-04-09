import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { PlatformDashboardData, PlatformSchoolAdmin, PlatformSchoolSummary } from '../../core/models/models';
import { PlatformService } from '../../core/services/platform.service';

Chart.register(...registerables);

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="super-admin-page">
      <div class="d-flex justify-content-between align-items-end mb-4 animate-in">
        <div>
          <div class="badge-erp badge-info mb-2">Platform Control Plane</div>
          <h2 style="font-size: 28px; font-weight: 800;">Super Admin Console</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Portfolio-wide visibility across schools, admins, and platform health.</p>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-sm-6 col-xl-3" *ngFor="let card of summaryCards">
          <div class="stat-card">
            <div class="stat-icon" [style.background]="card.bg" [style.color]="card.color"><i class="bi" [ngClass]="card.icon"></i></div>
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-change positive">{{ card.subtext }}</div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-7">
          <div class="erp-card">
            <div class="erp-card-header"><h3 class="erp-card-title">School Growth</h3></div>
            <div class="chart-container" style="height: 280px;"><canvas #growthChart></canvas></div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="erp-card" style="height: 100%;">
            <div class="erp-card-header"><h3 class="erp-card-title">Revenue Trend</h3></div>
            <div class="chart-container" style="height: 280px;"><canvas #revenueChart></canvas></div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-7">
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h3 class="erp-card-title">School Portfolio</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">Operational view across all school workspaces</p>
              </div>
            </div>
            <table class="erp-table">
              <thead>
                <tr><th>School</th><th>Students</th><th>Teachers</th><th>Admins</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let school of schools" (click)="selectSchool(school)" style="cursor: pointer;" [style.background]="selectedSchool?.tenantId === school.tenantId ? 'var(--clr-surface-alt)' : ''">
                  <td>
                    <div style="font-weight: 700;">{{ school.schoolName }}</div>
                    <div style="font-size: 12px; color: var(--clr-text-muted);">{{ school.schoolCode }} · {{ school.address || 'No address' }}</div>
                  </td>
                  <td>{{ school.studentCount }}</td>
                  <td>{{ school.teacherCount }}</td>
                  <td>{{ school.adminCount }}</td>
                  <td>
                    <span class="badge-erp" [ngClass]="school.active ? 'badge-success' : 'badge-warning'">
                      {{ school.active ? 'Active' : 'Attention' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="erp-card" style="height: 100%;">
            <div class="erp-card-header">
              <div>
                <h3 class="erp-card-title">School Admins</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">{{ selectedSchool?.schoolName || 'Select a school' }}</p>
              </div>
            </div>
            <div *ngIf="!selectedSchool" class="empty-state" style="padding: 48px 16px;">
              <i class="bi bi-building"></i>
              <h3>Select a school</h3>
              <p>Admin access and operational context will appear here.</p>
            </div>
            <div *ngIf="selectedSchool">
              <div class="insight-card mb-3" [style.border-left]="'4px solid ' + (selectedSchool.primaryColor || 'var(--clr-primary)')">
                <div class="insight-label">Operational Snapshot</div>
                <div class="insight-value">{{ selectedSchool.studentCount }} students</div>
                <div class="insight-subtext">{{ selectedSchool.teacherCount }} teachers · {{ selectedSchool.adminCount }} admins · {{ selectedSchool.phone || 'No phone' }}</div>
              </div>
              <div *ngFor="let admin of schoolAdmins" class="activity-item">
                <div class="activity-icon" [style.background]="admin.active ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)'" [style.color]="admin.active ? 'var(--clr-success)' : 'var(--clr-warning)'">
                  <i class="bi" [ngClass]="admin.active ? 'bi-person-check-fill' : 'bi-person-dash-fill'"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ admin.name }}</h5>
                  <p>{{ admin.email }} · {{ admin.phone || 'No phone' }}</p>
                </div>
                <button class="btn-outline-erp btn-sm" (click)="toggleAdmin(admin); $event.stopPropagation()">
                  {{ admin.active ? 'Suspend' : 'Activate' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="erp-card">
        <div class="erp-card-header"><h3 class="erp-card-title">Recent Platform Activity</h3></div>
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
  `
})
export class SuperAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('growthChart') growthChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef?: ElementRef<HTMLCanvasElement>;

  dashboard: PlatformDashboardData | null = null;
  schools: PlatformSchoolSummary[] = [];
  schoolAdmins: PlatformSchoolAdmin[] = [];
  selectedSchool: PlatformSchoolSummary | null = null;
  summaryCards: Array<{ label: string; value: string; subtext: string; icon: string; bg: string; color: string }> = [];
  private growthChart?: Chart;
  private revenueChart?: Chart;

  constructor(private platformService: PlatformService) {}

  ngOnInit(): void {
    this.platformService.getDashboard().subscribe(dashboard => {
      this.dashboard = dashboard;
      this.summaryCards = [
        { label: 'Total Schools', value: String(dashboard.totalSchools), subtext: `${dashboard.activeSchools} active workspaces`, icon: 'bi-buildings-fill', bg: 'rgba(15,23,42,0.08)', color: '#0F172A' },
        { label: 'Students Managed', value: String(dashboard.totalStudents), subtext: 'Cross-tenant enrolment footprint', icon: 'bi-people-fill', bg: 'rgba(14,165,233,0.10)', color: '#0284C7' },
        { label: 'Teachers Managed', value: String(dashboard.totalTeachers), subtext: 'Faculty accounts under platform governance', icon: 'bi-person-badge-fill', bg: 'rgba(192,92,61,0.10)', color: '#C05C3D' },
        { label: 'Campus Admins', value: String(dashboard.totalAdmins), subtext: 'Operational admins across tenants', icon: 'bi-shield-lock-fill', bg: 'rgba(5,150,105,0.10)', color: '#059669' }
      ];
      setTimeout(() => this.initCharts(), 0);
    });
    this.platformService.getSchools().subscribe(schools => {
      this.schools = schools;
      if (schools.length) {
        this.selectSchool(schools[0]);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.growthChart?.destroy();
    this.revenueChart?.destroy();
  }

  selectSchool(school: PlatformSchoolSummary): void {
    this.selectedSchool = school;
    this.platformService.getSchoolAdmins(school.tenantId).subscribe(admins => this.schoolAdmins = admins);
  }

  toggleAdmin(admin: PlatformSchoolAdmin): void {
    if (!this.selectedSchool) {
      return;
    }
    this.platformService.toggleSchoolAdminStatus(this.selectedSchool.tenantId, admin.id, !admin.active).subscribe(updated => {
      this.schoolAdmins = this.schoolAdmins.map(current => current.id === updated.id ? updated : current);
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

    this.growthChart = new Chart(this.growthChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.dashboard.schoolGrowth.map(point => point.label),
        datasets: [{
          label: 'New Schools',
          data: this.dashboard.schoolGrowth.map(point => point.value),
          borderColor: '#0F172A',
          backgroundColor: 'rgba(15,23,42,0.10)',
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    this.revenueChart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.dashboard.revenueTrend.map(point => point.label),
        datasets: [{
          label: 'MRR',
          data: this.dashboard.revenueTrend.map(point => point.value),
          backgroundColor: 'rgba(14,165,233,0.85)',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
      }
    });
  }
}
