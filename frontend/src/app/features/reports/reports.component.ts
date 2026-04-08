import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="reports-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Reports</h2><p class="text-muted mb-0" style="font-size: 13px;">Generate and export reports</p></div>
      </div>
      <div class="row g-4 animate-in animate-in-delay-1">
        <div class="col-md-6 col-lg-4" *ngFor="let report of reports">
          <div class="erp-card" style="cursor: pointer;" (click)="selectedReport = report" [attr.data-testid]="'report-card-' + report.id">
            <div class="stat-icon mb-3" [style.background]="report.bgColor" [style.color]="report.color">
              <i class="bi" [ngClass]="report.icon"></i>
            </div>
            <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">{{ report.name }}</h4>
            <p style="font-size: 13px; color: var(--clr-text-muted); margin: 0;">{{ report.description }}</p>
          </div>
        </div>
      </div>
      <div class="erp-card mt-4 animate-in animate-in-delay-2" *ngIf="selectedReport">
        <div class="erp-card-header">
          <h3 class="erp-card-title">{{ selectedReport.name }}</h3>
          <button class="btn-primary-erp btn-sm" data-testid="export-report-btn"><i class="bi bi-download"></i> Export CSV</button>
        </div>
        <div class="row g-3 mb-4">
          <div class="col-md-3"><label class="erp-label">From Date</label><input type="date" class="erp-input" [(ngModel)]="fromDate"></div>
          <div class="col-md-3"><label class="erp-label">To Date</label><input type="date" class="erp-input" [(ngModel)]="toDate"></div>
          <div class="col-md-3"><label class="erp-label">Class</label>
            <select class="erp-select"><option value="">All Classes</option><option *ngFor="let i of [1,2,3,4,5,6,7,8,9,10,11,12]">Class {{ i }}</option></select>
          </div>
          <div class="col-md-3 d-flex align-items-end"><button class="btn-secondary-erp" style="width: 100%;" data-testid="generate-report-btn"><i class="bi bi-play-fill"></i> Generate</button></div>
        </div>
        <div class="empty-state"><i class="bi bi-graph-up"></i><h3>Report Preview</h3><p>Configure filters and click Generate to preview the report</p></div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  selectedReport: any = null;
  fromDate = '';
  toDate = '';
  reports = [
    { id: 'r1', name: 'Student Performance', description: 'Overall academic performance report', icon: 'bi-graph-up-arrow', bgColor: 'rgba(27,58,48,0.1)', color: '#1B3A30' },
    { id: 'r2', name: 'Attendance Report', description: 'Class-wise and student-wise attendance', icon: 'bi-calendar-check-fill', bgColor: 'rgba(5,150,105,0.1)', color: '#059669' },
    { id: 'r3', name: 'Fee Collection', description: 'Fee collection and outstanding dues', icon: 'bi-credit-card-fill', bgColor: 'rgba(192,92,61,0.1)', color: '#C05C3D' },
    { id: 'r4', name: 'Teacher Workload', description: 'Teaching hours and class assignments', icon: 'bi-person-badge-fill', bgColor: 'rgba(2,132,199,0.1)', color: '#0284C7' },
    { id: 'r5', name: 'Library Usage', description: 'Book circulation and library activity', icon: 'bi-book-fill', bgColor: 'rgba(217,119,6,0.1)', color: '#D97706' },
    { id: 'r6', name: 'Transport Summary', description: 'Route utilization and vehicle status', icon: 'bi-bus-front-fill', bgColor: 'rgba(220,38,38,0.1)', color: '#DC2626' },
  ];
}
