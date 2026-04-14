import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  MarkRecord,
  ReportCard,
  SchoolClass,
  SectionSummaryRow,
  Student,
  StudentPerformanceRow,
  TeacherWorkloadRow
} from '../../core/models/models';
import { downloadCsv } from '../../core/utils/csv-export.util';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ErpPaginationComponent,
    ErpI18nPhDirective,
    ErpI18nTextDirective,
  ],
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
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.performance"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.performancePh" [(ngModel)]="perfSearch" (ngModelChange)="onPerfSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportPerformanceCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="performanceRows.length && !perfFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="perfFilteredTotal">
            <thead><tr><th>{{ 'reports.th.rank' | translate }}</th><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.total' | translate }}</th><th>{{ 'reports.th.pct' | translate }}</th><th>{{ 'reports.th.grade' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedPerformanceRows">
                <td>{{ row.rank }}</td>
                <td><strong>{{ row.studentName }}</strong></td>
                <td>{{ row.totalMarks }}/{{ row.totalMax }}</td>
                <td>{{ row.percentage | number:'1.0-1' }}%</td>
                <td>{{ row.grade }}</td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="perfFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="perfFilteredTotal"
            [pageIndex]="perfPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onPerfPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'perf')"
          />
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
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.attendance"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.attendancePh" [(ngModel)]="attRepSearch" (ngModelChange)="onAttRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportAttendanceCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="attendanceRows.length && !attRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="attRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.present' | translate }}</th><th>{{ 'reports.th.absent' | translate }}</th><th>{{ 'reports.th.late' | translate }}</th><th>{{ 'reports.th.excused' | translate }}</th><th>{{ 'reports.th.attendancePct' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedAttendanceRows">
                <td><strong>{{ row.studentName }}</strong></td>
                <td>{{ row.present }}</td>
                <td>{{ row.absent }}</td>
                <td>{{ row.late }}</td>
                <td>{{ row.excused }}</td>
                <td>{{ row.attendancePercentage | number:'1.0-1' }}%</td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="attRepFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="attRepFilteredTotal"
            [pageIndex]="attRepPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onAttRepPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'att')"
          />
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
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.fees"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.feesPh" [(ngModel)]="feeRepSearch" (ngModelChange)="onFeeRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportFeesCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="feeRows.length && !feeRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="feeRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.total' | translate }}</th><th>{{ 'reports.th.paid' | translate }}</th><th>{{ 'reports.th.pendingAmt' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let payment of pagedFeeRows">
                <td><strong>{{ payment.studentName }}</strong></td>
                <td>{{ getStudentClassName(payment.studentId) }}</td>
                <td>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.paidAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ payment.dueAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ feeStatusLabel(payment.status) }}</td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="feeRepFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="feeRepFilteredTotal"
            [pageIndex]="feeRepPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onFeeRepPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'fee')"
          />
        </div>
      </div>

      <div *ngIf="tab === 'class'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div *ngIf="!reportServerPaging" class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.class"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.classPh" [(ngModel)]="classRepSearch" (ngModelChange)="onClassRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportClassCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="classSummaryRows.length && !classRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="classRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.sections' | translate }}</th><th>{{ 'reports.th.students' | translate }}</th><th>{{ 'reports.th.attendancePct' | translate }}</th><th>{{ 'reports.th.performancePct' | translate }}</th><th>{{ 'reports.th.feeCollectionPct' | translate }}</th><th>{{ 'reports.th.teacher' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedClassSummaryRows">
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
          <app-erp-pagination
            *ngIf="classRepFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="classRepFilteredTotal"
            [pageIndex]="classRepPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onClassRepPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'class')"
          />
        </div>
      </div>

      <div *ngIf="tab === 'section'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div *ngIf="!reportServerPaging" class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.section"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.sectionPh" [(ngModel)]="secRepSearch" (ngModelChange)="onSecRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportSectionCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="sectionRows.length && !secRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="secRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.section' | translate }}</th><th>{{ 'reports.th.students' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedSectionRows">
                <td><strong>{{ row.className }}</strong></td>
                <td>{{ row.sectionName }}</td>
                <td>{{ row.studentCount }}</td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="secRepFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="secRepFilteredTotal"
            [pageIndex]="secRepPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onSecRepPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'sec')"
          />
        </div>
      </div>

      <div *ngIf="tab === 'teacher'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div *ngIf="!reportServerPaging" class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.teacher"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.teacherPh" [(ngModel)]="teachRepSearch" (ngModelChange)="onTeachRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="exportTeacherCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="teacherRows.length && !teachRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="teachRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.teacher' | translate }}</th><th>{{ 'reports.th.specialization' | translate }}</th><th>{{ 'reports.th.subjects' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedTeacherRows">
                <td><strong>{{ row.teacherName }}</strong></td>
                <td>{{ row.specialization }}</td>
                <td>{{ row.subjects.join(', ') }}</td>
                <td>{{ teacherStatusLabel(row.status) }}</td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="teachRepFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="teachRepFilteredTotal"
            [pageIndex]="teachRepPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onTeachRepPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'teach')"
          />
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
          <div class="mb-2 mt-2" style="max-width: 360px;">
            <label class="erp-label small mb-1" erpI18nText="reports.filter.reportCardSubjects"></label>
            <input type="search" class="erp-input" erpI18nPh="reports.filter.reportCardSubjectsPh" [(ngModel)]="rcSubSearch" (ngModelChange)="onRcSubSearchChange()" />
          </div>
          <p *ngIf="reportCard.subjects.length && !rcSubFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="rcSubFilteredTotal">
            <thead><tr><th>{{ 'reports.th.subject' | translate }}</th><th>{{ 'reports.th.marks' | translate }}</th><th>{{ 'reports.th.maxMarks' | translate }}</th><th>{{ 'reports.th.grade' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let subject of pagedReportCardSubjects">
                <td><strong>{{ subject.subjectName }}</strong></td>
                <td>{{ subject.marksObtained }}</td>
                <td>{{ subject.maxMarks }}</td>
                <td>{{ subject.grade }}</td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="rcSubFilteredTotal > repPageSize"
            class="d-block mt-2"
            [totalElements]="rcSubFilteredTotal"
            [pageIndex]="rcSubPageIndex"
            [pageSize]="repPageSize"
            (pageIndexChange)="onRcSubPageIndex($event)"
            (pageSizeChange)="onRepPageSize($event, 'rc')"
          />
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

  repPageSize = DEFAULT_ERP_PAGE_SIZE;
  perfSearch = '';
  perfPageIndex = 0;
  pagedPerformanceRows: StudentPerformanceRow[] = [];
  perfFilteredTotal = 0;
  attRepSearch = '';
  attRepPageIndex = 0;
  pagedAttendanceRows: AttendanceSummaryRow[] = [];
  attRepFilteredTotal = 0;
  feeRepSearch = '';
  feeRepPageIndex = 0;
  pagedFeeRows: FeePayment[] = [];
  feeRepFilteredTotal = 0;
  classRepSearch = '';
  classRepPageIndex = 0;
  pagedClassSummaryRows: ClassSummaryRow[] = [];
  classRepFilteredTotal = 0;
  secRepSearch = '';
  secRepPageIndex = 0;
  pagedSectionRows: SectionSummaryRow[] = [];
  secRepFilteredTotal = 0;
  teachRepSearch = '';
  teachRepPageIndex = 0;
  pagedTeacherRows: TeacherWorkloadRow[] = [];
  teachRepFilteredTotal = 0;
  rcSubSearch = '';
  rcSubPageIndex = 0;
  pagedReportCardSubjects: MarkRecord[] = [];
  rcSubFilteredTotal = 0;

  readonly reportServerPaging = !runtimeConfig.useMocks;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private academicService: AcademicService,
    private examService: ExamService,
    private feeService: FeeService,
    private reportService: ReportService,
    private studentService: StudentService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
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
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
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
    this.reportService.getStudentPerformance(this.selectedClassId, this.selectedExamId).subscribe(rows => {
      this.performanceRows = rows;
      this.perfPageIndex = 0;
      this.applyPerfPaging();
    });
  }

  loadAttendance(): void {
    if (this.selectedClassId == null || !this.selectedMonth) return;
    this.reportService.getAttendanceSummary(this.selectedClassId, this.selectedMonth).subscribe(rows => {
      this.attendanceRows = rows;
      this.attRepPageIndex = 0;
      this.applyAttRepPaging();
    });
  }

  loadFees(): void {
    this.reportService.getFeeCollectionSummary(this.selectedFeeClassId ?? undefined).subscribe(summary => (this.feeSummary = summary));
    this.feeService.getPayments().subscribe(payments => {
      this.feeRows = payments.filter(payment => {
        if (this.selectedFeeClassId == null) return true;
        return this.students.find(student => student.id === payment.studentId)?.classId === this.selectedFeeClassId;
      });
      this.feeRepPageIndex = 0;
      this.applyFeeRepPaging();
    });
  }

  loadClassSummary(resetPage = true): void {
    if (resetPage) this.classRepPageIndex = 0;
    if (this.reportServerPaging) {
      this.reportService.getClassSummaryPage(this.classRepPageIndex, this.repPageSize).subscribe(p => {
        this.classSummaryRows = p.content;
        this.classRepFilteredTotal = p.totalElements;
        this.classRepPageIndex = p.page;
        this.applyClassRepPaging();
      });
      return;
    }
    this.reportService.getClassSummary().subscribe(rows => {
      this.classSummaryRows = rows;
      if (resetPage) this.classRepPageIndex = 0;
      this.applyClassRepPaging();
    });
  }

  loadSectionSummary(resetPage = true): void {
    if (resetPage) this.secRepPageIndex = 0;
    if (this.reportServerPaging) {
      this.reportService.getSectionSummaryPage(this.secRepPageIndex, this.repPageSize).subscribe(p => {
        this.sectionRows = p.content;
        this.secRepFilteredTotal = p.totalElements;
        this.secRepPageIndex = p.page;
        this.applySecRepPaging();
      });
      return;
    }
    this.reportService.getSectionSummary().subscribe(rows => {
      this.sectionRows = rows;
      if (resetPage) this.secRepPageIndex = 0;
      this.applySecRepPaging();
    });
  }

  loadTeacherWorkload(resetPage = true): void {
    if (resetPage) this.teachRepPageIndex = 0;
    if (this.reportServerPaging) {
      this.reportService.getTeacherWorkloadPage(this.teachRepPageIndex, this.repPageSize).subscribe(p => {
        this.teacherRows = p.content;
        this.teachRepFilteredTotal = p.totalElements;
        this.teachRepPageIndex = p.page;
        this.applyTeachRepPaging();
      });
      return;
    }
    this.reportService.getTeacherWorkload().subscribe(rows => {
      this.teacherRows = rows;
      if (resetPage) this.teachRepPageIndex = 0;
      this.applyTeachRepPaging();
    });
  }

  loadReportCard(): void {
    const studentId = this.selectedStudentId ?? this.reportCardStudents[0]?.id;
    if (studentId == null) return;
    this.selectedStudentId = studentId;
    this.reportService.getReportCard(studentId, this.selectedExamId ?? undefined).subscribe(card => {
      this.reportCard = card;
      this.rcSubPageIndex = 0;
      this.applyRcSubPaging();
    });
  }

  getStudentClassName(studentId: number): string {
    return this.students.find(student => student.id === studentId)?.className || '-';
  }

  applyPerfPaging(): void {
    const q = this.perfSearch.trim().toLowerCase();
    let data = this.performanceRows;
    if (q) {
      data = data.filter(r => r.studentName.toLowerCase().includes(q));
    }
    const pg = sliceToPage(data, this.perfPageIndex, this.repPageSize);
    this.pagedPerformanceRows = pg.content;
    this.perfPageIndex = pg.page;
    this.perfFilteredTotal = pg.totalElements;
  }

  onPerfSearchChange(): void {
    this.perfPageIndex = 0;
    this.applyPerfPaging();
  }

  onPerfPageIndex(i: number): void {
    this.perfPageIndex = i;
    this.applyPerfPaging();
  }

  applyAttRepPaging(): void {
    const q = this.attRepSearch.trim().toLowerCase();
    let data = this.attendanceRows;
    if (q) {
      data = data.filter(r => r.studentName.toLowerCase().includes(q));
    }
    const pg = sliceToPage(data, this.attRepPageIndex, this.repPageSize);
    this.pagedAttendanceRows = pg.content;
    this.attRepPageIndex = pg.page;
    this.attRepFilteredTotal = pg.totalElements;
  }

  onAttRepSearchChange(): void {
    this.attRepPageIndex = 0;
    this.applyAttRepPaging();
  }

  onAttRepPageIndex(i: number): void {
    this.attRepPageIndex = i;
    this.applyAttRepPaging();
  }

  applyFeeRepPaging(): void {
    const q = this.feeRepSearch.trim().toLowerCase();
    let data = this.feeRows;
    if (q) {
      data = data.filter(p => {
        const cls = this.getStudentClassName(p.studentId).toLowerCase();
        return p.studentName.toLowerCase().includes(q) || cls.includes(q) || String(p.status).toLowerCase().includes(q);
      });
    }
    const pg = sliceToPage(data, this.feeRepPageIndex, this.repPageSize);
    this.pagedFeeRows = pg.content;
    this.feeRepPageIndex = pg.page;
    this.feeRepFilteredTotal = pg.totalElements;
  }

  onFeeRepSearchChange(): void {
    this.feeRepPageIndex = 0;
    this.applyFeeRepPaging();
  }

  onFeeRepPageIndex(i: number): void {
    this.feeRepPageIndex = i;
    this.applyFeeRepPaging();
  }

  applyClassRepPaging(): void {
    if (this.reportServerPaging) {
      this.pagedClassSummaryRows = this.classSummaryRows;
      return;
    }
    const q = this.classRepSearch.trim().toLowerCase();
    let data = this.classSummaryRows;
    if (q) {
      data = data.filter(
        r =>
          r.className.toLowerCase().includes(q) ||
          (r.classTeacherName || '').toLowerCase().includes(q)
      );
    }
    const pg = sliceToPage(data, this.classRepPageIndex, this.repPageSize);
    this.pagedClassSummaryRows = pg.content;
    this.classRepPageIndex = pg.page;
    this.classRepFilteredTotal = pg.totalElements;
  }

  onClassRepSearchChange(): void {
    if (this.reportServerPaging) return;
    this.classRepPageIndex = 0;
    this.applyClassRepPaging();
  }

  onClassRepPageIndex(i: number): void {
    this.classRepPageIndex = i;
    if (this.reportServerPaging) this.loadClassSummary(false);
    else this.applyClassRepPaging();
  }

  applySecRepPaging(): void {
    if (this.reportServerPaging) {
      this.pagedSectionRows = this.sectionRows;
      return;
    }
    const q = this.secRepSearch.trim().toLowerCase();
    let data = this.sectionRows;
    if (q) {
      data = data.filter(
        r => r.className.toLowerCase().includes(q) || r.sectionName.toLowerCase().includes(q)
      );
    }
    const pg = sliceToPage(data, this.secRepPageIndex, this.repPageSize);
    this.pagedSectionRows = pg.content;
    this.secRepPageIndex = pg.page;
    this.secRepFilteredTotal = pg.totalElements;
  }

  onSecRepSearchChange(): void {
    if (this.reportServerPaging) return;
    this.secRepPageIndex = 0;
    this.applySecRepPaging();
  }

  onSecRepPageIndex(i: number): void {
    this.secRepPageIndex = i;
    if (this.reportServerPaging) this.loadSectionSummary(false);
    else this.applySecRepPaging();
  }

  applyTeachRepPaging(): void {
    if (this.reportServerPaging) {
      this.pagedTeacherRows = this.teacherRows;
      return;
    }
    const q = this.teachRepSearch.trim().toLowerCase();
    let data = this.teacherRows;
    if (q) {
      data = data.filter(r => {
        const subj = r.subjects.join(' ').toLowerCase();
        return (
          r.teacherName.toLowerCase().includes(q) ||
          r.specialization.toLowerCase().includes(q) ||
          subj.includes(q)
        );
      });
    }
    const pg = sliceToPage(data, this.teachRepPageIndex, this.repPageSize);
    this.pagedTeacherRows = pg.content;
    this.teachRepPageIndex = pg.page;
    this.teachRepFilteredTotal = pg.totalElements;
  }

  onTeachRepSearchChange(): void {
    if (this.reportServerPaging) return;
    this.teachRepPageIndex = 0;
    this.applyTeachRepPaging();
  }

  onTeachRepPageIndex(i: number): void {
    this.teachRepPageIndex = i;
    if (this.reportServerPaging) this.loadTeacherWorkload(false);
    else this.applyTeachRepPaging();
  }

  applyRcSubPaging(): void {
    if (!this.reportCard?.subjects) {
      this.pagedReportCardSubjects = [];
      this.rcSubFilteredTotal = 0;
      return;
    }
    const q = this.rcSubSearch.trim().toLowerCase();
    let data = this.reportCard.subjects;
    if (q) {
      data = data.filter(s => (s.subjectName || '').toLowerCase().includes(q));
    }
    const pg = sliceToPage(data, this.rcSubPageIndex, this.repPageSize);
    this.pagedReportCardSubjects = pg.content;
    this.rcSubPageIndex = pg.page;
    this.rcSubFilteredTotal = pg.totalElements;
  }

  onRcSubSearchChange(): void {
    this.rcSubPageIndex = 0;
    this.applyRcSubPaging();
  }

  onRcSubPageIndex(i: number): void {
    this.rcSubPageIndex = i;
    this.applyRcSubPaging();
  }

  onRepPageSize(s: number, key: string): void {
    this.repPageSize = s;
    switch (key) {
      case 'perf':
        this.perfPageIndex = 0;
        this.applyPerfPaging();
        break;
      case 'att':
        this.attRepPageIndex = 0;
        this.applyAttRepPaging();
        break;
      case 'fee':
        this.feeRepPageIndex = 0;
        this.applyFeeRepPaging();
        break;
      case 'class':
        this.classRepPageIndex = 0;
        if (this.reportServerPaging) this.loadClassSummary(false);
        else this.applyClassRepPaging();
        break;
      case 'sec':
        this.secRepPageIndex = 0;
        if (this.reportServerPaging) this.loadSectionSummary(false);
        else this.applySecRepPaging();
        break;
      case 'teach':
        this.teachRepPageIndex = 0;
        if (this.reportServerPaging) this.loadTeacherWorkload(false);
        else this.applyTeachRepPaging();
        break;
      case 'rc':
        this.rcSubPageIndex = 0;
        this.applyRcSubPaging();
        break;
    }
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
    const build = (data: ClassSummaryRow[]) => {
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
        ...data.map(r => [
          r.className,
          String(r.sections),
          String(r.totalStudents),
          String(r.attendancePercentage),
          String(r.performancePercentage),
          String(r.feeCollectionPercentage),
          r.classTeacherName || '',
        ]),
      ];
      downloadCsv(`report-class-summary.csv`, rows);
    };
    if (this.reportServerPaging) {
      this.reportService.getClassSummary().subscribe(data => build(data));
      return;
    }
    build(this.classSummaryRows);
  }

  exportSectionCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const build = (data: SectionSummaryRow[]) => {
      const rows: string[][] = [
        [t('reports.csv.section.class'), t('reports.csv.section.section'), t('reports.csv.section.studentCount')],
        ...data.map(r => [r.className, r.sectionName, String(r.studentCount)]),
      ];
      downloadCsv(`report-section-summary.csv`, rows);
    };
    if (this.reportServerPaging) {
      this.reportService.getSectionSummary().subscribe(data => build(data));
      return;
    }
    build(this.sectionRows);
  }

  exportTeacherCsv(): void {
    const t = this.translate.instant.bind(this.translate);
    const build = (data: TeacherWorkloadRow[]) => {
      const rows: string[][] = [
        [
          t('reports.csv.teacher.teacher'),
          t('reports.csv.teacher.specialization'),
          t('reports.csv.teacher.subjects'),
          t('reports.csv.teacher.status'),
        ],
        ...data.map(r => [r.teacherName, r.specialization, r.subjects.join('; '), this.teacherStatusLabel(r.status)]),
      ];
      downloadCsv(`report-teacher-workload.csv`, rows);
    };
    if (this.reportServerPaging) {
      this.reportService.getTeacherWorkload().subscribe(data => build(data));
      return;
    }
    build(this.teacherRows);
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
