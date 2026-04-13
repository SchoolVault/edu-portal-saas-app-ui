import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AcademicService } from '../../core/services/academic.service';
import { ExamService } from '../../core/services/exam.service';
import { FeeService } from '../../core/services/fee.service';
import { ReportService } from '../../core/services/report.service';
import { StudentService } from '../../core/services/student.service';
import {
  AttendanceSummaryRow,
  ClassSummaryRow,
  Exam,
  FeePayment,
  ReportCard,
  SchoolClass,
  SectionSummaryRow,
  Student,
  StudentPerformanceRow,
  TeacherWorkloadRow
} from '../../core/models/models';
import { downloadCsv } from '../../core/utils/csv-export.util';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div data-testid="reports-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'reports.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'reports.lead' | translate }}</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAllReports()"><i class="bi bi-arrow-clockwise"></i> {{ 'reports.refresh' | translate }}</button>
      </div>

      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'performance'" (click)="tab = 'performance'; loadPerformance()">{{ 'reports.tab.performance' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'attendance'" (click)="tab = 'attendance'; loadAttendance()">{{ 'reports.tab.attendance' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'fees'" (click)="tab = 'fees'; loadFees()">{{ 'reports.tab.fees' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'class'" (click)="tab = 'class'; loadClassSummary()">{{ 'reports.tab.class' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'section'" (click)="tab = 'section'; loadSectionSummary()">{{ 'reports.tab.section' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'teacher'" (click)="tab = 'teacher'; loadTeacherWorkload()">{{ 'reports.tab.teacher' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'report-card'" (click)="tab = 'report-card'; loadReportCard()">{{ 'reports.tab.reportCard' | translate }}</button>
      </div>

      <div *ngIf="tab === 'performance'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="loadPerformance()">
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelExam' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedExamId" (change)="loadPerformance()">
                <option *ngFor="let exam of exams" [ngValue]="exam.id">{{ exam.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportPerformanceCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.rank' | translate }}</th><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.total' | translate }}</th><th>{{ 'reports.th.pct' | translate }}</th><th>{{ 'reports.th.grade' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of performanceRows">
                <td>{{ row.rank }}</td>
                <td><strong>{{ row.studentName }}</strong></td>
                <td>{{ row.totalMarks }}/{{ row.totalMax }}</td>
                <td>{{ row.percentage | number:'1.0-1' }}%</td>
                <td>{{ row.grade }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'attendance'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="loadAttendance()">
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelMonth' | translate }}</label>
              <input class="erp-input" type="month" [(ngModel)]="selectedMonth" (change)="loadAttendance()">
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportAttendanceCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.present' | translate }}</th><th>{{ 'reports.th.absent' | translate }}</th><th>{{ 'reports.th.late' | translate }}</th><th>{{ 'reports.th.excused' | translate }}</th><th>{{ 'reports.th.attendancePct' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of attendanceRows">
                <td><strong>{{ row.studentName }}</strong></td>
                <td>{{ row.present }}</td>
                <td>{{ row.absent }}</td>
                <td>{{ row.late }}</td>
                <td>{{ row.excused }}</td>
                <td>{{ row.attendancePercentage | number:'1.0-1' }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'fees'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.classFilter' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedFeeClassId" (change)="loadFees()">
                <option [ngValue]="null">{{ 'reports.allClasses' | translate }}</option>
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.totalCollected | currency:'INR':'symbol':'1.0-0' }}</div><div class="stat-label">{{ 'reports.stat.collected' | translate }}</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.totalPending | currency:'INR':'symbol':'1.0-0' }}</div><div class="stat-label">{{ 'reports.stat.pending' | translate }}</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.collectionRate }}%</div><div class="stat-label">{{ 'reports.stat.collectionRate' | translate }}</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.overdueCount }}</div><div class="stat-label">{{ 'reports.stat.overdueAccounts' | translate }}</div></div></div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportFeesCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.total' | translate }}</th><th>{{ 'reports.th.paid' | translate }}</th><th>{{ 'reports.th.pendingAmt' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let payment of feeRows">
                <td><strong>{{ payment.studentName }}</strong></td>
                <td>{{ getStudentClassName(payment.studentId) }}</td>
                <td>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.paidAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.dueAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ feeStatusLabel(payment.status) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'class'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportClassCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.sections' | translate }}</th><th>{{ 'reports.th.students' | translate }}</th><th>{{ 'reports.th.attendancePct' | translate }}</th><th>{{ 'reports.th.performancePct' | translate }}</th><th>{{ 'reports.th.feeCollectionPct' | translate }}</th><th>{{ 'reports.th.teacher' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of classSummaryRows">
                <td><strong>{{ row.className }}</strong></td>
                <td>{{ row.sections }}</td>
                <td>{{ row.totalStudents }}</td>
                <td>{{ row.attendancePercentage | number:'1.0-1' }}%</td>
                <td>{{ row.performancePercentage | number:'1.0-1' }}%</td>
                <td>{{ row.feeCollectionPercentage | number:'1.0-1' }}%</td>
                <td>{{ row.classTeacherName || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'section'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportSectionCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.section' | translate }}</th><th>{{ 'reports.th.students' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of sectionRows">
                <td><strong>{{ row.className }}</strong></td>
                <td>{{ row.sectionName }}</td>
                <td>{{ row.studentCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'teacher'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportTeacherCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.teacher' | translate }}</th><th>{{ 'reports.th.specialization' | translate }}</th><th>{{ 'reports.th.subjects' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of teacherRows">
                <td><strong>{{ row.teacherName }}</strong></td>
                <td>{{ row.specialization }}</td>
                <td>{{ row.subjects.join(', ') }}</td>
                <td>{{ teacherStatusLabel(row.status) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'report-card'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelStudent' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedStudentId" (change)="loadReportCard()">
                <option *ngFor="let student of reportCardStudents" [ngValue]="student.id">{{ student.firstName }} {{ student.lastName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelExam' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedExamId" (change)="loadReportCard()">
                <option [ngValue]="null">{{ 'reports.allExams' | translate }}</option>
                <option *ngFor="let exam of exams" [ngValue]="exam.id">{{ exam.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="erp-card" *ngIf="reportCard">
          <div class="erp-card-header">
            <h3 class="erp-card-title">{{ 'reports.reportCardTitle' | translate: { name: reportCard.studentName } }}</h3>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn-outline-erp btn-sm" (click)="exportReportCardCsv()"><i class="bi bi-download"></i> {{ 'reports.export' | translate }}</button>
              <div>{{ reportCard.overallPercentage | number:'1.0-1' }}% · {{ reportCard.overallGrade }}</div>
            </div>
          </div>
          <table class="erp-table">
            <thead><tr><th>{{ 'reports.th.subject' | translate }}</th><th>{{ 'reports.th.marks' | translate }}</th><th>{{ 'reports.th.maxMarks' | translate }}</th><th>{{ 'reports.th.grade' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let subject of reportCard.subjects">
                <td><strong>{{ subject.subjectName }}</strong></td>
                <td>{{ subject.marksObtained }}</td>
                <td>{{ subject.maxMarks }}</td>
                <td>{{ subject.grade }}</td>
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
  classes: SchoolClass[] = [];
  exams: Exam[] = [];
  students: Student[] = [];
  selectedClassId: number | null = null;
  selectedExamId: number | null = null;
  selectedStudentId: number | null = null;
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedFeeClassId: number | null = null;
  performanceRows: StudentPerformanceRow[] = [];
  attendanceRows: AttendanceSummaryRow[] = [];
  feeRows: FeePayment[] = [];
  classSummaryRows: ClassSummaryRow[] = [];
  sectionRows: SectionSummaryRow[] = [];
  teacherRows: TeacherWorkloadRow[] = [];
  reportCard: ReportCard | null = null;
  feeSummary = { totalCollected: 0, totalPending: 0, overdueCount: 0, totalStudents: 0, collectionRate: 0 };

  constructor(
    private academicService: AcademicService,
    private examService: ExamService,
    private feeService: FeeService,
    private reportService: ReportService,
    private studentService: StudentService,
    private translate: TranslateService
  ) {}

  feeStatusLabel(raw: string | undefined): string {
    const n = String(raw ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    const map: Record<string, string> = {
      paid: 'fees.statusPaid',
      partial: 'fees.statusPartial',
      unpaid: 'fees.statusUnpaid',
      overdue: 'fees.statusOverdue',
    };
    const key = map[n];
    return key ? this.translate.instant(key) : String(raw ?? '');
  }

  teacherStatusLabel(raw: string | undefined): string {
    const code = String(raw ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    const i18nKey = `reports.teacherStatus.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  ngOnInit(): void {
    this.refreshAllReports();
  }

  refreshAllReports(): void {
    this.academicService.getClasses().subscribe(classes => {
      this.classes = classes;
      if (this.selectedClassId == null && classes[0]?.id != null) {
        this.selectedClassId = classes[0].id;
      }
      this.refreshVisibleTab();
    });
    this.examService.getExams().subscribe(exams => {
      this.exams = exams;
      if (this.selectedExamId == null && exams[0]?.id != null) {
        this.selectedExamId = exams[0].id;
      }
      this.refreshVisibleTab();
    });
    this.studentService.getStudents().subscribe(students => {
      this.students = students;
      if (this.selectedStudentId == null && students[0]?.id != null) {
        this.selectedStudentId = students[0].id;
      }
      this.refreshVisibleTab();
    });
  }

  get reportCardStudents(): Student[] {
    return this.selectedClassId != null
      ? this.students.filter(student => student.classId === this.selectedClassId)
      : this.students;
  }

  loadPerformance(): void {
    if (this.selectedClassId == null || this.selectedExamId == null) return;
    this.reportService.getStudentPerformance(this.selectedClassId, this.selectedExamId).subscribe(rows => (this.performanceRows = rows));
  }

  loadAttendance(): void {
    if (this.selectedClassId == null || !this.selectedMonth) return;
    this.reportService.getAttendanceSummary(this.selectedClassId, this.selectedMonth).subscribe(rows => (this.attendanceRows = rows));
  }

  loadFees(): void {
    this.reportService.getFeeCollectionSummary(this.selectedFeeClassId ?? undefined).subscribe(summary => (this.feeSummary = summary));
    this.feeService.getPayments().subscribe(payments => {
      this.feeRows = payments.filter(payment => {
        if (this.selectedFeeClassId == null) return true;
        return this.students.find(student => student.id === payment.studentId)?.classId === this.selectedFeeClassId;
      });
    });
  }

  loadClassSummary(): void {
    this.reportService.getClassSummary().subscribe(rows => this.classSummaryRows = rows);
  }

  loadSectionSummary(): void {
    this.reportService.getSectionSummary().subscribe(rows => this.sectionRows = rows);
  }

  loadTeacherWorkload(): void {
    this.reportService.getTeacherWorkload().subscribe(rows => this.teacherRows = rows);
  }

  loadReportCard(): void {
    const studentId = this.selectedStudentId ?? this.reportCardStudents[0]?.id;
    if (studentId == null) return;
    this.selectedStudentId = studentId;
    this.reportService.getReportCard(studentId, this.selectedExamId ?? undefined).subscribe(card => (this.reportCard = card));
  }

  getStudentClassName(studentId: number): string {
    return this.students.find(student => student.id === studentId)?.className || '-';
  }

  exportPerformanceCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [
        t('reports.csv.performance.rank'),
        t('reports.csv.performance.student'),
        t('reports.csv.performance.totalMarks'),
        t('reports.csv.performance.max'),
        t('reports.csv.performance.percentage'),
        t('reports.csv.performance.grade'),
      ],
      ...this.performanceRows.map(r => [String(r.rank), r.studentName, String(r.totalMarks), String(r.totalMax), String(r.percentage), r.grade])
    ];
    downloadCsv(`report-student-performance.csv`, rows);
  }

  exportAttendanceCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [
        t('reports.csv.attendance.student'),
        t('reports.csv.attendance.present'),
        t('reports.csv.attendance.absent'),
        t('reports.csv.attendance.late'),
        t('reports.csv.attendance.excused'),
        t('reports.csv.attendance.totalDays'),
        t('reports.csv.attendance.attendancePct'),
      ],
      ...this.attendanceRows.map(r => [r.studentName, String(r.present), String(r.absent), String(r.late), String(r.excused), String(r.totalDays), String(r.attendancePercentage)])
    ];
    downloadCsv(`report-attendance-${this.selectedMonth}.csv`, rows);
  }

  exportFeesCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [
        t('reports.csv.fees.student'),
        t('reports.csv.fees.class'),
        t('reports.csv.fees.total'),
        t('reports.csv.fees.paid'),
        t('reports.csv.fees.pending'),
        t('reports.csv.fees.status'),
      ],
      ...this.feeRows.map(p => [
        p.studentName,
        this.getStudentClassName(p.studentId),
        String(p.amount),
        String(p.paidAmount),
        String(p.dueAmount),
        this.feeStatusLabel(p.status),
      ])
    ];
    downloadCsv(`report-fee-collection.csv`, rows);
  }

  exportClassCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [
        t('reports.csv.class.class'),
        t('reports.csv.class.sections'),
        t('reports.csv.class.students'),
        t('reports.csv.class.attendancePct'),
        t('reports.csv.class.performancePct'),
        t('reports.csv.class.feeCollectionPct'),
        t('reports.csv.class.classTeacher'),
      ],
      ...this.classSummaryRows.map(r => [r.className, String(r.sections), String(r.totalStudents), String(r.attendancePercentage), String(r.performancePercentage), String(r.feeCollectionPercentage), r.classTeacherName || ''])
    ];
    downloadCsv(`report-class-summary.csv`, rows);
  }

  exportSectionCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [t('reports.csv.section.class'), t('reports.csv.section.section'), t('reports.csv.section.studentCount')],
      ...this.sectionRows.map(r => [r.className, r.sectionName, String(r.studentCount)])
    ];
    downloadCsv(`report-section-summary.csv`, rows);
  }

  exportTeacherCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [
        t('reports.csv.teacher.teacher'),
        t('reports.csv.teacher.specialization'),
        t('reports.csv.teacher.subjects'),
        t('reports.csv.teacher.status'),
      ],
      ...this.teacherRows.map(r => [r.teacherName, r.specialization, r.subjects.join('; '), this.teacherStatusLabel(r.status)])
    ];
    downloadCsv(`report-teacher-workload.csv`, rows);
  }

  exportReportCardCsv(): void {
    if (!this.reportCard) return;
    const t = this.translate.instant.bind(this.translate);
    const rows: string[][] = [
      [t('reports.csv.reportCard.student'), t('reports.csv.reportCard.overallPct'), t('reports.csv.reportCard.overallGrade')],
      [this.reportCard.studentName, String(this.reportCard.overallPercentage), this.reportCard.overallGrade],
      [],
      [
        t('reports.csv.reportCard.subject'),
        t('reports.csv.reportCard.marks'),
        t('reports.csv.reportCard.maxMarks'),
        t('reports.csv.reportCard.grade'),
      ],
      ...this.reportCard.subjects.map(s => [s.subjectName, String(s.marksObtained), String(s.maxMarks), s.grade])
    ];
    downloadCsv(`report-card-${this.reportCard.studentId}.csv`, rows);
  }

  private refreshVisibleTab(): void {
    switch (this.tab) {
      case 'performance': this.loadPerformance(); break;
      case 'attendance': this.loadAttendance(); break;
      case 'fees': this.loadFees(); break;
      case 'class': this.loadClassSummary(); break;
      case 'section': this.loadSectionSummary(); break;
      case 'teacher': this.loadTeacherWorkload(); break;
      case 'report-card': this.loadReportCard(); break;
    }
  }
}
