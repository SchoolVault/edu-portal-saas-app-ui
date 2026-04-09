import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="reports-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Reports & Analytics</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Live operational reporting across performance, attendance, fees, classes, teachers, and report cards</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAllReports()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>

      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'performance'" (click)="tab = 'performance'; loadPerformance()">Student Performance</button>
        <button class="erp-tab" [class.active]="tab === 'attendance'" (click)="tab = 'attendance'; loadAttendance()">Attendance</button>
        <button class="erp-tab" [class.active]="tab === 'fees'" (click)="tab = 'fees'; loadFees()">Fee Collection</button>
        <button class="erp-tab" [class.active]="tab === 'class'" (click)="tab = 'class'; loadClassSummary()">Class Summary</button>
        <button class="erp-tab" [class.active]="tab === 'section'" (click)="tab = 'section'; loadSectionSummary()">Sections</button>
        <button class="erp-tab" [class.active]="tab === 'teacher'" (click)="tab = 'teacher'; loadTeacherWorkload()">Teacher Workload</button>
        <button class="erp-tab" [class.active]="tab === 'report-card'" (click)="tab = 'report-card'; loadReportCard()">Report Card</button>
      </div>

      <div *ngIf="tab === 'performance'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="loadPerformance()">
                <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">Exam</label>
              <select class="erp-select" [(ngModel)]="selectedExamId" (change)="loadPerformance()">
                <option *ngFor="let exam of exams" [value]="exam.id">{{ exam.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportPerformanceCsv()"><i class="bi bi-download"></i> Export CSV</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Total</th><th>%</th><th>Grade</th></tr></thead>
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
              <label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="loadAttendance()">
                <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">Month</label>
              <input class="erp-input" type="month" [(ngModel)]="selectedMonth" (change)="loadAttendance()">
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportAttendanceCsv()"><i class="bi bi-download"></i> Export CSV</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Attendance %</th></tr></thead>
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
              <label class="erp-label">Class Filter</label>
              <select class="erp-select" [(ngModel)]="selectedFeeClassId" (change)="loadFees()">
                <option value="">All Classes</option>
                <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.totalCollected | currency:'INR':'symbol':'1.0-0' }}</div><div class="stat-label">Collected</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.totalPending | currency:'INR':'symbol':'1.0-0' }}</div><div class="stat-label">Pending</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.collectionRate }}%</div><div class="stat-label">Collection Rate</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="stat-card"><div class="stat-value">{{ feeSummary.overdueCount }}</div><div class="stat-label">Overdue Accounts</div></div></div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportFeesCsv()"><i class="bi bi-download"></i> Export CSV</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Pending</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let payment of feeRows">
                <td><strong>{{ payment.studentName }}</strong></td>
                <td>{{ getStudentClassName(payment.studentId) }}</td>
                <td>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.paidAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.dueAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'class'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex justify-content-end mb-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportClassCsv()"><i class="bi bi-download"></i> Export CSV</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>Class</th><th>Sections</th><th>Students</th><th>Attendance %</th><th>Performance %</th><th>Fee Collection %</th><th>Teacher</th></tr></thead>
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
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportSectionCsv()"><i class="bi bi-download"></i> Export CSV</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>Class</th><th>Section</th><th>Students</th></tr></thead>
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
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportTeacherCsv()"><i class="bi bi-download"></i> Export CSV</button>
          </div>
          <table class="erp-table">
            <thead><tr><th>Teacher</th><th>Specialization</th><th>Subjects</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of teacherRows">
                <td><strong>{{ row.teacherName }}</strong></td>
                <td>{{ row.specialization }}</td>
                <td>{{ row.subjects.join(', ') }}</td>
                <td>{{ row.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="tab === 'report-card'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">Student</label>
              <select class="erp-select" [(ngModel)]="selectedStudentId" (change)="loadReportCard()">
                <option *ngFor="let student of reportCardStudents" [value]="student.id">{{ student.firstName }} {{ student.lastName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">Exam</label>
              <select class="erp-select" [(ngModel)]="selectedExamId" (change)="loadReportCard()">
                <option value="">All Exams</option>
                <option *ngFor="let exam of exams" [value]="exam.id">{{ exam.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="erp-card" *ngIf="reportCard">
          <div class="erp-card-header">
            <h3 class="erp-card-title">{{ reportCard.studentName }} Report Card</h3>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn-outline-erp btn-sm" (click)="exportReportCardCsv()"><i class="bi bi-download"></i> Export</button>
              <div>{{ reportCard.overallPercentage | number:'1.0-1' }}% · {{ reportCard.overallGrade }}</div>
            </div>
          </div>
          <table class="erp-table">
            <thead><tr><th>Subject</th><th>Marks</th><th>Max Marks</th><th>Grade</th></tr></thead>
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
  selectedClassId = '';
  selectedExamId = '';
  selectedStudentId = '';
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedFeeClassId = '';
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
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.refreshAllReports();
  }

  refreshAllReports(): void {
    this.academicService.getClasses().subscribe(classes => {
      this.classes = classes;
      if (!this.selectedClassId && classes[0]?.id) {
        this.selectedClassId = classes[0].id;
      }
      this.refreshVisibleTab();
    });
    this.examService.getExams().subscribe(exams => {
      this.exams = exams;
      if (!this.selectedExamId && exams[0]?.id) {
        this.selectedExamId = exams[0].id;
      }
      this.refreshVisibleTab();
    });
    this.studentService.getStudents().subscribe(students => {
      this.students = students;
      if (!this.selectedStudentId && students[0]?.id) {
        this.selectedStudentId = students[0].id;
      }
      this.refreshVisibleTab();
    });
  }

  get reportCardStudents(): Student[] {
    return this.selectedClassId ? this.students.filter(student => student.classId === this.selectedClassId) : this.students;
  }

  loadPerformance(): void {
    if (!this.selectedClassId || !this.selectedExamId) return;
    this.reportService.getStudentPerformance(this.selectedClassId, this.selectedExamId).subscribe(rows => this.performanceRows = rows);
  }

  loadAttendance(): void {
    if (!this.selectedClassId || !this.selectedMonth) return;
    this.reportService.getAttendanceSummary(this.selectedClassId, this.selectedMonth).subscribe(rows => this.attendanceRows = rows);
  }

  loadFees(): void {
    this.reportService.getFeeCollectionSummary(this.selectedFeeClassId || undefined).subscribe(summary => this.feeSummary = summary);
    this.feeService.getPayments().subscribe(payments => {
      this.feeRows = payments.filter(payment => {
        if (!this.selectedFeeClassId) return true;
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
    const studentId = this.selectedStudentId || this.reportCardStudents[0]?.id;
    if (!studentId) return;
    this.selectedStudentId = studentId;
    this.reportService.getReportCard(studentId, this.selectedExamId || undefined).subscribe(card => this.reportCard = card);
  }

  getStudentClassName(studentId: string): string {
    return this.students.find(student => student.id === studentId)?.className || '-';
  }

  exportPerformanceCsv(): void {
    const rows: string[][] = [
      ['Rank', 'Student', 'Total marks', 'Max', 'Percentage', 'Grade'],
      ...this.performanceRows.map(r => [String(r.rank), r.studentName, String(r.totalMarks), String(r.totalMax), String(r.percentage), r.grade])
    ];
    downloadCsv(`report-student-performance.csv`, rows);
  }

  exportAttendanceCsv(): void {
    const rows: string[][] = [
      ['Student', 'Present', 'Absent', 'Late', 'Excused', 'Total days', 'Attendance %'],
      ...this.attendanceRows.map(r => [r.studentName, String(r.present), String(r.absent), String(r.late), String(r.excused), String(r.totalDays), String(r.attendancePercentage)])
    ];
    downloadCsv(`report-attendance-${this.selectedMonth}.csv`, rows);
  }

  exportFeesCsv(): void {
    const rows: string[][] = [
      ['Student', 'Class', 'Total', 'Paid', 'Pending', 'Status'],
      ...this.feeRows.map(p => [p.studentName, this.getStudentClassName(p.studentId), String(p.amount), String(p.paidAmount), String(p.dueAmount), p.status])
    ];
    downloadCsv(`report-fee-collection.csv`, rows);
  }

  exportClassCsv(): void {
    const rows: string[][] = [
      ['Class', 'Sections', 'Students', 'Attendance %', 'Performance %', 'Fee collection %', 'Class teacher'],
      ...this.classSummaryRows.map(r => [r.className, String(r.sections), String(r.totalStudents), String(r.attendancePercentage), String(r.performancePercentage), String(r.feeCollectionPercentage), r.classTeacherName || ''])
    ];
    downloadCsv(`report-class-summary.csv`, rows);
  }

  exportSectionCsv(): void {
    const rows: string[][] = [
      ['Class', 'Section', 'Student count'],
      ...this.sectionRows.map(r => [r.className, r.sectionName, String(r.studentCount)])
    ];
    downloadCsv(`report-section-summary.csv`, rows);
  }

  exportTeacherCsv(): void {
    const rows: string[][] = [
      ['Teacher', 'Specialization', 'Subjects', 'Status'],
      ...this.teacherRows.map(r => [r.teacherName, r.specialization, r.subjects.join('; '), r.status])
    ];
    downloadCsv(`report-teacher-workload.csv`, rows);
  }

  exportReportCardCsv(): void {
    if (!this.reportCard) return;
    const rows: string[][] = [
      ['Student', 'Overall %', 'Overall grade'],
      [this.reportCard.studentName, String(this.reportCard.overallPercentage), this.reportCard.overallGrade],
      [],
      ['Subject', 'Marks', 'Max marks', 'Grade'],
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
