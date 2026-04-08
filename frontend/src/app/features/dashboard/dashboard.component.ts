import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div data-testid="dashboard-page">
      <!-- Admin Dashboard -->
      <ng-container *ngIf="role === 'admin'">
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3 animate-in animate-in-delay-1" *ngFor="let kpi of adminKPIs; let i = index">
            <div class="stat-card" [attr.data-testid]="'kpi-card-' + i">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color">
                <i class="bi" [ngClass]="kpi.icon"></i>
              </div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.label }}</div>
              <div class="stat-change" [ngClass]="kpi.change >= 0 ? 'positive' : 'negative'">
                <i class="bi" [ngClass]="kpi.change >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'"></i>
                {{ kpi.change > 0 ? '+' : '' }}{{ kpi.change }}% this month
              </div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-8 animate-in animate-in-delay-3">
            <div class="erp-card">
              <div class="erp-card-header">
                <h3 class="erp-card-title">Monthly Admissions & Fee Collection</h3>
              </div>
              <div class="chart-container">
                <canvas #admissionChart></canvas>
              </div>
            </div>
          </div>
          <div class="col-lg-4 animate-in animate-in-delay-4">
            <div class="erp-card" style="height: 100%;">
              <div class="erp-card-header">
                <h3 class="erp-card-title">Attendance Overview</h3>
              </div>
              <div class="chart-container" style="height: 220px;">
                <canvas #attendanceChart></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-lg-6 animate-in animate-in-delay-5">
            <div class="erp-card">
              <div class="erp-card-header">
                <h3 class="erp-card-title">Recent Activity</h3>
              </div>
              <div *ngFor="let activity of recentActivities" class="activity-item">
                <div class="activity-icon" [style.background]="activity.bgColor" [style.color]="activity.color">
                  <i class="bi" [ngClass]="activity.icon"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ activity.title }}</h5>
                  <p>{{ activity.time }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6 animate-in animate-in-delay-5">
            <div class="erp-card">
              <div class="erp-card-header">
                <h3 class="erp-card-title">Upcoming Events</h3>
              </div>
              <div *ngFor="let event of upcomingEvents" class="activity-item">
                <div class="activity-icon" style="background: rgba(2,132,199,0.1); color: var(--clr-info);">
                  <i class="bi bi-calendar-event"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ event.title }}</h5>
                  <p>{{ event.date }} &middot; {{ event.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Teacher Dashboard -->
      <ng-container *ngIf="role === 'teacher'">
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3 animate-in" *ngFor="let kpi of teacherKPIs; let i = index">
            <div class="stat-card">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color">
                <i class="bi" [ngClass]="kpi.icon"></i>
              </div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.label }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-lg-8 animate-in animate-in-delay-2">
            <div class="erp-card">
              <div class="erp-card-header">
                <h3 class="erp-card-title">Today's Timetable</h3>
              </div>
              <table class="erp-table">
                <thead><tr><th>Period</th><th>Time</th><th>Subject</th><th>Class</th><th>Room</th></tr></thead>
                <tbody>
                  <tr *ngFor="let slot of todaySchedule">
                    <td>{{ slot.period }}</td>
                    <td>{{ slot.time }}</td>
                    <td><strong>{{ slot.subject }}</strong></td>
                    <td>{{ slot.class }}</td>
                    <td>{{ slot.room }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-lg-4 animate-in animate-in-delay-3">
            <div class="erp-card">
              <div class="erp-card-header">
                <h3 class="erp-card-title">Pending Tasks</h3>
              </div>
              <div *ngFor="let task of pendingTasks" class="activity-item">
                <div class="activity-icon" [style.background]="task.bgColor" [style.color]="task.color">
                  <i class="bi" [ngClass]="task.icon"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ task.title }}</h5>
                  <p>{{ task.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Parent Dashboard -->
      <ng-container *ngIf="role === 'parent'">
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3 animate-in" *ngFor="let kpi of parentKPIs; let i = index">
            <div class="stat-card">
              <div class="stat-icon" [style.background]="kpi.bgColor" [style.color]="kpi.color">
                <i class="bi" [ngClass]="kpi.icon"></i>
              </div>
              <div class="stat-value">{{ kpi.value }}</div>
              <div class="stat-label">{{ kpi.label }}</div>
            </div>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-lg-6 animate-in animate-in-delay-2">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Child Performance</h3></div>
              <table class="erp-table">
                <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let subj of childPerformance">
                    <td><strong>{{ subj.subject }}</strong></td>
                    <td>{{ subj.marks }}/{{ subj.total }}</td>
                    <td>{{ subj.grade }}</td>
                    <td><span class="badge-erp" [ngClass]="subj.marks >= 70 ? 'badge-success' : subj.marks >= 50 ? 'badge-warning' : 'badge-danger'">
                      {{ subj.marks >= 70 ? 'Good' : subj.marks >= 50 ? 'Average' : 'Needs Improvement' }}
                    </span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-lg-6 animate-in animate-in-delay-3">
            <div class="erp-card">
              <div class="erp-card-header"><h3 class="erp-card-title">Fee Status</h3></div>
              <div *ngFor="let fee of feeStatus" class="activity-item">
                <div class="activity-icon" [style.background]="fee.bgColor" [style.color]="fee.color">
                  <i class="bi bi-credit-card"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ fee.name }} - {{ fee.amount }}</h5>
                  <p>Due: {{ fee.dueDate }} &middot;
                    <span [style.color]="fee.statusColor" style="font-weight: 600;">{{ fee.status }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('admissionChart') admissionChartRef!: ElementRef;
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef;

  role = 'admin';

  adminKPIs = [
    { label: 'Total Students', value: '2,847', icon: 'bi-people-fill', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30', change: 5.2 },
    { label: 'Total Teachers', value: '124', icon: 'bi-person-badge-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D', change: 2.1 },
    { label: 'Fees Collected', value: '$284K', icon: 'bi-credit-card-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669', change: 12.4 },
    { label: 'Avg Attendance', value: '94.2%', icon: 'bi-calendar-check-fill', bgColor: 'rgba(2,132,199,0.1)', color: '#0284C7', change: -1.3 },
  ];

  teacherKPIs = [
    { label: 'My Classes', value: '6', icon: 'bi-journal-bookmark-fill', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
    { label: 'Students Assigned', value: '186', icon: 'bi-people-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D' },
    { label: 'Pending Evaluations', value: '12', icon: 'bi-pencil-square', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
    { label: 'Avg Class Score', value: '78%', icon: 'bi-graph-up-arrow', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' },
  ];

  parentKPIs = [
    { label: 'Child: Emma Chen', value: 'Class 8-A', icon: 'bi-person-heart', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
    { label: 'Attendance', value: '96%', icon: 'bi-calendar-check-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' },
    { label: 'Overall Grade', value: 'A', icon: 'bi-trophy-fill', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
    { label: 'Fee Due', value: '$1,200', icon: 'bi-credit-card-fill', bgColor: 'rgba(220,38,38,0.1)', color: '#DC2626' },
  ];

  recentActivities = [
    { title: 'New student Arjun Patel admitted to Class 5-A', time: '2 hours ago', icon: 'bi-person-plus-fill', bgColor: 'rgba(5,150,105,0.1)', color: 'var(--clr-success)' },
    { title: 'Fee payment of $2,500 from Emily Watson', time: '4 hours ago', icon: 'bi-credit-card-2-front-fill', bgColor: 'rgba(2,132,199,0.1)', color: 'var(--clr-info)' },
    { title: 'Teacher Sarah Mitchell updated Class 8 marks', time: '5 hours ago', icon: 'bi-pencil-fill', bgColor: 'rgba(192,92,61,0.1)', color: 'var(--clr-accent)' },
    { title: 'Midterm exam schedule published', time: '1 day ago', icon: 'bi-megaphone-fill', bgColor: 'rgba(217,119,6,0.1)', color: 'var(--clr-warning)' },
    { title: 'Library books returned by Class 7 students', time: '1 day ago', icon: 'bi-book-fill', bgColor: 'rgba(27,58,48,0.1)', color: 'var(--clr-primary)' },
  ];

  upcomingEvents = [
    { title: 'Parent-Teacher Meeting', date: 'Feb 15, 2026', description: 'All parents invited' },
    { title: 'Annual Sports Day', date: 'Feb 22, 2026', description: 'Inter-house competitions' },
    { title: 'Science Exhibition', date: 'Mar 5, 2026', description: 'Classes 6-12' },
    { title: 'Midterm Exams Begin', date: 'Mar 10, 2026', description: 'All classes' },
  ];

  todaySchedule = [
    { period: 1, time: '08:00 - 08:45', subject: 'Mathematics', class: 'Class 8-A', room: 'Room 201' },
    { period: 2, time: '08:45 - 09:30', subject: 'Mathematics', class: 'Class 9-B', room: 'Room 301' },
    { period: 3, time: '09:45 - 10:30', subject: 'Physics', class: 'Class 10-A', room: 'Lab 1' },
    { period: 4, time: '10:30 - 11:15', subject: 'Mathematics', class: 'Class 7-C', room: 'Room 105' },
    { period: 5, time: '11:30 - 12:15', subject: 'Free Period', class: '-', room: '-' },
    { period: 6, time: '12:15 - 13:00', subject: 'Physics', class: 'Class 11-A', room: 'Lab 2' },
  ];

  pendingTasks = [
    { title: 'Grade Class 8-A Assignments', description: '24 submissions pending', icon: 'bi-file-earmark-text', bgColor: 'rgba(220,38,38,0.1)', color: 'var(--clr-danger)' },
    { title: 'Submit Class 9-B Attendance', description: 'Today\'s attendance not marked', icon: 'bi-calendar-x', bgColor: 'rgba(217,119,6,0.1)', color: 'var(--clr-warning)' },
    { title: 'Review Exam Papers', description: 'Class 10 midterm papers', icon: 'bi-journal-check', bgColor: 'rgba(2,132,199,0.1)', color: 'var(--clr-info)' },
  ];

  childPerformance = [
    { subject: 'Mathematics', marks: 92, total: 100, grade: 'A+' },
    { subject: 'Science', marks: 85, total: 100, grade: 'A' },
    { subject: 'English', marks: 78, total: 100, grade: 'B+' },
    { subject: 'History', marks: 88, total: 100, grade: 'A' },
    { subject: 'Computer Science', marks: 95, total: 100, grade: 'A+' },
  ];

  feeStatus = [
    { name: 'Tuition Fee (Q3)', amount: '$800', dueDate: 'Mar 15, 2026', status: 'Unpaid', statusColor: 'var(--clr-danger)', bgColor: 'rgba(220,38,38,0.1)', color: 'var(--clr-danger)' },
    { name: 'Transport Fee (Feb)', amount: '$200', dueDate: 'Feb 28, 2026', status: 'Unpaid', statusColor: 'var(--clr-warning)', bgColor: 'rgba(217,119,6,0.1)', color: 'var(--clr-warning)' },
    { name: 'Tuition Fee (Q2)', amount: '$800', dueDate: 'Dec 15, 2025', status: 'Paid', statusColor: 'var(--clr-success)', bgColor: 'rgba(5,150,105,0.1)', color: 'var(--clr-success)' },
    { name: 'Lab Fee', amount: '$150', dueDate: 'Jan 10, 2026', status: 'Paid', statusColor: 'var(--clr-success)', bgColor: 'rgba(5,150,105,0.1)', color: 'var(--clr-success)' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.role = this.authService.getRole() || 'admin';
  }

  ngAfterViewInit(): void {
    if (this.role === 'admin') {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  private initCharts(): void {
    if (this.admissionChartRef) {
      new Chart(this.admissionChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
          datasets: [
            { label: 'Admissions', data: [42, 35, 28, 15, 48, 32], backgroundColor: 'rgba(27,58,48,0.8)', borderRadius: 6, barPercentage: 0.5 },
            { label: 'Fee Collection ($K)', data: [45, 52, 48, 38, 55, 47], backgroundColor: 'rgba(192,92,61,0.8)', borderRadius: 6, barPercentage: 0.5 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { family: 'IBM Plex Sans' } } } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } } }
        }
      });
    }
    if (this.attendanceChartRef) {
      new Chart(this.attendanceChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent', 'Late'],
          datasets: [{ data: [94.2, 3.8, 2], backgroundColor: ['#1B3A30', '#C05C3D', '#D97706'], borderWidth: 0, spacing: 2 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { family: 'IBM Plex Sans' } } } }
        }
      });
    }
  }
}
