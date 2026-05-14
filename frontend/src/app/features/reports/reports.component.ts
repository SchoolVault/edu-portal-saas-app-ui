import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
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
  ReportGenerationJob,
  ReportPublicationSnapshot,
  ReportAnalyticsPack,
  ReportAnalyticsPackConfig,
  ReportShareDispatch,
  ReportTemplateDefinition,
  ReportWorkflowEventLog,
  SchoolClass,
  Section,
  SectionSummaryRow,
  Student,
  StudentPerformanceRow,
  TeacherWorkloadRow
} from '../../core/models/models';
import { buildCsvSchoolLine, downloadCsvDocument, type CsvDocumentMeta } from '../../core/utils/csv-export.util';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpMonthPickerComponent } from '../../shared/erp-month-picker/erp-month-picker.component';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { runtimeConfig } from '../../core/config/runtime-config';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { formatDateDdMmYyyy } from '../../core/utils/date-format';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ErpPaginationComponent,
    ErpMonthPickerComponent,
    ErpI18nPhDirective,
    ErpI18nTextDirective,
    SchoolClassNamePipe,
  ],
  template: `
    <div class="reports-page" data-testid="reports-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 class="reports-page-title">{{ 'reports.pageTitle' | translate }}</h2>
          <p class="reports-page-lead text-muted mb-0">{{ 'reports.lead' | translate }}</p>
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
        <button class="erp-tab" [class.active]="tab === 'designer'" (click)="tab = 'designer'; loadReportDesignerData()">{{ 'reports.tab.designer' | translate }}</button>
        <button class="erp-tab" [class.active]="tab === 'insights'" (click)="tab = 'insights'; insightsWizardStep = 1; loadAnalyticsPack()">{{ 'reports.tab.insightsFriendly' | translate }}</button>
      </div>

      <div *ngIf="tab === 'designer'" class="animate-in">
        <div class="erp-card mb-3 reports-friendly-guide">
          <h4 class="erp-card-title mb-1">{{ 'reports.designer.guideTitle' | translate }}</h4>
          <p class="text-muted small mb-0">{{ 'reports.designer.guideLead' | translate }}</p>
        </div>
        <div class="erp-card mb-3">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h4 class="erp-card-title mb-0">{{ 'reports.designer.templateSetupTitle' | translate }}</h4>
            <button type="button" class="btn-outline-erp btn-sm" (click)="showTemplateSetup = !showTemplateSetup">
              {{ (showTemplateSetup ? 'reports.designer.hideTemplateSetup' : 'reports.designer.showTemplateSetup') | translate }}
            </button>
          </div>
          <p class="text-muted small mb-0 mt-2">{{ 'reports.designer.templateSetupLead' | translate }}</p>
        </div>
        <div class="erp-card mb-4" *ngIf="showTemplateSetup">
          <div class="row g-3 reports-template-editor-row">
            <div class="col-md-3">
              <label class="erp-label">{{ 'reports.templateCode' | translate }}</label>
              <input class="erp-input" [(ngModel)]="templateDraft.templateCode" />
              <p class="text-muted small mb-0 mt-1">{{ 'reports.designer.templateCodeHint' | translate }}</p>
            </div>
            <div class="col-md-3">
              <label class="erp-label">{{ 'reports.templateName' | translate }}</label>
              <input class="erp-input" [(ngModel)]="templateDraft.name" />
            </div>
            <div class="col-md-2">
              <label class="erp-label">{{ 'reports.packCode' | translate }}</label>
              <select class="erp-select" [(ngModel)]="templateDraft.packCode">
                <option value="CBSE">{{ 'reports.boardPreset.cbse' | translate }}</option>
                <option value="ICSE">{{ 'reports.boardPreset.icse' | translate }}</option>
                <option value="STATE">{{ 'reports.boardPreset.state' | translate }}</option>
                <option value="CUSTOM">{{ 'reports.boardPreset.custom' | translate }}</option>
              </select>
              <p class="text-muted small mb-0 mt-1">{{ 'reports.designer.packHint' | translate }}</p>
            </div>
            <div class="col-md-2">
              <label class="erp-label">{{ 'reports.format' | translate }}</label>
              <select class="erp-select" [(ngModel)]="templateDraft.defaultFormat">
                <option value="PDF">{{ 'reports.formatLabel.pdf' | translate }}</option>
                <option value="CSV">{{ 'reports.formatLabel.csv' | translate }}</option>
              </select>
            </div>
            <div class="col-md-2 reports-template-save-col">
              <label class="erp-label reports-template-save-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-outline-erp btn-sm w-100 reports-template-save-btn" (click)="saveTemplateDraft()">{{ 'reports.saveTemplate' | translate }}</button>
            </div>
          </div>
          <div class="row g-3 mt-1">
            <div class="col-md-4">
              <label class="erp-label small">{{ 'reports.columnsCsv' | translate }}</label>
              <input class="erp-input" [(ngModel)]="templateColumnsCsv" />
              <p class="text-muted small mb-0 mt-1">{{ 'reports.designer.columnsHint' | translate }}</p>
            </div>
            <div class="col-md-4">
              <label class="erp-label small">{{ 'reports.boardSectionsCsv' | translate }}</label>
              <input class="erp-input" [(ngModel)]="templateSectionsCsv" />
            </div>
            <div class="col-md-4">
              <label class="erp-label small">{{ 'reports.promotionMinPct' | translate }}</label>
              <input type="number" class="erp-input" [(ngModel)]="templatePromotionMinPct" />
            </div>
          </div>
        </div>
        <div class="erp-card mb-4">
          <div class="reports-wizard-steps" aria-hidden="true">
            <span [class.active]="designerWizardStep === 1" [class.done]="designerWizardStep > 1">1</span>
            <i></i>
            <span [class.active]="designerWizardStep === 2" [class.done]="designerWizardStep > 2">2</span>
            <i></i>
            <span [class.active]="designerWizardStep === 3">3</span>
          </div>
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h4 class="erp-card-title mb-1">{{ designerWizardTitle | translate }}</h4>
              <p class="text-muted small mb-0">{{ designerWizardLead | translate }}</p>
            </div>
            <span class="badge bg-light text-dark border">{{ 'reports.designer.stepCounter' | translate: { step: designerWizardStep, total: 3 } }}</span>
          </div>

          <div class="row g-3" *ngIf="designerWizardStep === 1">
            <div class="col-md-3">
              <label class="erp-label small">{{ 'reports.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerClassId" (change)="onDesignerClassChange()">
                <option [ngValue]="null">-</option>
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="erp-label small">{{ 'reports.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerSectionId">
                <option [ngValue]="null">{{ 'reports.allSections' | translate }}</option>
                <option *ngFor="let section of designerSections" [ngValue]="section.id">{{ section.name }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="erp-label small">{{ 'reports.labelExam' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerExamId">
                <option [ngValue]="null">-</option>
                <option *ngFor="let exam of exams" [ngValue]="exam.id">{{ exam.name }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="erp-label small">{{ 'reports.labelStudent' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerStudentId">
                <option [ngValue]="null">-</option>
                <option *ngFor="let student of designerStudentOptions" [ngValue]="student.id">{{ student.firstName }} {{ student.lastName }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="erp-label small">{{ 'reports.labelMonth' | translate }}</label>
              <app-erp-month-picker [(ngModel)]="designerMonth" placeholderI18nKey="reports.monthPlaceholder" />
            </div>
          </div>

          <div *ngIf="designerWizardStep === 2">
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="erp-label">{{ 'reports.template' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedTemplateId" (ngModelChange)="onDesignerTemplateChange()">
                  <option [ngValue]="null">{{ 'reports.noTemplate' | translate }}</option>
                  <option *ngFor="let t of reportTemplates" [ngValue]="t.id">{{ t.name }} ({{ reportTypeLabel(t.reportType) }})</option>
                </select>
                <!-- <p class="text-muted small mb-0 mt-1">{{ 'reports.designer.savedTemplateHint' | translate }}</p> -->
              </div>
              <div class="col-md-4">
                <label class="erp-label">{{ 'reports.reportType' | translate }}</label>
                <select class="erp-select" [(ngModel)]="designerReportType">
                  <option *ngFor="let rt of reportTypes" [ngValue]="rt">{{ reportTypeLabel(rt) }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="erp-label">{{ 'reports.format' | translate }}</label>
                <select class="erp-select" [(ngModel)]="designerFormat">
                  <option value="PDF">{{ 'reports.formatLabel.pdf' | translate }}</option>
                  <option value="CSV">{{ 'reports.formatLabel.csv' | translate }}</option>
                </select>
              </div>
            </div>
            <button type="button" class="btn-outline-erp btn-sm mt-3" (click)="showTemplateSetup = !showTemplateSetup">
              {{ (showTemplateSetup ? 'reports.designer.hideTemplateSetup' : 'reports.designer.showTemplateSetup') | translate }}
            </button>
          </div>

          <div *ngIf="designerWizardStep === 3">
            <div class="row g-3 align-items-start">
              <div class="col-md-8">
                <h5 class="mb-2">{{ 'reports.designer.reviewTitle' | translate }}</h5>
                <p class="text-muted small mb-2">{{ 'reports.designer.reviewLead' | translate }}</p>
                <div class="small text-muted">
                  <div><strong>{{ 'reports.labelClass' | translate }}:</strong> {{ designerClassDisplay }}</div>
                  <div><strong>{{ 'reports.labelSection' | translate }}:</strong> {{ designerSectionDisplay }}</div>
                  <div><strong>{{ 'reports.labelExam' | translate }}:</strong> {{ designerExamDisplay }}</div>
                  <div><strong>{{ 'reports.reportType' | translate }}:</strong> {{ reportTypeLabel(designerReportType) }}</div>
                  <div><strong>{{ 'reports.format' | translate }}:</strong> {{ designerFormat }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <button type="button" class="btn-primary-erp w-100" (click)="generateDesignerReport()" [disabled]="!canGenerateDesignerReport">
                  {{ 'reports.designer.generateFriendly' | translate }}
                </button>
                <p class="text-muted small mb-0 mt-1">{{ 'reports.designer.generateHint' | translate }}</p>
                <button type="button" class="btn-outline-erp btn-sm w-100 mt-2" (click)="showAdvancedDesigner = !showAdvancedDesigner">
                  {{ (showAdvancedDesigner ? 'reports.designer.showBasic' : 'reports.designer.showAdvanced') | translate }}
                </button>
              </div>
            </div>
            <div class="row g-3 mt-1" *ngIf="showAdvancedDesigner">
              <div class="col-md-3">
                <label class="erp-label small">{{ 'reports.scheduleAt' | translate }}</label>
                <input type="datetime-local" class="erp-input" [(ngModel)]="designerScheduleAt" />
              </div>
              <div class="col-md-3">
                <label class="erp-label small">{{ 'reports.shareRolesCsv' | translate }}</label>
                <select class="erp-select" multiple [(ngModel)]="designerShareRoles">
                  <option *ngFor="let role of designerShareRoleOptions" [ngValue]="role">{{ role }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="erp-label small">{{ 'reports.shareLocalesCsv' | translate }}</label>
                <select class="erp-select" multiple [(ngModel)]="designerShareLocales">
                  <option *ngFor="let locale of designerShareLocaleOptions" [ngValue]="locale">{{ locale }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="erp-label small">{{ 'reports.shareChannelsCsv' | translate }}</label>
                <select class="erp-select" multiple [(ngModel)]="designerShareChannels">
                  <option *ngFor="let channel of designerShareChannelOptions" [ngValue]="channel">{{ channel }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between gap-2 flex-wrap mt-3">
            <button type="button" class="btn-outline-erp btn-sm" (click)="previousDesignerStep()" [disabled]="designerWizardStep === 1">
              {{ 'reports.designer.back' | translate }}
            </button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="nextDesignerStep()" *ngIf="designerWizardStep < 3">
              {{ 'reports.designer.next' | translate }}
            </button>
          </div>
        </div>
        <div class="erp-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4 class="erp-card-title mb-0">{{ 'reports.generatedJobs' | translate }}</h4>
            <div class="d-flex gap-2">
              <button type="button" class="btn-outline-erp btn-sm" (click)="seedDefaultReportPacks()">{{ 'reports.seedPacks' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-sm" (click)="loadReportJobs()">{{ 'reports.refresh' | translate }}</button>
            </div>
          </div>
          <table class="erp-table" *ngIf="reportJobs.length">
            <thead><tr><th>{{ 'reports.th.id' | translate }}</th><th>{{ 'reports.reportType' | translate }}</th><th>{{ 'reports.format' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th><th>{{ 'reports.workflowState' | translate }}</th><th>{{ 'reports.generatedAt' | translate }}</th><th>{{ 'reports.download' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let j of reportJobs">
                <td>{{ j.id }}</td>
                <td>{{ reportTypeLabel(j.reportType) }}</td>
                <td>{{ j.format }}</td>
                <td>{{ reportJobStatusLabel(j.status) }}</td>
                <td>{{ reportWorkflowLabel(j.workflowState) }}</td>
                <td>{{ formatDate(j.generatedAt || j.createdAt) || '-' }}</td>
                <td>
                  <div class="d-flex flex-wrap gap-1 reports-job-actions">
                    <button type="button" class="btn-outline-erp btn-sm" (click)="downloadReportJob(j)">
                      <i class="bi bi-download"></i> {{ 'reports.download' | translate }}
                    </button>
                    <button *ngIf="j.status === 'FAILED'" type="button" class="btn-outline-erp btn-sm" (click)="retryReportJob(j)">
                      {{ 'reports.retry' | translate }}
                    </button>
                    <button *ngIf="j.status === 'COMPLETED' && (j.workflowState || 'DRAFT') === 'DRAFT'" type="button" class="btn-outline-erp btn-sm" (click)="approveReportJob(j)">
                      {{ 'reports.approve' | translate }}
                    </button>
                    <button *ngIf="j.status === 'COMPLETED' && j.workflowState === 'APPROVED'" type="button" class="btn-outline-erp btn-sm" (click)="publishReportJob(j)">
                      {{ 'reports.publish' | translate }}
                    </button>
                    <button type="button" class="btn-outline-erp btn-sm" (click)="loadDispatchesForJob(j)">
                      {{ 'reports.dispatchesFriendly' | translate }}
                    </button>
                    <button type="button" class="btn-outline-erp btn-sm" (click)="loadSnapshotsForJob(j)">
                      {{ 'reports.snapshotsFriendly' | translate }}
                    </button>
                    <button type="button" class="btn-outline-erp btn-sm" (click)="loadWorkflowEventsForJob(j)">
                      {{ 'reports.eventsFriendly' | translate }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="selectedDispatchJobId != null" class="mt-3">
            <h5 class="mb-2">{{ 'reports.dispatches' | translate }} · #{{ selectedDispatchJobId }}</h5>
            <table class="erp-table" *ngIf="dispatchRows.length">
              <thead><tr><th>{{ 'reports.th.status' | translate }}</th><th>{{ 'reports.shareRole' | translate }}</th><th>{{ 'reports.shareLocale' | translate }}</th><th>{{ 'reports.shareChannel' | translate }}</th><th>{{ 'reports.generatedAt' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let d of dispatchRows">
                  <td>{{ reportJobStatusLabel(d.status) }}</td>
                  <td>{{ humanRoleLabel(d.targetRole) }}</td>
                  <td>{{ d.localeCode }}</td>
                  <td>{{ d.channel }}</td>
                  <td>{{ formatDate(d.createdAt) || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="selectedSnapshotJobId != null" class="mt-3">
            <h5 class="mb-2">{{ 'reports.snapshots' | translate }} · #{{ selectedSnapshotJobId }}</h5>
            <table class="erp-table" *ngIf="snapshotRows.length">
              <thead><tr><th>{{ 'reports.versionNo' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th><th>{{ 'reports.generatedAt' | translate }}</th><th>{{ 'reports.rollback' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of snapshotRows">
                  <td>{{ s.versionNo }}</td>
                  <td>{{ reportSnapshotTypeLabel(s.snapshotType) }}</td>
                  <td>{{ formatDate(s.publishedAt) || '-' }}</td>
                  <td><button type="button" class="btn-outline-erp btn-sm" (click)="rollbackSnapshot(s)">{{ 'reports.rollback' | translate }}</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="selectedEventJobId != null" class="mt-3">
            <h5 class="mb-2">{{ 'reports.events' | translate }} · #{{ selectedEventJobId }}</h5>
            <table class="erp-table" *ngIf="workflowEvents.length">
              <thead><tr><th>{{ 'reports.eventCode' | translate }}</th><th>{{ 'reports.workflowState' | translate }}</th><th>{{ 'reports.generatedAt' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let e of workflowEvents">
                  <td>{{ reportEventLabel(e.eventCode) }}</td>
                  <td>{{ (e.fromState || '-') + ' → ' + (e.toState || '-') }}</td>
                  <td>{{ formatDate(e.occurredAt) || '-' }}</td>
                  <td>{{ e.note || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="!reportJobs.length" class="text-muted small mb-0">{{ 'reports.noData' | translate }}</p>
        </div>
      </div>

      <div *ngIf="tab === 'performance'" class="animate-in">
        <div class="erp-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onPerformanceClassChange()">
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedPerformanceSectionId" (change)="loadPerformance()">
                <option [ngValue]="null">{{ 'reports.allSections' | translate }}</option>
                <option *ngFor="let section of performanceSections" [ngValue]="section.id">{{ section.name }}</option>
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
          <div class="erp-filter-toolbar mb-2">
            <div class="erp-filter-toolbar__search">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.performance"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.performancePh" [(ngModel)]="perfSearch" (ngModelChange)="onPerfSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="exportPerformanceCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
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
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onAttendanceClassChange()">
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedAttendanceSectionId" (change)="loadAttendance()">
                <option [ngValue]="null">{{ 'reports.allSections' | translate }}</option>
                <option *ngFor="let section of attendanceSections" [ngValue]="section.id">{{ section.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelMonth' | translate }}</label>
              <app-erp-month-picker [(ngModel)]="selectedMonth" (ngModelChange)="loadAttendance()" placeholderI18nKey="reports.monthPlaceholder" />
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="erp-filter-toolbar mb-2">
            <div class="erp-filter-toolbar__search">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.attendance"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.attendancePh" [(ngModel)]="attRepSearch" (ngModelChange)="onAttRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="exportAttendanceCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
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
              <select class="erp-select" [(ngModel)]="selectedFeeClassId" (change)="onFeeClassChange()">
                <option [ngValue]="null">{{ 'reports.allClasses' | translate }}</option>
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedFeeSectionId" (change)="loadFees()">
                <option [ngValue]="null">{{ 'reports.allSections' | translate }}</option>
                <option *ngFor="let section of feeSections" [ngValue]="section.id">{{ section.name }}</option>
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
          <div class="erp-filter-toolbar mb-2">
            <div class="erp-filter-toolbar__search">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.fees"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.feesPh" [(ngModel)]="feeRepSearch" (ngModelChange)="onFeeRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="exportFeesCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="feeRows.length && !feeRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="feeRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.student' | translate }}</th><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.total' | translate }}</th><th>{{ 'reports.th.paid' | translate }}</th><th>{{ 'reports.th.pendingAmt' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let payment of pagedFeeRows">
                <td><strong>{{ payment.studentName }}</strong></td>
                <td>{{ getStudentClassSectionName(payment.studentId) }}</td>
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
          <div class="erp-filter-toolbar mb-2">
            <div *ngIf="!reportServerPaging" class="erp-filter-toolbar__search">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.class"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.classPh" [(ngModel)]="classRepSearch" (ngModelChange)="onClassRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="exportClassCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="classSummaryRows.length && !classRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="classRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.sections' | translate }}</th><th>{{ 'reports.th.students' | translate }}</th><th>{{ 'reports.th.attendancePct' | translate }}</th><th>{{ 'reports.th.performancePct' | translate }}</th><th>{{ 'reports.th.feeCollectionPct' | translate }}</th><th>{{ 'reports.th.overdueAccounts' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedClassSummaryRows">
                <td><strong>{{ row.className | schoolClassName }}</strong></td>
                <td>{{ row.sections }}</td>
                <td>{{ row.totalStudents }}</td>
                <td>{{ row.attendancePercentage | number:'1.0-1' }}%</td>
                <td>{{ row.performancePercentage | number:'1.0-1' }}%</td>
                <td>{{ row.feeCollectionPercentage | number:'1.0-1' }}%</td>
                <td>{{ row.overdueAccounts }}</td>
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
          <div class="erp-filter-toolbar mb-2">
            <div *ngIf="!reportServerPaging" class="erp-filter-toolbar__search">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.section"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.sectionPh" [(ngModel)]="secRepSearch" (ngModelChange)="onSecRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="exportSectionCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="sectionRows.length && !secRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="secRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.classCol' | translate }}</th><th>{{ 'reports.th.section' | translate }}</th><th>{{ 'reports.th.students' | translate }}</th><th>{{ 'reports.th.classTeacher' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedSectionRows">
                <td><strong>{{ row.className | schoolClassName }}</strong></td>
                <td>{{ row.sectionName }}</td>
                <td>{{ row.studentCount }}</td>
                <td>{{ row.classTeacherName || '-' }}</td>
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
          <div class="erp-filter-toolbar mb-2">
            <div *ngIf="!reportServerPaging" class="erp-filter-toolbar__search">
              <label class="erp-label small mb-1" erpI18nText="reports.filter.teacher"></label>
              <input type="search" class="erp-input" erpI18nPh="reports.filter.teacherPh" [(ngModel)]="teachRepSearch" (ngModelChange)="onTeachRepSearchChange()" />
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="exportTeacherCsv()"><i class="bi bi-download"></i> {{ 'reports.exportCsv' | translate }}</button>
          </div>
          <p *ngIf="teacherRows.length && !teachRepFilteredTotal" class="text-muted small mb-2">{{ 'reports.noMatches' | translate }}</p>
          <table class="erp-table" *ngIf="teachRepFilteredTotal">
            <thead><tr><th>{{ 'reports.th.teacher' | translate }}</th><th>{{ 'reports.th.homeroomClasses' | translate }}</th><th>{{ 'reports.th.subjects' | translate }}</th><th>{{ 'reports.th.assignedClasses' | translate }}</th><th>{{ 'reports.th.weeklyPeriods' | translate }}</th><th>{{ 'reports.th.status' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of pagedTeacherRows">
                <td><strong>{{ row.teacherName }}</strong></td>
                <td>{{ row.homeroomClasses || '-' }}</td>
                <td>{{ row.subjects.join(', ') }}</td>
                <td>{{ row.assignedClasses }}</td>
                <td>{{ row.weeklyPeriods }}</td>
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
              <label class="erp-label">{{ 'reports.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onReportCardClassChange()">
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedReportCardSectionId" (change)="onReportCardSectionChange()">
                <option [ngValue]="null">{{ 'reports.allSections' | translate }}</option>
                <option *ngFor="let section of reportCardSections" [ngValue]="section.id">{{ section.name }}</option>
              </select>
            </div>
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
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelLocale' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedReportLocale" (change)="loadReportCard()">
                <option value="en">{{ 'reports.localeEnglish' | translate }}</option>
                <option value="hi">{{ 'reports.localeHindi' | translate }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="erp-card" *ngIf="reportCard">
          <div class="erp-card-header">
            <h3 class="erp-card-title">{{ 'reports.reportCardTitle' | translate: { name: reportCard.studentName } }}</h3>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn-outline-erp btn-sm reports-export-btn" (click)="exportReportCardCsv()"><i class="bi bi-download"></i> {{ 'reports.export' | translate }}</button>
              <div>{{ reportCard.overallPercentage | number:'1.0-1' }}% · {{ reportCard.overallGrade }}</div>
            </div>
          </div>
          <div class="reports-report-meta">
            <span class="reports-report-meta__chip" *ngIf="reportCard.boardCode">{{ 'reports.labelBoard' | translate }}: {{ reportCard.boardCode }}</span>
            <span class="reports-report-meta__chip" *ngIf="reportCard.termCode">{{ 'reports.labelTerm' | translate }}: {{ reportCard.termCode }}</span>
            <span class="reports-report-meta__chip">{{ 'reports.labelLocale' | translate }}: {{ reportCard.localeCode || selectedReportLocale }}</span>
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
          <div class="mt-4" *ngIf="reportCard.sections?.length">
            <h4 class="erp-card-title mb-2">{{ 'reports.dynamicSectionsTitle' | translate }}</h4>
            <div class="row g-3">
              <div class="col-md-6" *ngFor="let section of reportCard.sections">
                <div class="reports-section-card">
                  <h5 class="reports-section-card__title">{{ section.title || section.key }}</h5>
                  <ng-container [ngSwitch]="reportCardSectionLayout(section)">
                    <table class="erp-table mb-0" *ngSwitchCase="'table'">
                      <thead>
                        <tr>
                          <th *ngFor="let col of reportCardSectionTableColumns(section)">{{ col.label }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of reportCardSectionTableRows(section)">
                          <td *ngFor="let col of reportCardSectionTableColumns(section)">{{ row[col.key] }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <ul *ngSwitchCase="'list'" class="reports-section-list mb-0">
                      <li *ngFor="let item of reportCardSectionListItems(section)">{{ item }}</li>
                    </ul>
                    <div *ngSwitchCase="'badges'" class="reports-section-badges">
                      <span class="reports-section-badge" *ngFor="let badge of reportCardSectionBadgeItems(section)">{{ badge }}</span>
                    </div>
                    <blockquote *ngSwitchCase="'remarks'" class="reports-remark-block mb-0">
                      {{ reportCardSectionRemark(section) }}
                    </blockquote>
                    <table class="erp-table mb-0" *ngSwitchDefault>
                      <tbody>
                        <tr *ngFor="let row of reportCardSectionRows(section)">
                          <th>{{ row.label }}</th>
                          <td>{{ row.value }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </ng-container>
                  <p *ngIf="reportCardSectionIsEmpty(section)" class="text-muted small mb-0">{{ 'reports.noData' | translate }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'insights'" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="erp-card-title mb-2">{{ 'reports.insightsGuideTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'reports.insightsGuideLead' | translate }}</p>
          <div class="reports-wizard-steps" aria-hidden="true">
            <span [class.active]="insightsWizardStep === 1" [class.done]="insightsWizardStep > 1">1</span>
            <i></i>
            <span [class.active]="insightsWizardStep === 2" [class.done]="insightsWizardStep > 2">2</span>
            <i></i>
            <span [class.active]="insightsWizardStep === 3">3</span>
          </div>
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h4 class="erp-card-title mb-1">{{ insightsWizardTitle | translate }}</h4>
              <p class="text-muted small mb-0">{{ insightsWizardLead | translate }}</p>
            </div>
            <span class="badge bg-light text-dark border">{{ 'reports.designer.stepCounter' | translate: { step: insightsWizardStep, total: 3 } }}</span>
          </div>

          <div class="row g-3 align-items-end" *ngIf="insightsWizardStep === 1">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerClassId" (change)="onDesignerClassChange()">
                <option [ngValue]="null">-</option>
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerSectionId">
                <option [ngValue]="null">{{ 'reports.allSections' | translate }}</option>
                <option *ngFor="let section of designerSections" [ngValue]="section.id">{{ section.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.labelExam' | translate }}</label>
              <select class="erp-select" [(ngModel)]="designerExamId">
                <option [ngValue]="null">-</option>
                <option *ngFor="let exam of exams" [ngValue]="exam.id">{{ exam.name }}</option>
              </select>
            </div>
          </div>

          <div class="row g-3 align-items-end" *ngIf="insightsWizardStep === 2">
            <div class="col-md-4">
              <label class="erp-label">{{ 'reports.insightsPresetLabel' | translate }}</label>
              <select class="erp-select" [(ngModel)]="analyticsPackCode">
                <option value="CBSE">{{ 'reports.boardPreset.cbse' | translate }}</option>
                <option value="ICSE">{{ 'reports.boardPreset.icse' | translate }}</option>
                <option value="STATE">{{ 'reports.boardPreset.state' | translate }}</option>
                <option value="CUSTOM">{{ 'reports.boardPreset.custom' | translate }}</option>
              </select>
            </div>
          </div>

          <div class="row g-3 align-items-start" *ngIf="insightsWizardStep === 3">
            <div class="col-md-8">
              <h5 class="mb-2">{{ 'reports.insightsReviewTitle' | translate }}</h5>
              <p class="text-muted small mb-2">{{ 'reports.insightsReviewLead' | translate }}</p>
              <div class="small text-muted">
                <div><strong>{{ 'reports.labelClass' | translate }}:</strong> {{ designerClassDisplay }}</div>
                <div><strong>{{ 'reports.labelSection' | translate }}:</strong> {{ designerSectionDisplay }}</div>
                <div><strong>{{ 'reports.labelExam' | translate }}:</strong> {{ designerExamDisplay }}</div>
                <div><strong>{{ 'reports.insightsPresetLabel' | translate }}:</strong> {{ analyticsPackCode }}</div>
              </div>
            </div>
            <div class="col-md-4">
              <button type="button" class="btn-primary-erp w-100" (click)="loadAnalyticsPack()" [disabled]="!canRunInsights">
                {{ 'reports.insightsRun' | translate }}
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-between gap-2 flex-wrap mt-3">
            <button type="button" class="btn-outline-erp btn-sm" (click)="previousInsightsStep()" [disabled]="insightsWizardStep === 1">
              {{ 'reports.designer.back' | translate }}
            </button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="nextInsightsStep()" *ngIf="insightsWizardStep < 3">
              {{ 'reports.designer.next' | translate }}
            </button>
          </div>
        </div>
        <div class="erp-card mb-3">
          <h4 class="erp-card-title">{{ 'reports.trendBands' | translate }}</h4>
          <table class="erp-table" *ngIf="analyticsPack?.trendBands?.length">
            <thead><tr><th>{{ 'reports.insightsBand' | translate }}</th><th>{{ 'reports.insightsRange' | translate }}</th><th>{{ 'reports.insightsCount' | translate }}</th></tr></thead>
            <tbody><tr *ngFor="let b of analyticsPack?.trendBands"><td>{{ reportTrendBandLabel(b['band']) }}</td><td>{{ b['range'] }}</td><td>{{ b['count'] }}</td></tr></tbody>
          </table>
          <p *ngIf="!(analyticsPack?.trendBands?.length)" class="text-muted small mb-0">{{ 'reports.noData' | translate }}</p>
        </div>
        <div class="erp-card mb-3">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h4 class="erp-card-title mb-0">{{ 'reports.analyticsConfigFriendly' | translate }}</h4>
            <button type="button" class="btn-outline-erp btn-sm" (click)="showInsightsAdvanced = !showInsightsAdvanced">
              {{ (showInsightsAdvanced ? 'reports.insightsHideSettings' : 'reports.insightsShowSettings') | translate }}
            </button>
          </div>
          <p class="text-muted small mb-3 mt-2">{{ 'reports.analyticsConfigLead' | translate }}</p>
          <div class="row g-3 align-items-end" *ngIf="showInsightsAdvanced">
            <div class="col-sm-6 col-lg-3">
              <label class="erp-label">{{ 'reports.excellentPctFriendly' | translate }}</label>
              <input class="erp-input" type="number" [(ngModel)]="guardrailExcellentPct" />
            </div>
            <div class="col-sm-6 col-lg-3">
              <label class="erp-label">{{ 'reports.laggingPctFriendly' | translate }}</label>
              <input class="erp-input" type="number" [(ngModel)]="guardrailLaggingPct" />
            </div>
            <div class="col-sm-6 col-lg-3">
              <label class="erp-label">{{ 'reports.promotionMinAttendanceFriendly' | translate }}</label>
              <input class="erp-input" type="number" [(ngModel)]="guardrailPromotionMinAttendance" />
            </div>
            <div class="col-sm-6 col-lg-3">
              <label class="erp-label">{{ 'reports.promotionFormulaFriendly' | translate }}</label>
              <input class="erp-input" [(ngModel)]="guardrailPromotionFormula" />
            </div>
            <div class="col-12 col-lg-3">
              <button type="button" class="btn-outline-erp btn-sm w-100" (click)="saveAnalyticsConfig()">{{ 'reports.saveConfig' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      color: var(--clr-text);
    }
    .reports-page-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
      color: color-mix(in srgb, var(--clr-text) 92%, var(--clr-primary));
    }
    .reports-page-lead {
      font-size: 13px;
      max-width: 820px;
    }
    .erp-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
    .erp-tabs .erp-tab { white-space: nowrap; }
    .erp-card {
      border: 1px solid color-mix(in srgb, var(--clr-border) 82%, var(--clr-primary) 18%);
      border-radius: 14px;
      box-shadow: 0 8px 22px color-mix(in srgb, var(--clr-primary) 8%, transparent);
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--clr-surface) 97%, var(--clr-primary) 3%) 0%,
        var(--clr-surface) 100%
      );
    }
    .erp-card-title {
      color: color-mix(in srgb, var(--clr-text) 88%, var(--clr-primary) 12%);
      letter-spacing: -0.01em;
      font-weight: 800;
    }
    .reports-friendly-guide {
      border-left: 4px solid var(--clr-primary);
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--clr-primary) 14%, transparent) 0%,
        color-mix(in srgb, var(--clr-primary) 4%, var(--clr-surface)) 55%,
        var(--clr-surface) 100%
      );
    }
    .reports-wizard-steps { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; }
    .reports-wizard-steps span { width: 30px; height: 30px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--clr-border); color: var(--clr-text-muted); font-weight: 800; background: var(--clr-surface); }
    .reports-wizard-steps span.active, .reports-wizard-steps span.done { background: var(--clr-primary); border-color: var(--clr-primary); color: #fff; }
    .reports-wizard-steps i { flex: 1; height: 1px; background: var(--clr-border-light); }
    .erp-table {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary) 20%);
    }
    .erp-table thead th {
      background: color-mix(in srgb, var(--clr-primary) 11%, var(--clr-surface));
      color: color-mix(in srgb, var(--clr-text) 80%, var(--clr-primary) 20%);
      font-weight: 700;
      border-bottom-color: color-mix(in srgb, var(--clr-border) 68%, var(--clr-primary) 32%);
    }
    .erp-table tbody tr:nth-child(even) td {
      background: color-mix(in srgb, var(--clr-surface) 95%, var(--clr-primary) 5%);
    }
    .erp-table tbody tr:hover td {
      background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
    }
    .btn-primary-erp {
      box-shadow: 0 8px 18px color-mix(in srgb, var(--clr-primary) 28%, transparent);
    }
    .btn-outline-erp {
      border-color: color-mix(in srgb, var(--clr-border) 72%, var(--clr-primary) 28%);
      color: color-mix(in srgb, var(--clr-text) 84%, var(--clr-primary) 16%);
      background: color-mix(in srgb, var(--clr-surface) 96%, var(--clr-primary) 4%);
    }
    .btn-outline-erp:hover {
      border-color: color-mix(in srgb, var(--clr-primary) 62%, var(--clr-border) 38%);
      background: color-mix(in srgb, var(--clr-primary) 16%, var(--clr-surface));
      color: color-mix(in srgb, var(--clr-text) 72%, var(--clr-primary) 28%);
    }
    .reports-job-actions .btn-outline-erp {
      border-radius: 999px;
    }
    .reports-template-save-label-spacer {
      visibility: hidden;
      margin-bottom: 0.25rem;
    }
    .reports-template-save-btn {
      min-height: 38px;
    }
    .reports-export-btn {
      margin-left: auto;
    }
    .reports-report-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0 12px;
    }
    .reports-report-meta__chip {
      font-size: 12px;
      border-radius: 999px;
      padding: 4px 10px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 70%, var(--clr-primary) 30%);
      background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface));
      color: color-mix(in srgb, var(--clr-text) 80%, var(--clr-primary) 20%);
    }
    .reports-section-card {
      border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary) 20%);
      border-radius: 12px;
      padding: 12px;
      background: color-mix(in srgb, var(--clr-surface) 97%, var(--clr-primary) 3%);
    }
    .reports-section-card__title {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 8px;
      color: color-mix(in srgb, var(--clr-text) 84%, var(--clr-primary) 16%);
    }
    .reports-section-list {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 6px;
      font-size: 13px;
    }
    .reports-section-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .reports-section-badge {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 72%, var(--clr-primary) 28%);
      background: color-mix(in srgb, var(--clr-primary) 10%, var(--clr-surface));
    }
    .reports-remark-block {
      margin: 0;
      border-left: 3px solid var(--clr-primary);
      background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface));
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 13px;
      color: color-mix(in srgb, var(--clr-text) 90%, var(--clr-primary) 10%);
    }
    @media (max-width: 768px) {
      .erp-table { font-size: 12px; }
      .btn-outline-erp.btn-sm { margin-bottom: 4px; }
      .reports-template-save-label-spacer {
        display: none;
      }
      .reports-export-btn {
        margin-left: 0;
      }
      .reports-wizard-steps { margin-bottom: 10px; }
      .reports-wizard-steps span { width: 26px; height: 26px; font-size: 12px; }
      .erp-card {
        border-radius: 12px;
      }
    }
    @media (max-width: 576px) {
      .erp-card { padding: 12px; }
      .erp-card .row { --bs-gutter-x: 0.5rem; }
      .erp-table { display: block; overflow-x: auto; white-space: nowrap; font-size: 11px; }
      .btn-outline-erp.btn-sm, .btn-primary-erp { width: 100%; }
      .erp-label { font-size: 12px; }
      .erp-input, .erp-select { min-height: 34px; font-size: 12px; }
      .reports-page-title { font-size: 21px; }
      .reports-page-lead { font-size: 12px; }
    }
  `]
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
  selectedPerformanceSectionId: number | null = null;
  selectedAttendanceSectionId: number | null = null;
  selectedFeeSectionId: number | null = null;
  selectedReportCardSectionId: number | null = null;
  performanceRows: StudentPerformanceRow[] = [];
  attendanceRows: AttendanceSummaryRow[] = [];
  feeRows: FeePayment[] = [];
  classSummaryRows: ClassSummaryRow[] = [];
  sectionRows: SectionSummaryRow[] = [];
  teacherRows: TeacherWorkloadRow[] = [];
  reportCard: ReportCard | null = null;
  selectedReportLocale = 'en';
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
  reportTemplates: ReportTemplateDefinition[] = [];
  reportJobs: ReportGenerationJob[] = [];
  dispatchRows: ReportShareDispatch[] = [];
  workflowEvents: ReportWorkflowEventLog[] = [];
  selectedDispatchJobId: number | null = null;
  selectedSnapshotJobId: number | null = null;
  selectedEventJobId: number | null = null;
  snapshotRows: ReportPublicationSnapshot[] = [];
  analyticsPackCode = 'CUSTOM';
  analyticsPack: ReportAnalyticsPack | null = null;
  analyticsConfigs: ReportAnalyticsPackConfig[] = [];
  guardrailExcellentPct = 80;
  guardrailLaggingPct = 55;
  guardrailPromotionMinAttendance = 75;
  guardrailPromotionFormula = 'performancePct >= 33 && attendancePct >= promotionMinAttendance';
  selectedTemplateId: number | null = null;
  templateDraft: ReportTemplateDefinition = {
    templateCode: '',
    name: '',
    reportType: 'STUDENT_PERFORMANCE',
    defaultFormat: 'PDF',
    packCode: 'CUSTOM',
    layoutConfig: {},
    filterSchema: {},
  };
  templateColumnsCsv = 'studentName,totalMarks,percentage,grade';
  templateSectionsCsv = 'Scholastic,Co-Scholastic';
  templatePromotionMinPct = 33;
  designerReportType = 'STUDENT_PERFORMANCE';
  designerFormat: 'PDF' | 'CSV' = 'PDF';
  designerClassId: number | null = null;
  designerSectionId: number | null = null;
  designerExamId: number | null = null;
  designerStudentId: number | null = null;
  designerMonth = new Date().toISOString().slice(0, 7);
  designerScheduleAt = '';
  designerShareRoles: string[] = ['PARENT', 'TEACHER', 'ADMIN'];
  designerShareLocales: string[] = ['en', 'hi'];
  designerShareChannels: string[] = ['IN_APP'];
  showAdvancedDesigner = false;
  showTemplateSetup = false;
  showInsightsAdvanced = false;
  designerWizardStep = 1;
  insightsWizardStep = 1;
  readonly reportTypes = [
    'STUDENT_PERFORMANCE',
    'ATTENDANCE_SUMMARY',
    'FEE_COLLECTION',
    'CLASS_SUMMARY',
    'SECTION_SUMMARY',
    'TEACHER_WORKLOAD',
  ];
  readonly designerShareRoleOptions = ['PARENT', 'TEACHER', 'ADMIN', 'STUDENT'];
  readonly designerShareLocaleOptions = ['en', 'hi'];
  readonly designerShareChannelOptions = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private academicService: AcademicService,
    private examService: ExamService,
    private feeService: FeeService,
    private reportService: ReportService,
    private studentService: StudentService,
    private confirmDialog: ConfirmDialogService,
    private auth: AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  private reportCsvMeta(titleKey: string): CsvDocumentMeta {
    const sm = this.auth.getProfileSummarySnapshot();
    return {
      documentTitle: this.translate.instant(titleKey),
      schoolLine: buildCsvSchoolLine(sm?.schoolName, sm?.schoolCode),
    };
  }

  private datedReportCsvName(slug: string): string {
    const d = new Date().toISOString().slice(0, 10);
    return `${slug}-${d}.csv`;
  }

  formatDate(raw: string | null | undefined): string {
    return formatDateDdMmYyyy(raw);
  }

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

  reportTypeLabel(raw: string | undefined): string {
    const code = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    const i18nKey = `reports.reportTypeLabel.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  reportJobStatusLabel(raw: string | undefined): string {
    const code = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    const i18nKey = `reports.jobStatus.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  reportWorkflowLabel(raw: string | undefined | null): string {
    if (!raw) {
      return '—';
    }
    const code = String(raw).trim().toUpperCase().replace(/\s+/g, '_');
    const i18nKey = `reports.workflowLabel.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw);
  }

  reportSnapshotTypeLabel(raw: string | undefined): string {
    const code = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    const i18nKey = `reports.snapshotTypeLabel.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  reportEventLabel(raw: string | undefined): string {
    const code = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    const i18nKey = `reports.eventLabel.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  get designerWizardTitle(): string {
    if (this.designerWizardStep === 1) return 'reports.designer.step1Title';
    if (this.designerWizardStep === 2) return 'reports.designer.step2Title';
    return 'reports.designer.step3Title';
  }

  get designerWizardLead(): string {
    if (this.designerWizardStep === 1) return 'reports.designer.step1Lead';
    if (this.designerWizardStep === 2) return 'reports.designer.step2Lead';
    return 'reports.designer.step3Lead';
  }

  get canGenerateDesignerReport(): boolean {
    if (this.designerReportType === 'STUDENT_PERFORMANCE') {
      return this.designerClassId != null && this.designerExamId != null;
    }
    if (this.designerReportType === 'ATTENDANCE_SUMMARY') {
      return this.designerClassId != null && !!this.designerMonth;
    }
    return true;
  }

  get canRunInsights(): boolean {
    return this.designerClassId != null && this.designerExamId != null;
  }

  get designerClassDisplay(): string {
    const cls = this.classes.find(c => c.id === this.designerClassId);
    return cls?.name ?? '-';
  }

  get designerSectionDisplay(): string {
    if (this.designerSectionId == null) {
      return this.translate.instant('reports.allSections');
    }
    return this.designerSections.find(s => s.id === this.designerSectionId)?.name ?? '-';
  }

  get designerExamDisplay(): string {
    return this.exams.find(e => e.id === this.designerExamId)?.name ?? '-';
  }

  get insightsWizardTitle(): string {
    if (this.insightsWizardStep === 1) return 'reports.insightsStep1Title';
    if (this.insightsWizardStep === 2) return 'reports.insightsStep2Title';
    return 'reports.insightsStep3Title';
  }

  get insightsWizardLead(): string {
    if (this.insightsWizardStep === 1) return 'reports.insightsStep1Lead';
    if (this.insightsWizardStep === 2) return 'reports.insightsStep2Lead';
    return 'reports.insightsStep3Lead';
  }

  reportTrendBandLabel(raw: unknown): string {
    const code = String(raw ?? '').trim().toUpperCase();
    const i18nKey = `reports.trendBandLabel.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  humanRoleLabel(raw: string | undefined): string {
    const code = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    const i18nKey = `reports.roleLabel.${code}`;
    const t = this.translate.instant(i18nKey);
    return t !== i18nKey ? t : String(raw ?? '');
  }

  ngOnInit(): void {
    this.selectedReportLocale = this.normalizeReportLocale(this.translate.currentLang);
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ lang }) => {
      this.selectedReportLocale = this.normalizeReportLocale(lang);
      this.cdr.markForCheck();
    });
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
    let rows = this.students;
    if (this.selectedClassId != null) {
      rows = rows.filter(student => student.classId === this.selectedClassId);
    }
    if (this.selectedReportCardSectionId != null) {
      rows = rows.filter(student => student.sectionId === this.selectedReportCardSectionId);
    }
    return rows;
  }

  get performanceSections(): Section[] {
    return this.sectionsForClass(this.selectedClassId);
  }

  get attendanceSections(): Section[] {
    return this.sectionsForClass(this.selectedClassId);
  }

  get feeSections(): Section[] {
    return this.sectionsForClass(this.selectedFeeClassId);
  }

  get reportCardSections(): Section[] {
    return this.sectionsForClass(this.selectedClassId);
  }

  get designerSections(): Section[] {
    return this.sectionsForClass(this.designerClassId);
  }

  get designerStudentOptions(): Student[] {
    return this.students.filter(student => {
      if (this.designerClassId != null && student.classId !== this.designerClassId) {
        return false;
      }
      if (this.designerSectionId != null && student.sectionId !== this.designerSectionId) {
        return false;
      }
      return true;
    });
  }

  onPerformanceClassChange(): void {
    this.selectedPerformanceSectionId = null;
    this.loadPerformance();
  }

  onAttendanceClassChange(): void {
    this.selectedAttendanceSectionId = null;
    this.loadAttendance();
  }

  onFeeClassChange(): void {
    this.selectedFeeSectionId = null;
    this.loadFees();
  }

  onReportCardClassChange(): void {
    this.selectedReportCardSectionId = null;
    this.selectedStudentId = this.reportCardStudents[0]?.id ?? null;
    this.loadReportCard();
  }

  onReportCardSectionChange(): void {
    this.selectedStudentId = this.reportCardStudents[0]?.id ?? null;
    this.loadReportCard();
  }

  onDesignerClassChange(): void {
    this.designerSectionId = null;
    this.designerStudentId = null;
  }

  loadPerformance(): void {
    if (this.selectedClassId == null || this.selectedExamId == null) return;
    this.reportService.getStudentPerformance(this.selectedClassId, this.selectedExamId, this.selectedPerformanceSectionId).subscribe(rows => {
      this.performanceRows = rows;
      this.perfPageIndex = 0;
      this.applyPerfPaging();
    });
  }

  loadAttendance(): void {
    if (this.selectedClassId == null || !this.selectedMonth) return;
    this.reportService.getAttendanceSummary(this.selectedClassId, this.selectedMonth, this.selectedAttendanceSectionId).subscribe(rows => {
      this.attendanceRows = rows;
      this.attRepPageIndex = 0;
      this.applyAttRepPaging();
    });
  }

  loadFees(): void {
    this.reportService.getFeeCollectionSummary(this.selectedFeeClassId ?? undefined, this.selectedFeeSectionId).subscribe(summary => (this.feeSummary = summary));
    this.feeService.getPayments().subscribe(payments => {
      this.feeRows = payments.filter(payment => {
        const student = this.students.find(row => row.id === payment.studentId);
        if (!student) return false;
        if (this.selectedFeeClassId != null && student.classId !== this.selectedFeeClassId) return false;
        if (this.selectedFeeSectionId != null && student.sectionId !== this.selectedFeeSectionId) return false;
        return true;
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
    this.reportService.getReportCard(studentId, this.selectedExamId ?? undefined, this.selectedReportLocale).subscribe(card => {
      this.reportCard = card;
      this.rcSubPageIndex = 0;
      this.applyRcSubPaging();
    });
  }

  reportCardSectionRows(section: { key: string; title: string; data: Record<string, unknown> }): Array<{ label: string; value: string }> {
    const data = section?.data ?? {};
    return Object.entries(data).map(([key, value]) => ({
      label: this.humanizeReportCardKey(key),
      value: this.humanizeReportCardValue(value),
    }));
  }

  reportCardSectionLayout(section: { key: string; title: string; data: Record<string, unknown> }): string {
    const layout = String(section?.data?.['layout'] ?? '').trim().toLowerCase();
    return layout || 'kv';
  }

  reportCardSectionTableColumns(section: { key: string; title: string; data: Record<string, unknown> }): Array<{ key: string; label: string }> {
    const explicit = Array.isArray(section?.data?.['tableColumns'])
      ? section.data['tableColumns'] as Array<Record<string, unknown>>
      : [];
    if (explicit.length) {
      return explicit.map(col => ({
        key: String(col?.['key'] ?? ''),
        label: String(col?.['label'] ?? col?.['key'] ?? ''),
      })).filter(col => !!col.key);
    }
    return [
      { key: 'subjectName', label: this.translate.instant('reports.th.subject') },
      { key: 'marksObtained', label: this.translate.instant('reports.th.marks') },
      { key: 'maxMarks', label: this.translate.instant('reports.th.maxMarks') },
      { key: 'grade', label: this.translate.instant('reports.th.grade') },
    ];
  }

  reportCardSectionTableRows(section: { key: string; title: string; data: Record<string, unknown> }): Array<Record<string, string>> {
    const explicitRows = Array.isArray(section?.data?.['tableRows'])
      ? section.data['tableRows'] as Array<Record<string, unknown>>
      : [];
    if (explicitRows.length) {
      return explicitRows.map(row => {
        const out: Record<string, string> = {};
        for (const col of this.reportCardSectionTableColumns(section)) {
          out[col.key] = this.humanizeReportCardValue(row[col.key]);
        }
        return out;
      });
    }
    const rows = Array.isArray(section?.data?.['rows']) ? section.data['rows'] as Array<Record<string, unknown>> : [];
    return rows.map(row => ({
      subjectName: String(row?.['subjectName'] ?? row?.['subject'] ?? '-'),
      marksObtained: this.humanizeReportCardValue(row?.['marksObtained']),
      maxMarks: this.humanizeReportCardValue(row?.['maxMarks']),
      grade: this.humanizeReportCardValue(row?.['grade']),
    }));
  }

  reportCardSectionListItems(section: { key: string; title: string; data: Record<string, unknown> }): string[] {
    const data = section?.data ?? {};
    if (Array.isArray(data['displayRows'])) {
      return (data['displayRows'] as Array<Record<string, unknown>>).map(row =>
        `${this.humanizeReportCardValue(row['label'])}: ${this.humanizeReportCardValue(row['value'])}`
      );
    }
    if (Array.isArray(data['items'])) {
      return (data['items'] as unknown[]).map(v => this.humanizeReportCardValue(v));
    }
    return Object.entries(data)
      .filter(([k]) => k !== 'layout')
      .map(([k, v]) => `${this.humanizeReportCardKey(k)}: ${this.humanizeReportCardValue(v)}`);
  }

  reportCardSectionBadgeItems(section: { key: string; title: string; data: Record<string, unknown> }): string[] {
    const data = section?.data ?? {};
    if (Array.isArray(data['displayRows'])) {
      return (data['displayRows'] as Array<Record<string, unknown>>).map(row =>
        `${this.humanizeReportCardValue(row['label'])} ${this.humanizeReportCardValue(row['value'])}`
      );
    }
    if (Array.isArray(data['badges'])) {
      return (data['badges'] as unknown[]).map(v => this.humanizeReportCardValue(v));
    }
    return Object.entries(data)
      .filter(([k]) => k !== 'layout')
      .map(([k, v]) => `${this.humanizeReportCardKey(k)} ${this.humanizeReportCardValue(v)}`);
  }

  reportCardSectionRemark(section: { key: string; title: string; data: Record<string, unknown> }): string {
    const data = section?.data ?? {};
    return this.humanizeReportCardValue(data['remark'] ?? data['template'] ?? data['note'] ?? '');
  }

  reportCardSectionIsEmpty(section: { key: string; title: string; data: Record<string, unknown> }): boolean {
    const layout = this.reportCardSectionLayout(section);
    if (layout === 'table') return this.reportCardSectionTableRows(section).length === 0;
    if (layout === 'list') return this.reportCardSectionListItems(section).length === 0;
    if (layout === 'badges') return this.reportCardSectionBadgeItems(section).length === 0;
    if (layout === 'remarks') return !this.reportCardSectionRemark(section).trim();
    return this.reportCardSectionRows(section).length === 0;
  }

  getStudentClassName(studentId: number): string {
    return this.students.find(student => student.id === studentId)?.className || '-';
  }

  getStudentClassSectionName(studentId: number): string {
    const student = this.students.find(row => row.id === studentId);
    if (!student) return '-';
    const className = student.className ?? '-';
    return student.sectionName ? `${className} - ${student.sectionName}` : className;
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
          String(r.overdueAccounts ?? 0).includes(q)
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
        const homeroom = (r.homeroomClasses || '').toLowerCase();
        return (
          r.teacherName.toLowerCase().includes(q) ||
          homeroom.includes(q) ||
          subj.includes(q) ||
          String(r.assignedClasses).includes(q) ||
          String(r.weeklyPeriods).includes(q)
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
    downloadCsvDocument(this.datedReportCsvName('report-student-performance'), this.reportCsvMeta('reports.csvDocumentTitle.performance'), rows);
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
    downloadCsvDocument(`report-attendance-${this.selectedMonth}.csv`, this.reportCsvMeta('reports.csvDocumentTitle.attendance'), rows);
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
        this.getStudentClassSectionName(p.studentId),
        String(p.amount),
        String(p.paidAmount),
        String(p.dueAmount),
        this.feeStatusLabel(p.status),
      ])
    ];
    downloadCsvDocument(this.datedReportCsvName('report-fee-collection'), this.reportCsvMeta('reports.csvDocumentTitle.fees'), rows);
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
          t('reports.csv.class.overdueAccounts'),
        ],
        ...data.map(r => [
          r.className,
          String(r.sections),
          String(r.totalStudents),
          String(r.attendancePercentage),
          String(r.performancePercentage),
          String(r.feeCollectionPercentage),
          String(r.overdueAccounts ?? 0),
        ]),
      ];
      downloadCsvDocument(this.datedReportCsvName('report-class-summary'), this.reportCsvMeta('reports.csvDocumentTitle.class'), rows);
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
        [t('reports.csv.section.class'), t('reports.csv.section.section'), t('reports.csv.section.studentCount'), t('reports.csv.section.classTeacher')],
        ...data.map(r => [r.className, r.sectionName, String(r.studentCount), r.classTeacherName || '-']),
      ];
      downloadCsvDocument(this.datedReportCsvName('report-section-summary'), this.reportCsvMeta('reports.csvDocumentTitle.section'), rows);
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
          t('reports.csv.teacher.homeroomClasses'),
          t('reports.csv.teacher.subjects'),
          t('reports.csv.teacher.assignedClasses'),
          t('reports.csv.teacher.weeklyPeriods'),
          t('reports.csv.teacher.status'),
        ],
        ...data.map(r => [r.teacherName, r.homeroomClasses || '-', r.subjects.join('; '), String(r.assignedClasses), String(r.weeklyPeriods), this.teacherStatusLabel(r.status)]),
      ];
      downloadCsvDocument(this.datedReportCsvName('report-teacher-workload'), this.reportCsvMeta('reports.csvDocumentTitle.teacher'), rows);
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
    downloadCsvDocument(this.datedReportCsvName(`report-card-${this.reportCard.studentId}`), this.reportCsvMeta('reports.csvDocumentTitle.reportCard'), rows);
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
      case 'designer': this.loadReportDesignerData(); break;
      case 'insights':
        this.insightsWizardStep = 1;
        this.loadAnalyticsPack();
        break;
    }
  }

  loadReportDesignerData(): void {
    this.designerWizardStep = 1;
    this.reportService.listTemplates().subscribe(rows => {
      this.reportTemplates = rows ?? [];
      if (this.selectedTemplateId == null && this.reportTemplates[0]?.id != null) {
        this.selectedTemplateId = this.reportTemplates[0].id!;
      }
      if (this.reportTemplates.length) {
        this.applyTemplateSelection(this.reportTemplates.find(x => x.id === this.selectedTemplateId) ?? this.reportTemplates[0]);
      }
    });
    this.loadReportJobs();
  }

  loadReportJobs(): void {
    this.reportService.listGeneratedReports(0, 20).subscribe(page => {
      this.reportJobs = page.content ?? [];
    });
  }

  generateDesignerReport(): void {
    if (!this.canGenerateDesignerReport) {
      return;
    }
    const filters: Record<string, unknown> = {};
    if (this.designerClassId != null) filters['classId'] = this.designerClassId;
    if (this.designerSectionId != null) filters['sectionId'] = this.designerSectionId;
    if (this.designerExamId != null) filters['examId'] = this.designerExamId;
    if (this.designerStudentId != null) filters['studentId'] = this.designerStudentId;
    if (this.designerMonth) filters['month'] = this.designerMonth;
    this.confirmDialog
      .confirm({
        title: 'Generate this report batch?',
        message: 'A generation job will be created using your selected format, filters, and sharing setup.',
        details: [
          `Type: ${this.reportTypeLabel(this.designerReportType)}`,
          `Format: ${this.designerFormat}`,
          `Schedule: ${this.designerScheduleAt ? this.designerScheduleAt : 'Run immediately'}`,
        ],
        confirmLabel: 'Generate report',
        cancelLabel: 'Review setup',
        variant: 'primary',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService
          .generateReport({
            templateId: this.selectedTemplateId,
            reportType: this.designerReportType,
            format: this.designerFormat,
            requestId: `ui-${Date.now()}`,
            scheduleAt: this.designerScheduleAt ? this.toApiLocalDateTime(this.designerScheduleAt) : undefined,
            shareConfig: {
              channels: this.designerShareChannels.length ? this.designerShareChannels : ['IN_APP'],
              targetRoles: this.designerShareRoles.length ? this.designerShareRoles : ['PARENT', 'TEACHER', 'ADMIN'],
              locales: this.designerShareLocales.length ? this.designerShareLocales : ['en'],
              templateCode: 'REPORT_SHARED_DEFAULT',
            },
            filters,
          })
          .subscribe(() => this.loadReportJobs());
      });
  }

  nextDesignerStep(): void {
    if (this.designerWizardStep >= 3) return;
    this.designerWizardStep += 1;
  }

  previousDesignerStep(): void {
    if (this.designerWizardStep <= 1) return;
    this.designerWizardStep -= 1;
  }

  onDesignerTemplateChange(): void {
    const selected = this.reportTemplates.find(x => x.id === this.selectedTemplateId);
    if (selected) {
      this.applyTemplateSelection(selected);
    }
  }

  nextInsightsStep(): void {
    if (this.insightsWizardStep >= 3) return;
    this.insightsWizardStep += 1;
  }

  previousInsightsStep(): void {
    if (this.insightsWizardStep <= 1) return;
    this.insightsWizardStep -= 1;
  }

  downloadReportJob(job: ReportGenerationJob): void {
    this.reportService.downloadGeneratedReport(job.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = job.fileName || `report-${job.id}.${(job.format || 'pdf').toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  retryReportJob(job: ReportGenerationJob): void {
    this.reportService.retryReportJob(job.id).subscribe(() => this.loadReportJobs());
  }

  loadDispatchesForJob(job: ReportGenerationJob): void {
    this.selectedDispatchJobId = job.id;
    this.reportService.listDispatches(job.id, 0, 20).subscribe(p => (this.dispatchRows = p.content ?? []));
  }

  approveReportJob(job: ReportGenerationJob): void {
    this.confirmDialog
      .confirm({
        title: 'Approve this generated report?',
        message: 'Approving confirms report quality and allows publishing to stakeholders.',
        details: [
          `Job #${job.id} (${this.reportTypeLabel(job.reportType)})`,
          `Current state: ${job.workflowState || 'DRAFT'}`,
        ],
        confirmLabel: 'Approve report',
        cancelLabel: 'Cancel',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService
          .approveReportJob(job.id, {
            note: 'Approved by report reviewer',
            idempotencyKey: this.buildIdempotencyKey('approve', job),
            expectedUpdatedAt: job.updatedAt,
          })
          .subscribe(() => this.loadReportJobs());
      });
  }

  publishReportJob(job: ReportGenerationJob): void {
    this.confirmDialog
      .confirm({
        title: 'Publish this report now?',
        message: 'Publishing makes this approved report available to configured audiences.',
        details: [
          `Job #${job.id} (${this.reportTypeLabel(job.reportType)})`,
          'Stakeholders may receive this via selected channels.',
        ],
        confirmLabel: 'Publish report',
        cancelLabel: 'Not yet',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService
          .publishReportJob(job.id, {
            note: 'Published for stakeholder access',
            idempotencyKey: this.buildIdempotencyKey('publish', job),
            expectedUpdatedAt: job.updatedAt,
          })
          .subscribe(() => this.loadReportJobs());
      });
  }

  loadSnapshotsForJob(job: ReportGenerationJob): void {
    this.selectedSnapshotJobId = job.id;
    this.reportService.listPublicationSnapshots(job.id).subscribe(rows => (this.snapshotRows = rows ?? []));
  }

  loadWorkflowEventsForJob(job: ReportGenerationJob): void {
    this.selectedEventJobId = job.id;
    this.reportService.listWorkflowEvents(job.id, 0, 30).subscribe(page => (this.workflowEvents = page.content ?? []));
  }

  rollbackSnapshot(snap: ReportPublicationSnapshot): void {
    if (this.selectedSnapshotJobId == null) return;
    this.confirmDialog
      .confirm({
        title: `Rollback to version ${snap.versionNo}?`,
        message: 'This will restore a previously published snapshot as the current live version.',
        details: [
          `Job #${this.selectedSnapshotJobId}`,
          'Current live output will be replaced by the selected version.',
        ],
        confirmLabel: 'Rollback version',
        cancelLabel: 'Cancel',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService.rollbackToSnapshot(this.selectedSnapshotJobId!, snap.versionNo, 'Rollback from UI').subscribe(() => {
          this.loadReportJobs();
          this.loadSnapshotsForJob({ id: this.selectedSnapshotJobId } as ReportGenerationJob);
        });
      });
  }

  loadAnalyticsPack(): void {
    if (this.tab === 'insights' && !this.canRunInsights) {
      return;
    }
    this.reportService
      .getAnalyticsPack({
        packCode: this.analyticsPackCode,
        classId: this.designerClassId,
        sectionId: this.designerSectionId,
        examId: this.designerExamId,
        month: this.designerMonth,
      })
      .subscribe(pack => {
        this.analyticsPack = pack;
        const g = (pack?.guardrails ?? {}) as Record<string, unknown>;
        this.guardrailExcellentPct = Number(g['excellentPct'] ?? this.guardrailExcellentPct);
        this.guardrailLaggingPct = Number(g['laggingPct'] ?? this.guardrailLaggingPct);
        this.guardrailPromotionMinAttendance = Number(g['promotionMinAttendance'] ?? this.guardrailPromotionMinAttendance);
        this.guardrailPromotionFormula = String(g['promotionFormula'] ?? this.guardrailPromotionFormula);
      });
    this.reportService.listAnalyticsPackConfigs().subscribe(rows => (this.analyticsConfigs = rows ?? []));
  }

  saveAnalyticsConfig(): void {
    this.confirmDialog
      .confirm({
        title: 'Save insights guardrails?',
        message: 'This updates thresholds and promotion formula used by report analytics.',
        details: [
          `Pack: ${this.analyticsPackCode}`,
          `Excellent threshold: ${this.guardrailExcellentPct}%`,
          `Lagging threshold: ${this.guardrailLaggingPct}%`,
          `Min attendance: ${this.guardrailPromotionMinAttendance}%`,
        ],
        confirmLabel: 'Save guardrails',
        cancelLabel: 'Continue editing',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService
          .upsertAnalyticsPackConfig({
            packCode: this.analyticsPackCode,
            config: {
              excellentPct: this.guardrailExcellentPct,
              laggingPct: this.guardrailLaggingPct,
              promotionMinAttendance: this.guardrailPromotionMinAttendance,
            },
            formulas: {
              promotionFormula: this.guardrailPromotionFormula,
            },
          })
          .subscribe(() => this.loadAnalyticsPack());
      });
  }

  saveTemplateDraft(): void {
    const payload: ReportTemplateDefinition = {
      ...this.templateDraft,
      reportType: this.designerReportType,
      defaultFormat: this.designerFormat,
      boardSections: this.csvList(this.templateSectionsCsv).map((name, idx) => ({ name, order: idx + 1 })),
      remarksConfig: { enabled: true, mode: 'TEACHER_REMARK' },
      promotionConfig: { enabled: true, minOverallPct: Number(this.templatePromotionMinPct || 0) },
      layoutConfig: {
        columns: this.csvList(this.templateColumnsCsv),
      },
      filterSchema: {
        required: ['classId', 'examId'],
      },
    };
    this.confirmDialog
      .confirm({
        title: 'Save report template draft?',
        message: 'This updates the template definition used by future report generation jobs.',
        details: [
          `Template code: ${payload.templateCode || '-'}`,
          `Template name: ${payload.name || '-'}`,
          `Default format: ${payload.defaultFormat || '-'}`,
        ],
        confirmLabel: 'Save template',
        cancelLabel: 'Review template',
        variant: 'primary',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService.upsertTemplate(payload).subscribe(() => this.loadReportDesignerData());
      });
  }

  seedDefaultReportPacks(): void {
    this.confirmDialog
      .confirm({
        title: 'Seed default report packs?',
        message: 'This will add or refresh default board report packs (CBSE, ICSE, State).',
        details: [
          'Useful when starting setup or restoring baseline templates.',
          'Custom templates remain available for further editing.',
        ],
        confirmLabel: 'Seed packs',
        cancelLabel: 'Cancel',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportService.seedDefaultReportPacks().subscribe(() => this.loadReportDesignerData());
      });
  }

  private applyTemplateSelection(template: ReportTemplateDefinition): void {
    this.templateDraft = { ...template };
    const cols = (template.layoutConfig?.['columns'] as string[] | undefined) ?? [];
    this.templateColumnsCsv = cols.join(',');
    const sections = (template.boardSections ?? []).map(x => String(x['name'] ?? '')).filter(Boolean);
    if (sections.length) this.templateSectionsCsv = sections.join(',');
    const minPct = template.promotionConfig?.['minOverallPct'];
    this.templatePromotionMinPct = Number(minPct ?? this.templatePromotionMinPct);
  }

  private csvList(raw: string): string[] {
    return String(raw || '')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
  }

  private toApiLocalDateTime(raw: string): string {
    return raw.length === 16 ? `${raw}:00` : raw;
  }

  private buildIdempotencyKey(action: 'approve' | 'publish', job: ReportGenerationJob): string {
    const stamp = Date.now();
    const base = `${action}-${job.id}-${job.workflowState || 'DRAFT'}-${stamp}`;
    return base.slice(0, 120);
  }

  private sectionsForClass(classId: number | null): Section[] {
    if (classId == null) {
      return [];
    }
    return this.classes.find(cls => cls.id === classId)?.sections ?? [];
  }

  private humanizeReportCardKey(key: string): string {
    return String(key ?? '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private humanizeReportCardValue(value: unknown): string {
    if (value == null) {
      return '—';
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private normalizeReportLocale(raw: string | undefined): string {
    const normalized = String(raw || 'en').trim().toLowerCase();
    return normalized.startsWith('hi') ? 'hi' : 'en';
  }
}
