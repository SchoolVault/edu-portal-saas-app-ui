import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReportRow { [key: string]: any; }

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="reports-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Reports & Analytics</h2><p class="text-muted mb-0" style="font-size: 13px;">Comprehensive school reports with filters and export</p></div>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'performance'" (click)="tab = 'performance'; genPerformance()" data-testid="tab-performance">Student Performance</button>
        <button class="erp-tab" [class.active]="tab === 'attendance'" (click)="tab = 'attendance'; genAttendance()" data-testid="tab-attendance-report">Attendance</button>
        <button class="erp-tab" [class.active]="tab === 'fees'" (click)="tab = 'fees'; genFees()" data-testid="tab-fee-report">Fee Collection</button>
        <button class="erp-tab" [class.active]="tab === 'class'" (click)="tab = 'class'; genClassSummary()" data-testid="tab-class-report">Class Summary</button>
        <button class="erp-tab" [class.active]="tab === 'teacher'" (click)="tab = 'teacher'; genTeacher()" data-testid="tab-teacher-report">Teacher Workload</button>
      </div>

      <!-- STUDENT PERFORMANCE REPORT -->
      <div *ngIf="tab === 'performance'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-3"><label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="perfClass" (change)="genPerformance()"><option value="Class 8">Class 8</option><option value="Class 5">Class 5</option><option value="Class 9">Class 9</option></select></div>
            <div class="col-md-3"><label class="erp-label">Exam</label>
              <select class="erp-select" [(ngModel)]="perfExam" (change)="genPerformance()"><option value="Midterm">Midterm Examination</option><option value="Unit Test 1">First Unit Test</option></select></div>
            <div class="col-md-3"><button class="btn-primary-erp" style="width:100%;" data-testid="gen-perf-btn"><i class="bi bi-play-fill me-1"></i>Generate</button></div>
            <div class="col-md-3 text-end"><button class="btn-outline-erp btn-sm" data-testid="export-perf-btn"><i class="bi bi-download me-1"></i>Export CSV</button></div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ perfStats.total }}</div><div class="stat-label">Students Evaluated</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ perfStats.avg }}%</div><div class="stat-label">Class Average</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ perfStats.pass }}%</div><div class="stat-label">Pass Rate (>40%)</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ perfStats.topStudent }}</div><div class="stat-label">Class Topper</div></div></div>
        </div>
        <div class="erp-card">
          <h4 class="erp-card-title mb-3">{{ perfClass }} - {{ perfExam }} Results</h4>
          <table class="erp-table" data-testid="perf-report-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Maths</th><th>Science</th><th>English</th><th>History</th><th>Computer</th><th>Total</th><th>%</th><th>Grade</th><th>Remarks</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of perfData; let i = index">
                <td><strong>{{ i + 1 }}</strong></td>
                <td><strong>{{ r['name'] }}</strong></td>
                <td>{{ r['maths'] }}</td><td>{{ r['science'] }}</td><td>{{ r['english'] }}</td><td>{{ r['history'] }}</td><td>{{ r['computer'] }}</td>
                <td><strong>{{ r['total'] }}/500</strong></td>
                <td><strong>{{ r['pct'] }}%</strong></td>
                <td><span class="badge-erp" [ngClass]="r['pct'] >= 80 ? 'badge-success' : r['pct'] >= 60 ? 'badge-info' : r['pct'] >= 40 ? 'badge-warning' : 'badge-danger'">{{ r['grade'] }}</span></td>
                <td style="font-size:12px; color: var(--clr-text-muted);">{{ r['pct'] >= 80 ? 'Excellent' : r['pct'] >= 60 ? 'Good' : r['pct'] >= 40 ? 'Average' : 'Needs Improvement' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ATTENDANCE REPORT -->
      <div *ngIf="tab === 'attendance'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-3"><label class="erp-label">Class</label><select class="erp-select" [(ngModel)]="attClass" (change)="genAttendance()"><option value="Class 8">Class 8</option><option value="Class 5">Class 5</option><option value="Class 9">Class 9</option></select></div>
            <div class="col-md-3"><label class="erp-label">Month</label><select class="erp-select" [(ngModel)]="attMonth" (change)="genAttendance()"><option value="January">January 2026</option><option value="February">February 2026</option><option value="December">December 2025</option></select></div>
            <div class="col-md-3"><button class="btn-primary-erp" style="width:100%;"><i class="bi bi-play-fill me-1"></i>Generate</button></div>
            <div class="col-md-3 text-end"><button class="btn-outline-erp btn-sm"><i class="bi bi-download me-1"></i>Export CSV</button></div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ attStats.totalStudents }}</div><div class="stat-label">Total Students</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value" style="color: var(--clr-success);">{{ attStats.avgAttendance }}%</div><div class="stat-label">Avg Attendance</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value" style="color: var(--clr-danger);">{{ attStats.belowThreshold }}</div><div class="stat-label">Below 75% (At Risk)</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ attStats.workingDays }}</div><div class="stat-label">Working Days</div></div></div>
        </div>
        <div class="erp-card">
          <h4 class="erp-card-title mb-3">{{ attClass }} - {{ attMonth }} Attendance</h4>
          <table class="erp-table" data-testid="att-report-table">
            <thead><tr><th>#</th><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>Attendance %</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of attData; let i = index">
                <td>{{ i + 1 }}</td>
                <td><strong>{{ r['name'] }}</strong></td>
                <td style="color: var(--clr-success);">{{ r['present'] }}</td>
                <td style="color: var(--clr-danger);">{{ r['absent'] }}</td>
                <td style="color: var(--clr-warning);">{{ r['late'] }}</td>
                <td>{{ r['total'] }}</td>
                <td><strong>{{ r['pct'] }}%</strong></td>
                <td><span class="badge-erp" [ngClass]="r['pct'] >= 90 ? 'badge-success' : r['pct'] >= 75 ? 'badge-warning' : 'badge-danger'">{{ r['pct'] >= 90 ? 'Good' : r['pct'] >= 75 ? 'Warning' : 'Critical' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FEE COLLECTION REPORT -->
      <div *ngIf="tab === 'fees'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-3"><label class="erp-label">Class</label><select class="erp-select" [(ngModel)]="feeClass" (change)="genFees()"><option value="">All Classes</option><option value="Class 5">Class 5</option><option value="Class 8">Class 8</option><option value="Class 9">Class 9</option></select></div>
            <div class="col-md-3"><label class="erp-label">Status</label><select class="erp-select" [(ngModel)]="feeStatus" (change)="genFees()"><option value="">All</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option><option value="overdue">Overdue</option></select></div>
            <div class="col-md-3"><button class="btn-primary-erp" style="width:100%;"><i class="bi bi-play-fill me-1"></i>Generate</button></div>
            <div class="col-md-3 text-end"><button class="btn-outline-erp btn-sm"><i class="bi bi-download me-1"></i>Export CSV</button></div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value" style="color: var(--clr-success);">&#36;{{ feeStats.collected | number }}</div><div class="stat-label">Total Collected</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value" style="color: var(--clr-danger);">&#36;{{ feeStats.pending | number }}</div><div class="stat-label">Total Pending</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeStats.collectionRate }}%</div><div class="stat-label">Collection Rate</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value" style="color: var(--clr-warning);">{{ feeStats.overdueCount }}</div><div class="stat-label">Overdue Accounts</div></div></div>
        </div>
        <div class="erp-card">
          <h4 class="erp-card-title mb-3">Fee Collection Details</h4>
          <table class="erp-table" data-testid="fee-report-table">
            <thead><tr><th>Student</th><th>Class</th><th>Total Fee</th><th>Paid</th><th>Discount</th><th>Late Fee</th><th>Pending</th><th>Last Payment</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of feeData">
                <td><strong>{{ r['name'] }}</strong></td>
                <td>{{ r['class'] }}</td>
                <td>&#36;{{ r['total'] | number }}</td>
                <td style="color: var(--clr-success);">&#36;{{ r['paid'] | number }}</td>
                <td>&#36;{{ r['discount'] | number }}</td>
                <td [style.color]="r['lateFee'] > 0 ? 'var(--clr-danger)' : ''">&#36;{{ r['lateFee'] | number }}</td>
                <td style="color: var(--clr-danger);">&#36;{{ r['pending'] | number }}</td>
                <td>{{ r['lastPayment'] }}</td>
                <td><span class="badge-erp" [ngClass]="{'badge-success': r['status']==='paid', 'badge-warning': r['status']==='partial', 'badge-danger': r['status']==='overdue', 'badge-neutral': r['status']==='unpaid'}">{{ r['status'] }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CLASS SUMMARY REPORT -->
      <div *ngIf="tab === 'class'" class="animate-in">
        <div class="erp-card mb-4"><h4 class="erp-card-title mb-3">Class-wise Overview (Current Academic Year)</h4>
          <table class="erp-table" data-testid="class-report-table">
            <thead><tr><th>Class</th><th>Sections</th><th>Total Students</th><th>Avg Attendance</th><th>Avg Performance</th><th>Fee Collection</th><th>Class Teacher</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of classSummaryData">
                <td><strong>{{ r['class'] }}</strong></td>
                <td>{{ r['sections'] }}</td>
                <td>{{ r['students'] }}</td>
                <td><span [style.color]="r['attendance'] >= 90 ? 'var(--clr-success)' : r['attendance'] >= 80 ? 'var(--clr-warning)' : 'var(--clr-danger)'">{{ r['attendance'] }}%</span></td>
                <td>{{ r['performance'] }}%</td>
                <td>{{ r['feeCollection'] }}%</td>
                <td>{{ r['teacher'] }}</td>
                <td><span class="badge-erp" [ngClass]="r['attendance'] >= 85 ? 'badge-success' : 'badge-warning'">{{ r['attendance'] >= 85 ? 'On Track' : 'Attention Needed' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TEACHER WORKLOAD REPORT -->
      <div *ngIf="tab === 'teacher'" class="animate-in">
        <div class="erp-card">
          <h4 class="erp-card-title mb-3">Teacher Workload Summary</h4>
          <table class="erp-table" data-testid="teacher-report-table">
            <thead><tr><th>Teacher</th><th>Specialization</th><th>Subjects</th><th>Classes Assigned</th><th>Periods/Week</th><th>Avg Class Performance</th><th>Workload</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of teacherData">
                <td><strong>{{ r['name'] }}</strong></td>
                <td>{{ r['specialization'] }}</td>
                <td>{{ r['subjects'] }}</td>
                <td>{{ r['classes'] }}</td>
                <td>{{ r['periods'] }}</td>
                <td>{{ r['avgPerf'] }}%</td>
                <td><span class="badge-erp" [ngClass]="r['periods'] > 25 ? 'badge-danger' : r['periods'] > 18 ? 'badge-warning' : 'badge-success'">{{ r['periods'] > 25 ? 'Heavy' : r['periods'] > 18 ? 'Moderate' : 'Light' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  tab = 'performance';
  perfClass = 'Class 8'; perfExam = 'Midterm'; attClass = 'Class 8'; attMonth = 'January'; feeClass = ''; feeStatus = '';
  perfData: ReportRow[] = []; attData: ReportRow[] = []; feeData: ReportRow[] = []; classSummaryData: ReportRow[] = []; teacherData: ReportRow[] = [];
  perfStats = { total: 0, avg: '0', pass: '0', topStudent: '' };
  attStats = { totalStudents: 0, avgAttendance: '0', belowThreshold: 0, workingDays: 22 };
  feeStats = { collected: 0, pending: 0, collectionRate: '0', overdueCount: 0 };

  ngOnInit(): void { this.genPerformance(); }

  genPerformance(): void {
    const data: ReportRow[] = [
      { name: 'Sofia Martinez', maths: 88, science: 95, english: 82, history: 90, computer: 87, total: 442, pct: 88.4, grade: 'A+' },
      { name: 'Emma Chen', maths: 92, science: 85, english: 88, history: 78, computer: 95, total: 438, pct: 87.6, grade: 'A+' },
      { name: 'Aiden Murphy', maths: 78, science: 82, english: 85, history: 88, computer: 80, total: 413, pct: 82.6, grade: 'A' },
      { name: 'Mia Rodriguez', maths: 72, science: 88, english: 75, history: 82, computer: 90, total: 407, pct: 81.4, grade: 'A' },
      { name: 'Lucas Kim', maths: 85, science: 70, english: 78, history: 75, computer: 82, total: 390, pct: 78.0, grade: 'B+' },
      { name: 'Harper Lewis', maths: 65, science: 78, english: 82, history: 70, computer: 75, total: 370, pct: 74.0, grade: 'B' },
      { name: 'Isabella Garcia', maths: 70, science: 65, english: 72, history: 68, computer: 78, total: 353, pct: 70.6, grade: 'B' },
    ];
    data.sort((a, b) => b['total'] - a['total']);
    this.perfData = data;
    const avg = data.reduce((s, r) => s + r['pct'], 0) / data.length;
    this.perfStats = { total: data.length, avg: avg.toFixed(1), pass: ((data.filter(r => r['pct'] >= 40).length / data.length) * 100).toFixed(0), topStudent: data[0]['name'] };
  }

  genAttendance(): void {
    const names = ['Sofia Martinez', 'Emma Chen', 'Aiden Murphy', 'Mia Rodriguez', 'Lucas Kim', 'Harper Lewis', 'Isabella Garcia'];
    this.attData = names.map(n => {
      const present = 18 + Math.floor(Math.random() * 5);
      const late = Math.floor(Math.random() * 3);
      const absent = 22 - present - late;
      const pct = ((present + late * 0.5) / 22 * 100).toFixed(1);
      return { name: n, present, absent: Math.max(0, absent), late, total: 22, pct };
    });
    this.attData.sort((a, b) => b['pct'] - a['pct']);
    const avgAtt = this.attData.reduce((s, r) => s + parseFloat(r['pct']), 0) / this.attData.length;
    this.attStats = { totalStudents: this.attData.length, avgAttendance: avgAtt.toFixed(1), belowThreshold: this.attData.filter(r => parseFloat(r['pct']) < 75).length, workingDays: 22 };
  }

  genFees(): void {
    this.feeData = [
      { name: 'Arjun Patel', class: 'Class 5', total: 3500, paid: 3500, discount: 0, lateFee: 0, pending: 0, lastPayment: '2025-07-15', status: 'paid' },
      { name: 'Emily Watson', class: 'Class 6', total: 5000, paid: 2500, discount: 0, lateFee: 0, pending: 2500, lastPayment: '2025-07-20', status: 'partial' },
      { name: 'Liam Chen', class: 'Class 7', total: 5000, paid: 0, discount: 0, lateFee: 250, pending: 5250, lastPayment: '-', status: 'overdue' },
      { name: 'Sofia Martinez', class: 'Class 8', total: 5000, paid: 5000, discount: 500, lateFee: 0, pending: 0, lastPayment: '2025-07-10', status: 'paid' },
      { name: 'Emma Chen', class: 'Class 8', total: 5000, paid: 3800, discount: 0, lateFee: 0, pending: 1200, lastPayment: '2025-08-01', status: 'partial' },
      { name: 'Mason Davis', class: 'Class 9', total: 6500, paid: 0, discount: 0, lateFee: 0, pending: 6500, lastPayment: '-', status: 'unpaid' },
      { name: 'Charlotte Wilson', class: 'Class 9', total: 6500, paid: 6500, discount: 0, lateFee: 0, pending: 0, lastPayment: '2026-01-05', status: 'paid' },
      { name: 'Oliver Taylor', class: 'Class 10', total: 6500, paid: 3000, discount: 0, lateFee: 0, pending: 3500, lastPayment: '2026-01-10', status: 'partial' },
    ];
    if (this.feeClass) this.feeData = this.feeData.filter(r => r['class'] === this.feeClass);
    if (this.feeStatus) this.feeData = this.feeData.filter(r => r['status'] === this.feeStatus);
    const collected = this.feeData.reduce((s, r) => s + r['paid'], 0);
    const totalFees = this.feeData.reduce((s, r) => s + r['total'], 0);
    this.feeStats = { collected, pending: totalFees - collected, collectionRate: totalFees > 0 ? ((collected / totalFees) * 100).toFixed(1) : '0', overdueCount: this.feeData.filter(r => r['status'] === 'overdue').length };
  }

  genClassSummary(): void {
    this.classSummaryData = [
      { class: 'Class 1', sections: 2, students: 73, attendance: 95.2, performance: 82.5, feeCollection: 92, teacher: 'Aisha Khan' },
      { class: 'Class 2', sections: 1, students: 36, attendance: 93.8, performance: 80.1, feeCollection: 88, teacher: '-' },
      { class: 'Class 3', sections: 2, students: 71, attendance: 91.5, performance: 78.3, feeCollection: 85, teacher: '-' },
      { class: 'Class 5', sections: 2, students: 74, attendance: 94.1, performance: 81.2, feeCollection: 90, teacher: "James O'Brien" },
      { class: 'Class 6', sections: 2, students: 72, attendance: 92.7, performance: 76.8, feeCollection: 87, teacher: 'Robert Kim' },
      { class: 'Class 7', sections: 3, students: 102, attendance: 90.3, performance: 74.5, feeCollection: 82, teacher: '-' },
      { class: 'Class 8', sections: 2, students: 75, attendance: 93.5, performance: 79.8, feeCollection: 91, teacher: 'Sarah Mitchell' },
      { class: 'Class 9', sections: 2, students: 68, attendance: 88.9, performance: 72.1, feeCollection: 78, teacher: 'Priya Sharma' },
      { class: 'Class 10', sections: 2, students: 70, attendance: 91.2, performance: 75.6, feeCollection: 85, teacher: 'Maria Torres' },
      { class: 'Class 11', sections: 1, students: 30, attendance: 89.5, performance: 70.3, feeCollection: 80, teacher: 'Thomas Lee' },
      { class: 'Class 12', sections: 1, students: 28, attendance: 87.2, performance: 73.8, feeCollection: 95, teacher: '-' },
    ];
  }

  genTeacher(): void {
    this.teacherData = [
      { name: 'Sarah Mitchell', specialization: 'Mathematics', subjects: 'Maths, Physics', classes: 4, periods: 24, avgPerf: 79.5 },
      { name: "James O'Brien", specialization: 'English', subjects: 'English, Literature', classes: 4, periods: 20, avgPerf: 76.8 },
      { name: 'Priya Sharma', specialization: 'Science', subjects: 'Chemistry, Biology', classes: 3, periods: 18, avgPerf: 82.1 },
      { name: 'Robert Kim', specialization: 'Social Studies', subjects: 'History, Geography, Civics', classes: 3, periods: 18, avgPerf: 74.3 },
      { name: 'Maria Torres', specialization: 'Computer Science', subjects: 'CS, IT', classes: 5, periods: 25, avgPerf: 85.2 },
      { name: 'David Anderson', specialization: 'Physical Education', subjects: 'PE', classes: 6, periods: 12, avgPerf: 0 },
      { name: 'Aisha Khan', specialization: 'Art & Design', subjects: 'Art, Design', classes: 3, periods: 12, avgPerf: 0 },
      { name: 'Thomas Lee', specialization: 'Physics', subjects: 'Physics, Maths', classes: 2, periods: 16, avgPerf: 71.5 },
    ];
  }
}
