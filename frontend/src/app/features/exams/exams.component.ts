import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicService } from '../../core/services/academic.service';
import { ExamService } from '../../core/services/exam.service';
import { ParentService } from '../../core/services/parent.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { runtimeConfig } from '../../core/config/runtime-config';
import { forkJoin } from 'rxjs';
import { skip } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { formatSchoolClassDisplayName } from '../../core/i18n/school-class-display';
import {
  AcademicYear,
  Exam,
  ExamClassScope,
  ExamScheduleSlot,
  MarkRecord,
  MarksEntryScopeRow,
  SchoolClass,
  Student,
  ExamTemplate,
  ExamModuleConfigHistoryItem,
  ExamModuleConfigKey,
  SubjectCatalogItem
} from '../../core/models/models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ExamsFacade } from './exams.facade';
import { ExamShellComponent } from './components/exam-shell.component';
import { ExamMarksEntryComponent } from './components/exam-marks-entry.component';
import { ExamTimetableEditorComponent } from './components/exam-timetable-editor.component';
import { ExamConfigEngineComponent } from './components/exam-config-engine.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

type ExamDetailTab = 'marks' | 'timetable';
type ExamWizardStep = 1 | 2 | 3 | 4;
type ReportSectionLayout = 'table' | 'list' | 'badges' | 'remarks';
type ExamListFilterCode = 'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'APPROVED' | 'FROZEN' | 'PUBLISHED';

interface ReportCardFieldDraft {
  key: string;
  label: string;
  format: string;
  visible: boolean;
  order: number;
}

interface ReportCardSectionDraft {
  key: string;
  title: string;
  layout: ReportSectionLayout;
  fields: ReportCardFieldDraft[];
}

/** Grid order: completed → ongoing → upcoming → cancelled (parents/staff see finished work first). */
function examGridStatusSortRank(status: string | undefined): number {
  const s = (status ?? '').toLowerCase();
  if (s === 'completed') return 0;
  if (s === 'ongoing') return 1;
  if (s === 'upcoming') return 2;
  if (s === 'cancelled') return 3;
  return 4;
}

function compareExamsForGrid(a: Exam, b: Exam): number {
  const ra = examGridStatusSortRank(a.status);
  const rb = examGridStatusSortRank(b.status);
  if (ra !== rb) return ra - rb;
  const st = (a.status ?? '').toLowerCase();
  if (st === 'upcoming') {
    return (a.startDate || '').localeCompare(b.startDate || '') || (a.name || '').localeCompare(b.name || '');
  }
  return (b.endDate || '').localeCompare(a.endDate || '') || (a.name || '').localeCompare(b.name || '');
}

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ErpDatePickerComponent,
    ErpPaginationComponent,
    TranslateModule,
    SchoolClassNamePipe,
    ErpI18nPhDirective,
    ErpI18nTextDirective,
    ExamShellComponent,
    ExamMarksEntryComponent,
    ExamTimetableEditorComponent,
    ExamConfigEngineComponent,
  ],
  template: `
    <app-exam-shell>
    <div data-testid="exams-page">
      <div class="erp-filter-toolbar mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'exams.pageTitle' | translate }}</h2>
          <p *ngIf="role === 'parent' && parentExamUnreadCount > 0" class="small mb-1 text-primary">
            {{ parentExamUnreadCount }} exam update(s) unread
          </p>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="role !== 'parent'">
            {{ 'exams.leadStaffBefore' | translate }}<strong>{{ 'exams.leadStaffStrong1' | translate }}</strong
            >{{ 'exams.leadStaffMid' | translate }}<strong>{{ 'exams.leadStaffStrong2' | translate }}</strong
            >{{ 'exams.leadStaffAfter' | translate }}
            {{ canEditSchedule ? ('exams.leadStaffEdit' | translate) : ('exams.leadStaffView' | translate) }}
          </p>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="role === 'parent'">
            {{ 'exams.leadParentBefore' | translate }}<strong>{{ 'exams.leadParentStrong1' | translate }}</strong
            >{{ 'exams.leadParentMid' | translate }}<strong>{{ 'exams.leadParentStrong2' | translate }}</strong
            >{{ 'exams.leadParentAfter' | translate }}<strong>{{ 'exams.leadParentStrong3' | translate }}</strong
            >{{ 'exams.leadParentMid2' | translate }}<strong>{{ 'exams.leadParentStrong4' | translate }}</strong
            >{{ 'exams.leadParentEnd' | translate }}<strong>{{ 'exams.leadParentStrong5' | translate }}</strong
            >{{ 'exams.leadParentTail' | translate }}
          </p>
        </div>
        <div class="erp-filter-toolbar__actions">
          <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="refreshExams()">
            <i class="bi bi-arrow-clockwise"></i> {{ 'exams.refresh' | translate }}
          </button>
          <button *ngIf="canConfigureEngine" type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="openConfigModal()">
            <i class="bi bi-sliders"></i> {{ 'exams.configureEngine' | translate }}
          </button>
          <button *ngIf="canCreateExam" type="button" class="btn-primary-erp btn-sm erp-filter-toolbar__action" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i> {{ 'exams.createExam' | translate }}
          </button>
        </div>
      </div>

      <div class="erp-card mb-3 animate-in animate-in-delay-1" *ngIf="role === 'parent'">
        <div class="row g-3 align-items-end">
          <div class="col-md-8">
            <label class="erp-label">{{ 'exams.labelChild' | translate }}</label>
            <select
              class="erp-select"
              [(ngModel)]="selectedParentChildId"
              (change)="onParentChildChangeForExams()"
              [disabled]="!parentChildren.length"
            >
              <option [ngValue]="null" *ngIf="parentChildren.length > 1">{{ 'exams.selectChild' | translate }}</option>
              <option *ngFor="let c of parentChildren" [ngValue]="c.id">
                {{ c.firstName }} {{ c.lastName }} — {{ childClassDisplay(c) }}
              </option>
            </select>
          </div>
          <p class="text-muted small col-12 mb-0">{{ 'exams.parentHelp' | translate }}</p>
          <p *ngIf="!parentChildren.length" class="text-warning small col-12 mb-0">{{ 'exams.noChildrenLinked' | translate }}</p>
        </div>
      </div>

      <div class="erp-card mb-3 animate-in animate-in-delay-1" *ngIf="role !== 'parent' && staffUsesServerPaging">
        <div class="erp-filter-toolbar exams-list-toolbar">
          <div class="exams-list-toolbar__search">
              <label class="erp-label">{{ 'exams.listSearch' | translate }}</label>
              <input
                type="search"
                class="erp-input"
                [(ngModel)]="staffExamSearch"
                (ngModelChange)="onStaffExamSearchChange()"
                [attr.placeholder]="'exams.listSearchPh' | translate"
              />
          </div>
          <div class="exams-list-toolbar__filter">
              <label class="erp-label">{{ 'exams.listFilterBy' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedExamListFilter" (ngModelChange)="onStaffExamFilterChange()">
                <option *ngFor="let opt of examListFilterOptions" [ngValue]="opt.code">{{ opt.labelKey | translate }}</option>
              </select>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1" *ngIf="role !== 'parent' || selectedParentChildId != null">
        <div class="col-md-6 col-lg-3" *ngFor="let exam of examGridList">
          <div
            class="erp-card exam-card-pick h-100"
            [class.exam-card-pick--disabled]="role === 'parent' && !parentExamIsOpenable(exam)"
            [class.exam-card-active]="selectedExam?.id === exam.id"
            (click)="onExamCardClick(exam)"
          >
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h4 style="font-size: 15px; font-weight: 700;">{{ exam.name }}</h4>
              <div class="d-flex flex-column gap-1 align-items-end">
                <span class="badge-erp" [ngClass]="getExamBadge(exam.status)">{{ examStatusLabel(exam.status) }}</span>
                <span class="badge-erp badge-neutral">{{ examWorkflowLabel(exam.workflowState) }}</span>
                <span *ngIf="isFrozenWorkflow(exam.workflowState)" class="small text-muted" title="Frozen = locked, no further edits allowed.">
                  Frozen = locked, no further edits allowed.
                </span>
              </div>
            </div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">
              <div><i class="bi bi-calendar3 me-1"></i>{{ exam.startDate }} → {{ exam.endDate }}</div>
              <div class="mt-1"><i class="bi bi-people me-1"></i>{{ scopeSummary(exam) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1" *ngIf="role === 'parent' && selectedParentChildId != null && parentChildLoading">
        <div class="col-md-6 col-lg-3" *ngFor="let i of [1,2,3,4]">
          <div class="erp-card exam-card-skeleton h-100">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-pill"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-short"></div>
          </div>
        </div>
      </div>

      <app-erp-pagination
        *ngIf="role !== 'parent' && staffUsesServerPaging && staffExamTotal > 0"
        class="d-block mb-4"
        [totalElements]="staffExamTotal"
        [pageIndex]="staffExamPageIndex"
        [pageSize]="staffExamPageSize"
        (pageIndexChange)="onStaffExamPageIndexChange($event)"
        (pageSizeChange)="onStaffExamPageSizeChange($event)"
      />

      <div *ngIf="role === 'parent' && parentChildren.length && selectedParentChildId == null" class="erp-card mb-4 animate-in text-muted small">
        {{ 'exams.pickChildPrompt' | translate }}
      </div>

      <div *ngIf="role === 'parent' && selectedParentChildId != null && !parentChildLoading && !examGridList.length" class="erp-card mb-4 animate-in empty-state">
        <h3>{{ 'exams.noExamsChildTitle' | translate }}</h3>
        <p class="small mb-0 text-muted">{{ 'exams.noExamsChildLead' | translate }}</p>
      </div>

      <div *ngIf="selectedExam" class="erp-card animate-in animate-in-delay-2 mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h3 class="erp-card-title mb-1">{{ selectedExam.name }}</h3>
            <p class="text-muted small mb-0">{{ scopeSummary(selectedExam) }}</p>
          </div>
          <div class="erp-tabs" style="margin: 0;" *ngIf="role === 'parent'">
            <button type="button" class="erp-tab" [class.active]="parentDetailTab === 'timetable'" (click)="parentDetailTab = 'timetable'">{{ 'exams.tabTimetable' | translate }}</button>
            <button
              type="button"
              class="erp-tab"
              [class.active]="parentDetailTab === 'results'"
              (click)="parentDetailTab = 'results'"
            >
              {{ 'exams.tabResults' | translate }}
            </button>
          </div>
          <div class="erp-tabs" style="margin: 0;" *ngIf="canEnterMarks">
            <button type="button" class="erp-tab" [class.active]="detailTab === 'marks'" (click)="detailTab = 'marks'">{{ 'exams.tabMarks' | translate }}</button>
            <button type="button" class="erp-tab" [class.active]="detailTab === 'timetable'" (click)="onTimetableTab()">{{ 'exams.tabTimetable' | translate }}</button>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-3" *ngIf="selectedExam && role !== 'parent'">
          <span class="badge-erp badge-neutral">{{ examWorkflowLabel(selectedExam.workflowState) }}</span>
          <span *ngIf="isFrozenWorkflow(selectedExam.workflowState)" class="small text-muted" title="Frozen = locked, no further edits allowed.">
            Frozen = locked, no further edits allowed.
          </span>
          <button *ngIf="canEditExamMeta" type="button" class="btn-outline-erp btn-sm" (click)="openEditModal(selectedExam)">
            <i class="bi bi-pencil-square"></i> {{ 'exams.editExam' | translate }}
          </button>
          <button *ngIf="canSubmitForApproval(selectedExam)" type="button" class="btn-outline-erp btn-sm" (click)="submitSelectedExamForApproval()">
            {{ 'exams.submitApproval' | translate }}
          </button>
          <button *ngIf="canApproveWorkflow(selectedExam)" type="button" class="btn-primary-erp btn-sm" (click)="approveSelectedExam(false)">
            {{ 'exams.approve' | translate }}
          </button>
          <button *ngIf="canApproveWorkflow(selectedExam)" type="button" class="btn-outline-erp btn-sm" (click)="approveSelectedExam(true)">
            {{ 'exams.approvePublish' | translate }}
          </button>
          <button *ngIf="canApproveWorkflow(selectedExam)" type="button" class="btn-outline-erp btn-sm text-danger" (click)="rejectSelectedExam()">
            {{ 'exams.reject' | translate }}
          </button>
          <button *ngIf="canFreezeWorkflow(selectedExam)" type="button" class="btn-outline-erp btn-sm" (click)="freezeSelectedExam()">
            {{ 'exams.freeze' | translate }}
          </button>
          <span class="small text-muted" *ngIf="selectedExam.workflowNote">{{ selectedExam.workflowNote }}</span>
        </div>

        <ng-container *ngIf="role === 'parent' && selectedExam && parentDetailTab === 'results'">
          <ng-container *ngIf="marks.length">
            <div class="row g-2 align-items-end mb-2">
              <div class="col-md-6">
                <label class="erp-label small mb-1" erpI18nText="exams.searchParentResults"></label>
                <input type="search" class="erp-input" erpI18nPh="exams.searchParentResultsPh" [(ngModel)]="parentResultsSearch" (ngModelChange)="onParentResultsSearchChange()" />
              </div>
              <div class="col-md-6 text-md-end">
                <button type="button" class="btn-outline-erp btn-sm" (click)="downloadParentReportCardPdf()">
                  <i class="bi bi-file-earmark-pdf"></i> Download report card PDF
                </button>
              </div>
            </div>
            <p *ngIf="!parentResultsFilteredTotal" class="text-muted small mb-2">{{ 'exams.noMatches' | translate }}</p>
            <div class="erp-table-scroll" *ngIf="parentResultsFilteredTotal">
            <table class="erp-table">
              <thead
                ><tr
                  ><th>{{ 'exams.thSubject' | translate }}</th
                  ><th>{{ 'exams.thMarks' | translate }}</th
                  ><th>{{ 'exams.thMax' | translate }}</th
                  ><th>{{ 'exams.thPct' | translate }}</th
                  ><th>{{ 'exams.thGrade' | translate }}</th></tr
                ></thead
              >
              <tbody>
                <tr *ngFor="let mark of pagedParentMarks">
                  <td><strong>{{ mark.subjectName }}</strong></td>
                  <td>{{ mark.marksObtained }}</td>
                  <td>{{ mark.maxMarks }}</td>
                  <td>{{ ((mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100).toFixed(1) }}%</td>
                  <td><span class="badge-erp" [ngClass]="getGradeBadge(mark.grade)">{{ mark.grade }}</span></td>
                </tr>
              </tbody>
            </table>
            </div>
            <app-erp-pagination
              *ngIf="parentResultsFilteredTotal > parentResultsPageSize"
              class="d-block mt-2"
              [totalElements]="parentResultsFilteredTotal"
              [pageIndex]="parentResultsPageIndex"
              [pageSize]="parentResultsPageSize"
              (pageIndexChange)="onParentResultsPageIndex($event)"
              (pageSizeChange)="onParentResultsPageSize($event)"
            />
          </ng-container>
          <p *ngIf="!marks.length" class="text-muted small mb-0">{{ 'exams.noMarkRows' | translate }}</p>
        </ng-container>

        <app-exam-marks-entry *ngIf="detailTab === 'marks' && canEnterMarks">
          <div class="row g-3 align-items-end mb-3">
            <div class="col-md-4">
              <label class="erp-label">{{ 'exams.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassOrSectionChange()">
                <option [ngValue]="null">{{ 'exams.selectClass' | translate }}</option>
                <option *ngFor="let cls of marksClassOptions" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-4" *ngIf="sectionsForMarksEntry.length">
              <label class="erp-label">{{ 'exams.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="marksSectionId" (change)="onClassOrSectionChange()">
                <option [ngValue]="null">{{ 'exams.allSectionsInClass' | translate }}</option>
                <option *ngFor="let sec of sectionsForMarksEntry" [ngValue]="sec.id">{{ sec.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'exams.labelSubject' | translate }}</label>
              <select class="erp-select" [(ngModel)]="marksSubject" [disabled]="!marksSubjectOptions.length">
                <option value="">{{ 'exams.selectSubject' | translate }}</option>
                <option *ngFor="let s of marksSubjectOptions" [ngValue]="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'exams.labelMaxMarks' | translate }}</label>
              <input class="erp-input" type="number" [(ngModel)]="maxMarks" />
            </div>
          </div>
          <p *ngIf="sectionHint" class="small text-muted mb-2">{{ sectionHint }}</p>
          <div *ngIf="teacherMarksScopeActive && marksScopeRows.length" class="erp-alert info small mb-3" style="padding: 10px 12px;">
            <strong>{{ 'exams.scopeTitle' | translate }}</strong> {{ 'exams.scopeFrom' | translate }}
            <span *ngFor="let r of marksScopeRows; let last = last" class="ms-1">
              {{ className(r.classId)
              }}<ng-container *ngIf="r.sectionId != null"> · {{ 'exams.scopeSec' | translate }} {{ sectionName(r.classId, r.sectionId) }}</ng-container> ·
              {{ r.subjectName }}<span *ngIf="!last">;</span>
            </span>
          </div>
          <p *ngIf="marksScopeError" class="small text-warning mb-2">{{ marksScopeError }}</p>

          <div *ngIf="marksEntryStudents.length > 0" class="mb-4">
            <div class="row g-2 align-items-end mb-2">
              <div class="col-md-6">
                <label class="erp-label small mb-1" erpI18nText="exams.searchMarksEntry"></label>
                <input type="search" class="erp-input" erpI18nPh="exams.searchMarksEntryPh" [(ngModel)]="entrySearch" (ngModelChange)="onEntrySearchChange()" />
              </div>
            </div>
            <p *ngIf="!entryFilteredTotal" class="text-muted small mb-2">{{ 'exams.noMatches' | translate }}</p>
            <div class="erp-table-scroll" *ngIf="entryFilteredTotal">
            <table class="erp-table">
              <thead
                ><tr
                  ><th>{{ 'exams.thStudent' | translate }}</th
                  ><th>{{ 'exams.thRoll' | translate }}</th
                  ><th>{{ 'exams.thMarks' | translate }}</th
                  ><th>{{ 'exams.thGrade' | translate }}</th></tr
                ></thead
              >
              <tbody>
                <tr *ngFor="let student of pagedMarksEntryStudents">
                  <td><strong>{{ student.firstName }} {{ student.lastName }}</strong></td>
                  <td>{{ student.rollNumber }}</td>
                  <td><input class="erp-input" type="number" min="0" [max]="maxMarks" [(ngModel)]="marksByStudent[student.id]" /></td>
                  <td>{{ getAutoGrade(getDraftMark(student.id), maxMarks) }}</td>
                </tr>
              </tbody>
            </table>
            </div>
            <app-erp-pagination
              *ngIf="entryFilteredTotal > entryPageSize"
              class="d-block mt-2"
              [totalElements]="entryFilteredTotal"
              [pageIndex]="entryPageIndex"
              [pageSize]="entryPageSize"
              (pageIndexChange)="onEntryPageIndex($event)"
              (pageSizeChange)="onEntryPageSize($event)"
            />
            <div class="d-flex justify-content-end mt-3">
              <button type="button" class="btn-primary-erp" (click)="saveMarks()" [disabled]="!marksSubject || selectedClassId == null || marksSaving">
                {{ marksSaving ? ('exams.marksSaving' | translate) : ('exams.saveMarks' | translate) }}
              </button>
            </div>
          </div>

          <div *ngIf="marks.length > 0">
            <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">{{ 'exams.recordedResults' | translate }}</h4>
            <div class="row g-2 align-items-end mb-2">
              <div class="col-md-6">
                <label class="erp-label small mb-1" erpI18nText="exams.searchRecorded"></label>
                <input type="search" class="erp-input" erpI18nPh="exams.searchRecordedPh" [(ngModel)]="recordedSearch" (ngModelChange)="onRecordedSearchChange()" />
              </div>
            </div>
            <p *ngIf="!recordedFilteredTotal" class="text-muted small mb-2">{{ 'exams.noMatches' | translate }}</p>
            <div class="erp-table-scroll" *ngIf="recordedFilteredTotal">
            <table class="erp-table">
              <thead
                ><tr
                  ><th>{{ 'exams.thStudent' | translate }}</th
                  ><th>{{ 'exams.thSubject' | translate }}</th
                  ><th>{{ 'exams.thMarks' | translate }}</th
                  ><th>{{ 'exams.thMax' | translate }}</th
                  ><th>{{ 'exams.thPct' | translate }}</th
                  ><th>{{ 'exams.thGrade' | translate }}</th></tr
                ></thead
              >
              <tbody>
                <tr *ngFor="let mark of pagedRecordedMarks">
                  <td><strong>{{ mark.studentName }}</strong></td>
                  <td>{{ mark.subjectName }}</td>
                  <td>{{ mark.marksObtained }}</td>
                  <td>{{ mark.maxMarks }}</td>
                  <td>{{ ((mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100).toFixed(1) }}%</td>
                  <td><span class="badge-erp" [ngClass]="getGradeBadge(mark.grade)">{{ mark.grade }}</span></td>
                </tr>
              </tbody>
            </table>
            </div>
            <app-erp-pagination
              *ngIf="recordedFilteredTotal > recordedPageSize"
              class="d-block mt-2"
              [totalElements]="recordedFilteredTotal"
              [pageIndex]="recordedPageIndex"
              [pageSize]="recordedPageSize"
              (pageIndexChange)="onRecordedPageIndex($event)"
              (pageSizeChange)="onRecordedPageSize($event)"
            />
          </div>
        </app-exam-marks-entry>

        <app-exam-timetable-editor *ngIf="role === 'parent' && parentDetailTab === 'timetable'">
          <p class="text-muted small mb-3">{{ 'exams.parentTimetableLead' | translate }}</p>
          <div class="erp-table-scroll mb-3" *ngIf="scheduleDraft.length">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>{{ 'exams.thDate' | translate }}</th
                  ><th>{{ 'exams.thStart' | translate }}</th
                  ><th>{{ 'exams.thEnd' | translate }}</th
                  ><th>{{ 'exams.thSubject' | translate }}</th
                  ><th>{{ 'exams.thPaperType' | translate }}</th
                  ><th>{{ 'exams.thClass' | translate }}</th
                  ><th>{{ 'exams.thSection' | translate }}</th
                  ><th>{{ 'exams.thInvigilator' | translate }}</th
                  ><th>{{ 'exams.thRoom' | translate }}</th
                  ><th>{{ 'exams.thNotes' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of pagedScheduleDraft">
                  <td>{{ row.examDate }}</td>
                  <td>{{ formatSlotTime(row.startTime) }}</td>
                  <td>{{ formatSlotTime(row.endTime) }}</td>
                  <td><strong>{{ row.subjectName }}</strong></td>
                  <td>{{ row.paperType?.trim() ? row.paperType : ('exams.dash' | translate) }}</td>
                  <td>{{ className(row.classId) }}</td>
                  <td>{{ row.sectionId != null ? sectionName(row.classId, row.sectionId) : ('exams.sectionAll' | translate) }}</td>
                  <td>{{ row.invigilatorName?.trim() ? row.invigilatorName : ('exams.dash' | translate) }}</td>
                  <td>{{ row.room?.trim() ? row.room : ('exams.dash' | translate) }}</td>
                  <td>{{ row.notes?.trim() ? row.notes : ('exams.dash' | translate) }}</td>
                </tr>
              </tbody>
            </table>
            <app-erp-pagination
              *ngIf="scheduleListTotal > schedulePageSize"
              class="d-block mt-2"
              [totalElements]="scheduleListTotal"
              [pageIndex]="schedulePageIndex"
              [pageSize]="schedulePageSize"
              (pageIndexChange)="onSchedulePageIndex($event)"
              (pageSizeChange)="onSchedulePageSize($event)"
            />
          </div>
          <p *ngIf="scheduleUiMessage && scheduleDraft.length === 0" class="small mb-2" [class.text-danger]="scheduleUiError">{{ scheduleUiMessage }}</p>
          <p *ngIf="!scheduleDraft.length" class="text-muted small mb-0">{{ 'exams.noTimetableYet' | translate }}</p>
        </app-exam-timetable-editor>

        <app-exam-timetable-editor *ngIf="role !== 'parent' && detailTab === 'timetable'">
          <p class="text-muted small mb-3">{{ 'exams.staffTimetableLead' | translate }}</p>
          <div class="erp-table-scroll mb-3" *ngIf="scheduleDraft.length || canEditSchedule">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>{{ 'exams.thDate' | translate }}</th
                  ><th>{{ 'exams.thStart' | translate }}</th
                  ><th>{{ 'exams.thEnd' | translate }}</th
                  ><th>{{ 'exams.thSubject' | translate }}</th
                  ><th>{{ 'exams.thPaperType' | translate }}</th
                  ><th>{{ 'exams.thClass' | translate }}</th
                  ><th>{{ 'exams.thSection' | translate }}</th
                  ><th>{{ 'exams.thInvigilator' | translate }}</th
                  ><th>{{ 'exams.thRoom' | translate }}</th
                  ><th>{{ 'exams.thNotes' | translate }}</th>
                  <th *ngIf="canEditSchedule"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of pagedScheduleDraft; let i = index">
                  <td
                    ><app-erp-date-picker
                      [(ngModel)]="row.examDate"
                      [ngModelOptions]="{ standalone: true }"
                      [disabled]="!canEditSchedule"
                      placeholderI18nKey="exams.examDatePh"
                  /></td>
                  <td><input type="time" class="erp-input" [(ngModel)]="row.startTime" [disabled]="!canEditSchedule" /></td>
                  <td><input type="time" class="erp-input" [(ngModel)]="row.endTime" [disabled]="!canEditSchedule" /></td>
                  <td>
                    <select class="erp-select" [(ngModel)]="row.subjectName" [disabled]="!canEditSchedule">
                      <option value="">{{ 'exams.selectSubject' | translate }}</option>
                      <option *ngFor="let subject of scheduleSubjectOptions(row)" [ngValue]="subject">{{ subject }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="erp-select" [(ngModel)]="row.paperType" [disabled]="!canEditSchedule">
                      <option value="">{{ 'exams.dash' | translate }}</option>
                      <option *ngFor="let paperType of schedulePaperTypeOptionsForRow(row)" [ngValue]="paperType">{{ paperType }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="erp-select" [(ngModel)]="row.classId" (change)="onScheduleRowClass(row)" [disabled]="!canEditSchedule">
                      <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name | schoolClassName }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="erp-select" [(ngModel)]="row.sectionId" [disabled]="!canEditSchedule">
                      <option [ngValue]="null">{{ 'exams.allSections' | translate }}</option>
                      <option *ngFor="let s of sectionsForClass(row.classId)" [ngValue]="s.id">{{ s.name }}</option>
                    </select>
                  </td>
                  <td><input class="erp-input" [(ngModel)]="row.invigilatorName" [disabled]="!canEditSchedule" /></td>
                  <td><input class="erp-input" [(ngModel)]="row.room" [disabled]="!canEditSchedule" /></td>
                  <td><input class="erp-input" [(ngModel)]="row.notes" [disabled]="!canEditSchedule" /></td>
                  <td *ngIf="canEditSchedule">
                    <button type="button" class="btn-icon" (click)="removeScheduleRowPaged(i)" [title]="'exams.removeRowTitle' | translate"><i class="bi bi-x-lg"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <app-erp-pagination
              *ngIf="scheduleListTotal > schedulePageSize"
              class="d-block mt-2"
              [totalElements]="scheduleListTotal"
              [pageIndex]="schedulePageIndex"
              [pageSize]="schedulePageSize"
              (pageIndexChange)="onSchedulePageIndex($event)"
              (pageSizeChange)="onSchedulePageSize($event)"
            />
          </div>
          <div class="d-flex gap-2 flex-wrap" *ngIf="canEditSchedule">
            <button type="button" class="btn-outline-erp btn-sm" (click)="addScheduleRow()"><i class="bi bi-plus-lg"></i> {{ 'exams.addSlot' | translate }}</button>
            <button type="button" class="btn-primary-erp btn-sm" (click)="saveSchedule()" [disabled]="scheduleSaving">{{ 'exams.saveTimetable' | translate }}</button>
          </div>
          <p *ngIf="scheduleUiMessage" class="small mt-2 mb-0" [class.text-danger]="scheduleUiError" [class.text-success]="!scheduleUiError">{{ scheduleUiMessage }}</p>
          <p *ngIf="!scheduleDraft.length && !canEditSchedule" class="text-muted small">{{ 'exams.noTimetableYet' | translate }}</p>
        </app-exam-timetable-editor>
      </div>
    </div>
    </app-exam-shell>

    <app-exam-config-engine>
    <div class="modal-overlay" *ngIf="showConfigModal" (click)="showConfigModal = false">
      <div class="modal-content-erp modal-lg exam-config-modal" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ 'exams.configTitle' | translate }}</h3>
          <button type="button" class="btn-icon" (click)="showConfigModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-3">{{ 'exams.configLead' | translate }}</p>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <button type="button" class="btn-outline-erp btn-sm" (click)="applyBoardPreset('CBSE')">{{ 'exams.boardPreset.cbse' | translate }}</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="applyBoardPreset('ICSE')">{{ 'exams.boardPreset.icse' | translate }}</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="applyBoardPreset('STATE')">{{ 'exams.boardPreset.state' | translate }}</button>
          </div>
          <div class="erp-form-group">
            <label class="erp-label">{{ 'exams.labelAcademicYear' | translate }}</label>
            <select class="erp-select" [(ngModel)]="configAcademicYearId" (ngModelChange)="onConfigYearChange()">
              <option [ngValue]="null">{{ 'exams.selectYear' | translate }}</option>
              <option *ngFor="let year of academicYears" [ngValue]="year.id">{{ year.name }}</option>
            </select>
          </div>
          <div class="erp-card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="mb-0">{{ 'exams.reportCardBuilderTitle' | translate }}</h4>
              <button type="button" class="btn-outline-erp btn-sm" (click)="addReportSection()">{{ 'exams.reportCardBuilderAddSection' | translate }}</button>
            </div>
            <p class="small text-muted mb-3">{{ 'exams.reportCardBuilderLead' | translate }}</p>
            <div *ngFor="let section of reportCardSectionsBuilder; let sIdx = index" class="builder-section mb-3">
              <div class="row g-2 align-items-end builder-section-head">
                <div class="col-12 col-lg-6 col-xl-3">
                  <label class="erp-label small">{{ 'exams.reportCardSectionKey' | translate }}</label>
                  <input class="erp-input" [(ngModel)]="section.key" />
                </div>
                <div class="col-12 col-lg-6 col-xl-3">
                  <label class="erp-label small">{{ 'exams.reportCardSectionTitle' | translate }}</label>
                  <input class="erp-input" [(ngModel)]="section.title" />
                </div>
                <div class="col-12 col-lg-6 col-xl-2">
                  <label class="erp-label small">{{ 'exams.reportCardSectionLayout' | translate }}</label>
                  <select class="erp-select" [(ngModel)]="section.layout">
                    <option value="table">{{ 'exams.reportLayout.table' | translate }}</option>
                    <option value="list">{{ 'exams.reportLayout.list' | translate }}</option>
                    <option value="badges">{{ 'exams.reportLayout.badges' | translate }}</option>
                    <option value="remarks">{{ 'exams.reportLayout.remarks' | translate }}</option>
                  </select>
                </div>
                <div class="col-12 col-lg-6 col-xl-4 d-flex gap-2 builder-actions">
                  <button type="button" class="btn-outline-erp btn-sm" (click)="moveReportSection(sIdx, -1)" [disabled]="sIdx === 0">↑</button>
                  <button type="button" class="btn-outline-erp btn-sm" (click)="moveReportSection(sIdx, 1)" [disabled]="sIdx === reportCardSectionsBuilder.length - 1">↓</button>
                  <button type="button" class="btn-outline-erp btn-sm" (click)="addReportField(sIdx)">{{ 'exams.reportCardBuilderAddField' | translate }}</button>
                  <button type="button" class="btn-outline-erp btn-sm text-danger" (click)="removeReportSection(sIdx)">{{ 'exams.removeRowTitle' | translate }}</button>
                </div>
              </div>
              <div *ngIf="section.fields.length" class="mt-2">
                <div *ngFor="let field of section.fields; let fIdx = index" class="row g-2 align-items-end mb-2 builder-field-row">
                  <div class="col-12 col-md-6 col-xl-2">
                    <label class="erp-label small">{{ 'exams.reportCardFieldKey' | translate }}</label>
                    <input class="erp-input" [(ngModel)]="field.key" />
                  </div>
                  <div class="col-12 col-md-6 col-xl-3">
                    <label class="erp-label small">{{ 'exams.reportCardFieldLabel' | translate }}</label>
                    <input class="erp-input" [(ngModel)]="field.label" />
                  </div>
                  <div class="col-12 col-md-6 col-xl-2">
                    <label class="erp-label small">{{ 'exams.reportCardFieldFormat' | translate }}</label>
                    <select class="erp-select" [(ngModel)]="field.format">
                      <option value="">{{ 'exams.reportFieldFormat.none' | translate }}</option>
                      <option value="percent">{{ 'exams.reportFieldFormat.percent' | translate }}</option>
                      <option value="number">{{ 'exams.reportFieldFormat.number' | translate }}</option>
                      <option value="currency_inr">{{ 'exams.reportFieldFormat.currencyInr' | translate }}</option>
                      <option value="title">{{ 'exams.reportFieldFormat.title' | translate }}</option>
                      <option value="uppercase">{{ 'exams.reportFieldFormat.uppercase' | translate }}</option>
                      <option value="lowercase">{{ 'exams.reportFieldFormat.lowercase' | translate }}</option>
                    </select>
                  </div>
                  <div class="col-6 col-md-3 col-xl-1">
                    <label class="erp-label small">{{ 'exams.reportCardFieldOrder' | translate }}</label>
                    <input type="number" class="erp-input" min="1" [(ngModel)]="field.order" />
                  </div>
                  <div class="col-6 col-md-3 col-xl-2 d-flex align-items-center">
                    <label class="d-flex align-items-center gap-2 builder-visible-toggle">
                      <input type="checkbox" [(ngModel)]="field.visible" />
                      <span>{{ 'exams.reportCardFieldVisible' | translate }}</span>
                    </label>
                  </div>
                  <div class="col-12 col-xl-2 d-flex justify-content-xl-end">
                    <button type="button" class="btn-outline-erp btn-sm text-danger" (click)="removeReportField(sIdx, fIdx)">{{ 'exams.removeRowTitle' | translate }}</button>
                  </div>
                  <div class="col-12" *ngIf="fieldErrorAt(sIdx, fIdx)">
                    <p class="small text-danger mb-0">{{ fieldErrorAt(sIdx, fIdx) }}</p>
                  </div>
                </div>
              </div>
              <p class="small text-danger mb-0" *ngIf="sectionErrorAt(sIdx)">{{ sectionErrorAt(sIdx) }}</p>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="toggleConfigAdvancedJson()">
              {{ showConfigAdvancedJson ? ('exams.hideAdvancedJson' | translate) : ('exams.showAdvancedJson' | translate) }}
            </button>
          </div>
          <div class="erp-card p-3 mb-3">
            <h4 class="mb-2">{{ 'exams.configPreviewTitle' | translate }}</h4>
            <p class="small text-muted mb-2">{{ 'exams.configPreviewLead' | translate }}</p>
            <div *ngIf="!showConfigAdvancedJson" class="small text-muted">
              <p class="mb-2">This preview is simplified for admins. Enable advanced mode to view full JSON.</p>
              <ul class="mb-0 ps-3">
                <li>Sections configured: {{ reportCardSectionsBuilder.length }}</li>
                <li>Passing threshold: {{ configFriendly.passPercent }}%</li>
                <li>Workflow approval: {{ configFriendly.requireApproval ? 'Required' : 'Not required' }}</li>
                <li>Auto-publish results: {{ configFriendly.autoPublishResults ? 'Enabled' : 'Disabled' }}</li>
              </ul>
            </div>
            <pre *ngIf="showConfigAdvancedJson" class="builder-preview-json">{{ reportCardPreviewJson }}</pre>
          </div>
          <div class="erp-card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="mb-0">{{ 'exams.configHistoryTitle' | translate }}</h4>
              <button type="button" class="btn-outline-erp btn-sm" (click)="loadConfigHistory()">{{ 'exams.refresh' | translate }}</button>
            </div>
            <p class="small text-muted mb-2">{{ 'exams.configHistoryLead' | translate }}</p>
            <div class="row g-2 mb-2">
              <div class="col-md-6">
                <label class="erp-label small">{{ 'exams.configHistoryCompareLeft' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedHistoryLeftVersion">
                  <option *ngFor="let h of configHistoryRows" [ngValue]="h.versionNo">
                    v{{ h.versionNo }} {{ h.createdAt || '' }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="erp-label small">{{ 'exams.configHistoryCompareRight' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedHistoryRightVersion">
                  <option *ngFor="let h of configHistoryRows" [ngValue]="h.versionNo">
                    v{{ h.versionNo }} {{ h.createdAt || '' }}
                  </option>
                </select>
              </div>
            </div>
            <p class="small text-muted mb-2" *ngIf="!configHistoryRows.length">{{ 'reports.noData' | translate }}</p>
            <div class="erp-card p-2 mb-2" *ngIf="selectedHistoryDiffSummary.length">
              <h5 class="mb-1">{{ 'exams.configHistoryChangeSummaryTitle' | translate }}</h5>
              <ul class="small mb-0 ps-3">
                <li *ngFor="let row of selectedHistoryDiffSummary">{{ row }}</li>
              </ul>
            </div>
            <div class="row g-2 mb-2" *ngIf="showConfigAdvancedJson">
              <div class="col-md-6">
                <label class="erp-label small">{{ 'exams.configHistoryCompareLeft' | translate }}</label>
                <textarea class="erp-input builder-preview-json" [ngModel]="selectedHistoryLeftConfigJson" readonly></textarea>
              </div>
              <div class="col-md-6">
                <label class="erp-label small">{{ 'exams.configHistoryCompareRight' | translate }}</label>
                <textarea class="erp-input builder-preview-json" [ngModel]="selectedHistoryRightConfigJson" readonly></textarea>
              </div>
            </div>
            <p *ngIf="!showConfigAdvancedJson" class="small text-muted mb-2">Enable advanced mode to view raw version JSON comparisons.</p>
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn-outline-erp btn-sm"
                *ngFor="let h of configHistoryRows | slice:0:5"
                (click)="restoreReportCardSchemaFromVersion(h.versionNo)"
                [disabled]="configSaving"
              >
                {{ 'exams.configRestoreVersion' | translate:{ versionNo: h.versionNo } }}
              </button>
            </div>
          </div>
          <div class="erp-card p-3 mb-3">
            <h4 class="mb-2">Grading rules</h4>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="erp-label small">Grading style</label>
                <select class="erp-select" [(ngModel)]="configFriendly.gradingScale">
                  <option value="percentage">Percentage</option>
                  <option value="grade">Grade only</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="erp-label small">Passing marks (%)</label>
                <input type="number" min="0" max="100" class="erp-input" [(ngModel)]="configFriendly.passPercent" />
              </div>
            </div>
          </div>
          <div class="erp-card p-3 mb-3">
            <h4 class="mb-2">Approval and publishing rules</h4>
            <div class="d-flex flex-column gap-2 small">
              <label class="d-flex align-items-center gap-2"><input type="checkbox" [(ngModel)]="configFriendly.requireApproval" /> Require approval before finalizing results</label>
              <label class="d-flex align-items-center gap-2"><input type="checkbox" [(ngModel)]="configFriendly.allowTeacherDraft" /> Allow teachers to save draft updates</label>
              <label class="d-flex align-items-center gap-2"><input type="checkbox" [(ngModel)]="configFriendly.autoPublishResults" /> Auto-publish results after approval</label>
            </div>
          </div>
          <div class="erp-card p-3 mb-3">
            <h4 class="mb-2">AI assistant options</h4>
            <div class="d-flex flex-column gap-2 small">
              <label class="d-flex align-items-center gap-2"><input type="checkbox" [(ngModel)]="configFriendly.enableRemarksSuggestion" /> Suggest teacher remarks automatically</label>
              <label class="d-flex align-items-center gap-2"><input type="checkbox" [(ngModel)]="configFriendly.enableRiskPrediction" /> Show risk prediction insights</label>
              <label class="d-flex align-items-center gap-2"><input type="checkbox" [(ngModel)]="configFriendly.enableTopperTrend" /> Show topper trend analytics</label>
            </div>
          </div>
          <div *ngIf="showConfigAdvancedJson">
            <div class="erp-form-group">
              <label class="erp-label">{{ 'exams.schemaLabel.grading' | translate }}</label>
              <textarea class="erp-input" style="min-height: 140px;" [(ngModel)]="moduleConfigDraft.GRADING_SCHEMA"></textarea>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">{{ 'exams.schemaLabel.reportCard' | translate }}</label>
              <textarea class="erp-input" style="min-height: 140px;" [(ngModel)]="moduleConfigDraft.REPORT_CARD_SCHEMA"></textarea>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">{{ 'exams.schemaLabel.workflow' | translate }}</label>
              <textarea class="erp-input" style="min-height: 120px;" [(ngModel)]="moduleConfigDraft.WORKFLOW_SCHEMA"></textarea>
            </div>
            <div class="erp-form-group mb-0">
              <label class="erp-label">{{ 'exams.schemaLabel.ai' | translate }}</label>
              <textarea class="erp-input" style="min-height: 120px;" [(ngModel)]="moduleConfigDraft.AI_SCHEMA"></textarea>
            </div>
          </div>
          <p *ngIf="configMessage" class="small mt-2 mb-0" [class.text-danger]="configError" [class.text-success]="!configError">{{ configMessage }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="showConfigModal = false">{{ 'exams.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="saveModuleConfigs()" [disabled]="configSaving">
            {{ configSaving ? ('exams.configSaving' | translate) : ('exams.configSave' | translate) }}
          </button>
        </div>
      </div>
    </div>
    </app-exam-config-engine>

    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal-content-erp modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ (editExamId == null ? 'exams.modalCreateTitle' : 'exams.modalEditTitle') | translate }}</h3>
          <button type="button" class="btn-icon" (click)="showCreateModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="wizard-steps mb-3">
            <span [class.active]="examWizardStep === 1" [class.done]="examWizardStep > 1">1</span><i></i>
            <span [class.active]="examWizardStep === 2" [class.done]="examWizardStep > 2">2</span><i></i>
            <span [class.active]="examWizardStep === 3" [class.done]="examWizardStep > 3">3</span><i></i>
            <span [class.active]="examWizardStep === 4">4</span>
          </div>
          <div class="erp-form-group" *ngIf="examWizardStep === 1">
            <label class="erp-label">{{ 'exams.labelExamName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="newExam.name" />
          </div>
          <div class="row g-3" *ngIf="examWizardStep === 1">
            <div class="col-md-6">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelTemplate' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedTemplateId" (change)="onTemplateChange()">
                  <option [ngValue]="null">{{ 'exams.selectTemplate' | translate }}</option>
                  <option *ngFor="let tpl of examTemplates" [ngValue]="tpl.id">{{ tpl.name }} ({{ tpl.boardType }})</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelExamType' | translate }}</label>
                <input type="text" class="erp-input" [attr.placeholder]="'exams.examTypePh' | translate" [(ngModel)]="newExam.examType" />
              </div>
            </div>
            <div class="col-md-3">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelBoardCode' | translate }}</label>
                <select class="erp-select" [(ngModel)]="newExam.boardCode">
                  <option value="CBSE">{{ 'exams.boardCode.cbse' | translate }}</option>
                  <option value="ICSE">{{ 'exams.boardCode.icse' | translate }}</option>
                  <option value="STATE">{{ 'exams.boardCode.state' | translate }}</option>
                  <option value="IB">{{ 'exams.boardCode.ib' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-3">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelSessionType' | translate }}</label>
                <select class="erp-select" [(ngModel)]="newExam.sessionType">
                  <option value="ANNUAL">{{ 'exams.sessionType.annual' | translate }}</option>
                  <option value="HALF_YEARLY">{{ 'exams.sessionType.term' | translate }}</option>
                  <option value="PERIODIC">{{ 'exams.sessionType.monthly' | translate }}</option>
                  <option value="BOARD">Board</option>
                </select>
              </div>
            </div>
            <div class="col-md-3">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelTermCode' | translate }}</label>
                <select class="erp-select" [(ngModel)]="newExam.termCode">
                  <option value="TERM_1">{{ 'exams.termCode.term1' | translate }}</option>
                  <option value="TERM_2">{{ 'exams.termCode.term2' | translate }}</option>
                  <option value="FINAL">{{ 'exams.termCode.final' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-3">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelAssessmentKind' | translate }}</label>
                <select class="erp-select" [(ngModel)]="newExam.assessmentKind">
                  <option value="THEORY">{{ 'exams.assessmentKind.theory' | translate }}</option>
                  <option value="PRACTICAL">{{ 'exams.assessmentKind.practical' | translate }}</option>
                  <option value="VIVA">Viva</option>
                  <option value="PROJECT">Project</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelMarkingScheme' | translate }}</label>
                <select class="erp-select" [(ngModel)]="newExam.markingScheme">
                  <option value="marks">{{ 'exams.markingScheme.marks' | translate }}</option>
                  <option value="grades">{{ 'exams.markingScheme.grades' | translate }}</option>
                  <option value="hybrid">{{ 'exams.markingScheme.hybrid' | translate }}</option>
                  <option value="weightage">{{ 'exams.markingScheme.weightage' | translate }}</option>
                  <option value="rubric">{{ 'exams.markingScheme.rubric' | translate }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="erp-form-group" *ngIf="examWizardStep === 2">
            <label class="erp-label">{{ 'exams.labelAdvancedRules' | translate }}</label>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="erp-label small">{{ 'exams.labelMaxPapersPerDay' | translate }}</label>
                <input type="number" min="0" class="erp-input" [(ngModel)]="newExam.maxPapersPerDayPerClass" />
              </div>
              <div class="col-md-4 d-flex align-items-center">
                <label class="d-flex align-items-center gap-2 mt-4">
                  <input type="checkbox" [(ngModel)]="newExam.requireRoom" />
                  <span>{{ 'exams.labelRequireRoom' | translate }}</span>
                </label>
              </div>
              <div class="col-md-4 d-flex align-items-center">
                <label class="d-flex align-items-center gap-2 mt-4">
                  <input type="checkbox" [(ngModel)]="newExam.requireInvigilator" />
                  <span>{{ 'exams.labelRequireInvigilator' | translate }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="erp-form-group" *ngIf="examWizardStep === 2">
            <label class="erp-label">{{ 'exams.labelAcademicYear' | translate }}</label>
            <select class="erp-select" [(ngModel)]="newExam.academicYearId">
              <option [ngValue]="null">{{ 'exams.selectYear' | translate }}</option>
              <option *ngFor="let year of academicYears" [ngValue]="year.id">{{ year.name }}</option>
            </select>
          </div>
          <div class="row g-3" *ngIf="examWizardStep === 2">
            <div class="col-md-6">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelStart' | translate }}</label
                ><app-erp-date-picker [(ngModel)]="newExam.startDate" placeholderI18nKey="exams.labelStart" />
              </div>
            </div>
            <div class="col-md-6">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'exams.labelEnd' | translate }}</label
                ><app-erp-date-picker [(ngModel)]="newExam.endDate" placeholderI18nKey="exams.labelEnd" />
              </div>
            </div>
          </div>
          <p class="small text-danger mb-0" *ngIf="examWizardStep === 2 && isExamDateRangeInvalid">
            {{ 'exams.examDateRangeInvalid' | translate }}
          </p>
          <div class="erp-form-group" *ngIf="examWizardStep === 3">
            <label class="erp-label">{{ 'exams.labelClassesSections' | translate }}</label>
            <p class="small text-muted">{{ 'exams.classesHelp' | translate }}</p>
            <div *ngFor="let cls of classes" class="mb-2 p-2 rounded-3" style="border: 1px solid var(--clr-border-light); background: var(--clr-surface-muted);">
              <label class="d-flex align-items-center gap-2 mb-2">
                <input type="checkbox" [checked]="newExam.classIds.includes(cls.id)" (change)="toggleClassSelection(cls.id)" />
                <span style="font-weight: 700;">{{ cls.name | schoolClassName }}</span>
              </label>
              <div *ngIf="newExam.classIds.includes(cls.id)" class="ps-4">
                <label class="erp-label small">{{ 'exams.labelAudience' | translate }}</label>
                <select class="erp-select" [(ngModel)]="sectionChoiceByClass[cls.id]">
                  <option [ngValue]="null">{{ 'exams.audienceAll' | translate }}</option>
                  <option *ngFor="let sec of cls.sections" [ngValue]="sec.id">{{ 'exams.audienceSection' | translate: { name: sec.name } }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="erp-card p-3" *ngIf="examWizardStep === 4">
            <h4 class="mb-2">{{ 'exams.reviewTitle' | translate }}</h4>
            <div class="small text-muted">
              <div><strong>{{ 'exams.labelExamName' | translate }}:</strong> {{ newExam.name || '-' }}</div>
              <div><strong>{{ 'exams.labelBoardCode' | translate }}:</strong> {{ newExam.boardCode }}</div>
              <div><strong>{{ 'exams.labelSessionType' | translate }}:</strong> {{ newExam.sessionType }}</div>
              <div><strong>{{ 'exams.labelTermCode' | translate }}:</strong> {{ newExam.termCode }}</div>
              <div><strong>{{ 'exams.labelAssessmentKind' | translate }}:</strong> {{ newExam.assessmentKind }}</div>
              <div><strong>{{ 'exams.labelAcademicYear' | translate }}:</strong> {{ newExam.academicYearId ?? '-' }}</div>
              <div><strong>{{ 'exams.labelStart' | translate }}:</strong> {{ newExam.startDate || '-' }}</div>
              <div><strong>{{ 'exams.labelEnd' | translate }}:</strong> {{ newExam.endDate || '-' }}</div>
              <div><strong>{{ 'exams.labelClassesSections' | translate }}:</strong> {{ newExam.classIds.length }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="showCreateModal = false">{{ 'exams.cancel' | translate }}</button>
          <button type="button" class="btn-outline-erp" (click)="previousExamWizardStep()" [disabled]="examWizardStep === 1">{{ 'exams.wizardBack' | translate }}</button>
          <button type="button" class="btn-primary-erp" *ngIf="examWizardStep < 4" (click)="nextExamWizardStep()" [disabled]="!canProceedExamWizardStep">
            {{ 'exams.wizardNext' | translate }}
          </button>
          <button type="button" class="btn-primary-erp" *ngIf="examWizardStep === 4" (click)="saveExamDefinition()">
            {{ (editExamId == null ? 'exams.create' : 'exams.update') | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .exam-card-pick { transition: border-color 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
      .exam-card-pick--disabled { cursor: not-allowed; opacity: 0.62; pointer-events: none; }
      .exam-card-active { border-color: var(--clr-accent) !important; box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-accent) 35%, transparent); }
      .exam-card-skeleton { border: 1px solid var(--clr-border-light); }
      .skeleton-line {
        height: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
        background: linear-gradient(90deg, color-mix(in srgb, var(--clr-surface-muted) 80%, #fff 20%) 25%, color-mix(in srgb, var(--clr-border-light) 60%, #fff 40%) 50%, color-mix(in srgb, var(--clr-surface-muted) 80%, #fff 20%) 75%);
        background-size: 200% 100%;
        animation: examSkeletonPulse 1.25s ease-in-out infinite;
      }
      .skeleton-title { height: 16px; width: 78%; margin-bottom: 14px; }
      .skeleton-pill { width: 38%; border-radius: 999px; }
      .skeleton-short { width: 64%; }
      @keyframes examSkeletonPulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .wizard-steps { display: flex; align-items: center; gap: 8px; }
      .wizard-steps span { width: 28px; height: 28px; border-radius: 999px; border: 1px solid var(--clr-border); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--clr-text-muted); background: var(--clr-surface); }
      .wizard-steps span.active, .wizard-steps span.done { background: var(--clr-primary); border-color: var(--clr-primary); color: #fff; }
      .wizard-steps i { flex: 1; height: 1px; background: var(--clr-border-light); }
      .builder-section { border: 1px solid var(--clr-border-light); border-radius: 10px; padding: 10px; background: var(--clr-surface-muted); }
      .exam-config-modal { width: min(96vw, 1180px); max-height: 92vh; overflow: auto; }
      .builder-section-head .erp-label, .builder-field-row .erp-label { font-size: 11px; margin-bottom: 4px; }
      .builder-actions { flex-wrap: wrap; justify-content: flex-start; }
      .builder-actions .btn-sm { white-space: nowrap; }
      .builder-field-row { padding: 8px 6px; border: 1px dashed var(--clr-border-light); border-radius: 8px; background: var(--clr-surface); }
      .builder-visible-toggle { margin-top: 22px; white-space: nowrap; }
      .builder-preview-json { min-height: 160px; max-height: 260px; overflow: auto; font-size: 12px; background: var(--clr-surface-muted); }
      .exams-list-toolbar {
        display: grid;
        grid-template-columns: minmax(260px, 1fr) 240px;
        gap: 12px;
        align-items: end;
      }
      .exams-list-toolbar__search {
        min-width: 0;
      }
      .exams-list-toolbar__filter {
        justify-self: end;
        width: 100%;
        max-width: 240px;
      }
      @media (max-width: 768px) {
        .exam-config-modal { width: min(96vw, 960px); }
        .modal-content-erp.modal-lg { width: min(96vw, 960px); margin: 12px auto; max-height: 92vh; overflow: auto; }
        .builder-visible-toggle { margin-top: 0; }
        .exams-list-toolbar {
          grid-template-columns: 1fr;
        }
        .exams-list-toolbar__filter {
          justify-self: stretch;
          max-width: none;
        }
      }
    `
  ]
})
export class ExamsComponent implements OnInit {
  Math = Math;
  readonly schedulePaperTypeOptions: string[] = ['THEORY', 'PRACTICAL', 'ORAL', 'PROJECT', 'INTERNAL', 'VIVA'];
  exams: Exam[] = [];
  marks: MarkRecord[] = [];
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  selectedExam: Exam | null = null;
  selectedClassId: number | null = null;
  marksSectionId: number | null = null;
  showCreateModal = false;
  editExamId: number | null = null;
  examWizardStep: ExamWizardStep = 1;
  showConfigModal = false;
  detailTab: ExamDetailTab = 'marks';
  marksSubject = '';
  maxMarks = 100;
  marksSaving = false;
  scheduleSaving = false;
  scheduleUiMessage = '';
  scheduleUiError = false;
  marksEntryStudents: Student[] = [];
  subjectCatalog: SubjectCatalogItem[] = [];
  marksByStudent: Record<number, number | null> = {};
  newExam = {
    name: '',
    examType: '',
    boardCode: 'CBSE',
    sessionType: 'ANNUAL',
    termCode: 'TERM_1',
    assessmentKind: 'THEORY',
    markingScheme: 'marks',
    maxPapersPerDayPerClass: 0,
    requireRoom: false,
    requireInvigilator: false,
    academicYearId: null as number | null,
    startDate: '',
    endDate: '',
    classIds: [] as number[]
  };
  sectionChoiceByClass: Record<number, number | null> = {};
  scheduleDraft: ExamScheduleSlot[] = [];
  marksScopeRows: MarksEntryScopeRow[] = [];
  marksScopeError = '';
  parentChildren: Student[] = [];
  examTemplates: ExamTemplate[] = [];
  selectedTemplateId: number | null = null;
  configAcademicYearId: number | null = null;
  configSaving = false;
  configMessage = '';
  configError = false;
  showConfigAdvancedJson = false;
  reportCardSectionsBuilder: ReportCardSectionDraft[] = [];
  reportCardBuilderSectionErrors: string[] = [];
  reportCardBuilderFieldErrors: Record<string, string> = {};
  configFriendly = {
    gradingScale: 'percentage',
    passPercent: 40,
    requireApproval: true,
    allowTeacherDraft: true,
    autoPublishResults: false,
    enableRemarksSuggestion: false,
    enableRiskPrediction: false,
    enableTopperTrend: false,
  };
  configHistoryRows: ExamModuleConfigHistoryItem[] = [];
  selectedHistoryLeftVersion: number | null = null;
  selectedHistoryRightVersion: number | null = null;
  moduleConfigDraft: Record<ExamModuleConfigKey, string> = {
    GRADING_SCHEMA: '{\n  "scale": "percentage",\n  "passPercent": 40,\n  "bands": [\n    { "grade": "A+", "min": 90 },\n    { "grade": "A", "min": 80 },\n    { "grade": "B", "min": 70 }\n  ]\n}',
    REPORT_CARD_SCHEMA: '{\n  "theme": "classic",\n  "sections": ["header", "scholastic", "attendance", "remarks"],\n  "showRank": true,\n  "showAttendance": true\n}',
    WORKFLOW_SCHEMA: '{\n  "requireApproval": true,\n  "allowTeacherDraft": true,\n  "autoPublishResults": false\n}',
    AI_SCHEMA: '{\n  "enableRemarksSuggestion": false,\n  "enableRiskPrediction": false,\n  "enableTopperTrend": false\n}'
  };
  selectedParentChildId: number | null = null;
  parentDetailTab: 'timetable' | 'results' = 'timetable';
  parentExamUnreadCount = 0;
  parentChildLoading = false;

  recordedSearch = '';
  recordedPageIndex = 0;
  recordedPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedRecordedMarks: MarkRecord[] = [];
  recordedFilteredTotal = 0;

  entrySearch = '';
  entryPageIndex = 0;
  entryPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedMarksEntryStudents: Student[] = [];
  entryFilteredTotal = 0;

  parentResultsSearch = '';
  parentResultsPageIndex = 0;
  parentResultsPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedParentMarks: MarkRecord[] = [];
  parentResultsFilteredTotal = 0;

  schedulePageIndex = 0;
  schedulePageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedScheduleDraft: ExamScheduleSlot[] = [];
  scheduleListTotal = 0;

  staffExamPageIndex = 0;
  staffExamPageSize = DEFAULT_ERP_PAGE_SIZE;
  staffExamTotal = 0;
  staffExamSearch = '';
  selectedExamListFilter: ExamListFilterCode = 'UPCOMING';
  readonly examListFilterOptions: Array<{ code: ExamListFilterCode; labelKey: string }> = [
    { code: 'UPCOMING', labelKey: 'exams.listFilter.upcoming' },
    { code: 'ONGOING', labelKey: 'exams.listFilter.ongoing' },
    { code: 'COMPLETED', labelKey: 'exams.listFilter.completed' },
    { code: 'APPROVED', labelKey: 'exams.listFilter.approved' },
    { code: 'FROZEN', labelKey: 'exams.listFilter.frozen' },
    { code: 'PUBLISHED', labelKey: 'exams.listFilter.published' },
    { code: 'ALL', labelKey: 'exams.listFilter.all' },
  ];
  private staffExamSeq = 0;
  private staffExamSearchTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private examService: ExamService,
    private academicService: AcademicService,
    private studentService: StudentService,
    private parentService: ParentService,
    private auth: AuthService,
    private uiAccess: UiAccessService,
    private examsFacade: ExamsFacade,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  get role(): string {
    return (this.auth.getRole() || '').toLowerCase();
  }

  get staffUsesServerPaging(): boolean {
    return !runtimeConfig.useMocks && this.role !== 'parent';
  }

  get canCreateExam(): boolean {
    return this.uiAccess.hasSchoolExamsOfficeWriteAccess();
  }

  get canConfigureEngine(): boolean {
    return this.uiAccess.hasSchoolExamsOfficeWriteAccess();
  }

  get canEditExamMeta(): boolean {
    if (!this.uiAccess.hasSchoolExamsOfficeWriteAccess() || !this.selectedExam) return false;
    const state = String(this.selectedExam.workflowState || '').toUpperCase();
    return state !== 'FROZEN' && state !== 'PUBLISHED';
  }

  get canEnterMarks(): boolean {
    return this.uiAccess.hasExamMarksAndScheduleWriteAccess();
  }

  get canEditSchedule(): boolean {
    if (!this.uiAccess.hasExamMarksAndScheduleWriteAccess()) return false;
    const state = (this.selectedExam?.workflowState || '').toUpperCase();
    return !state || (state !== 'FROZEN' && state !== 'PUBLISHED');
  }

  /** Teacher with at least one scoped class/subject from API */
  get teacherMarksScopeActive(): boolean {
    return this.role === 'teacher' && this.marksScopeRows.length > 0;
  }

  /** Staff: all exams. Parent: exams whose scope includes the selected child’s class/section. */
  get examGridList(): Exam[] {
    const base = this.role !== 'parent' ? this.exams : this.parentFilteredExams;
    return [...base].filter(ex => this.matchesExamListFilter(ex)).sort(compareExamsForGrid);
  }

  get parentFilteredExams(): Exam[] {
    return this.role === 'parent' ? this.exams : [];
  }

  parentExamIsOpenable(exam: Exam): boolean {
    return this.role !== 'parent' || this.selectedParentChildId != null;
  }

  onExamCardClick(exam: Exam): void {
    this.selectExam(exam);
  }

  get marksClassOptions(): SchoolClass[] {
    if (!this.teacherMarksScopeActive) {
      return this.selectedExamClasses;
    }
    const allow = new Set(this.marksScopeRows.map(r => r.classId));
    return this.selectedExamClasses.filter(c => allow.has(c.id));
  }

  get sectionsForMarksEntry(): SectionLite[] {
    if (!this.teacherMarksScopeActive || this.selectedClassId == null) {
      return this.sectionsForSelectedClass;
    }
    const scoped = this.marksScopeRows.filter(r => r.classId === this.selectedClassId);
    const explicitSecs = scoped.map(r => r.sectionId).filter((id): id is number => id != null);
    if (!explicitSecs.length) {
      return this.sectionsForSelectedClass;
    }
    const want = new Set(explicitSecs);
    return this.sectionsForSelectedClass.filter(s => want.has(s.id));
  }

  get subjectSelectOptions(): string[] {
    const rows = this.marksScopeFiltered;
    const set = new Set(rows.map(r => r.subjectName?.trim()).filter((s): s is string => !!s));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  get marksSubjectOptions(): string[] {
    const set = new Set<string>();
    for (const item of this.subjectSelectOptions) {
      if (item.trim()) {
        set.add(item.trim());
      }
    }
    for (const row of this.marks) {
      if (this.selectedClassId != null && row.classId !== this.selectedClassId) {
        continue;
      }
      if (row.subjectName?.trim()) {
        set.add(row.subjectName.trim());
      }
    }
    for (const row of this.scheduleDraft) {
      if (this.selectedClassId != null && row.classId !== this.selectedClassId) {
        continue;
      }
      if (row.subjectName?.trim()) {
        set.add(row.subjectName.trim());
      }
    }
    if (this.marksSubject?.trim()) {
      set.add(this.marksSubject.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  get marksScopeFiltered(): MarksEntryScopeRow[] {
    if (!this.selectedExam || this.selectedClassId == null) {
      return [];
    }
    return this.marksScopeRows.filter(r => {
      if (r.classId !== this.selectedClassId) {
        return false;
      }
      if (r.sectionId == null) {
        return true;
      }
      return this.marksSectionId == null || r.sectionId === this.marksSectionId;
    });
  }

  /**
   * Supports deep links from the parent portal: {@code ?studentId=}&{@code tab=results}.
   */
  private applyParentRouteQueryIntent(): void {
    const qpm = this.route.snapshot.queryParamMap;
    const raw = qpm.get('studentId');
    const wantResults = qpm.get('tab') === 'results';
    const sid = raw != null && raw !== '' ? Number(raw) : NaN;
    if (Number.isFinite(sid) && this.parentChildren.some(c => c.id === sid)) {
      this.selectedParentChildId = sid;
    } else if (this.parentChildren.length === 1) {
      this.selectedParentChildId = this.parentChildren[0]?.id ?? null;
    } else {
      this.selectedParentChildId = null;
    }
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    if (this.role === 'parent') {
      this.detailTab = 'timetable';
      forkJoin({
        children: this.parentService.getChildren()
      }).subscribe(({ children }) => {
        this.parentChildren = children ?? [];
        this.classes = this.buildSyntheticClassesFromChildren(this.parentChildren);
        this.exams = [];
        this.applyParentRouteQueryIntent();
        this.onParentChildChangeForExams();
      });
      this.parentService.getExamNotificationUnreadCount().subscribe(n => (this.parentExamUnreadCount = Number(n || 0)));
      this.route.queryParamMap.pipe(skip(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (this.parentChildren.length) {
          this.applyParentRouteQueryIntent();
          this.onParentChildChangeForExams();
        }
      });
      return;
    }
    this.loadReferenceData();
    this.loadExams();
  }

  onParentChildChangeForExams(): void {
    if (this.role === 'parent' && this.selectedParentChildId == null) {
      this.parentChildLoading = false;
      this.exams = [];
      this.selectedExam = null;
      this.scheduleDraft = [];
      this.marks = [];
      this.afterMarksLoaded();
      this.rebuildSchedulePaging();
      return;
    }
    if (this.role === 'parent') {
      this.loadSelectedChildExamCards();
      return;
    }
    this.clearParentSelectionIfExamInvisible();
    const ex = this.selectedExam;
    if (ex && this.role === 'parent') {
      this.selectExam(ex, this.parentDetailTab);
    }
  }

  private loadSelectedChildExamCards(): void {
    const sid = this.selectedParentChildId;
    if (sid == null) {
      this.parentChildLoading = false;
      return;
    }
    const child = this.parentChildren.find(c => c.id === sid);
    if (!child) {
      this.parentChildLoading = false;
      this.exams = [];
      this.selectedExam = null;
      return;
    }
    const previousExamId = this.selectedExam?.id ?? null;
    const wantResults = this.route.snapshot.queryParamMap.get('tab') === 'results';
    this.parentChildLoading = true;
    this.parentService.getChildExams(sid).subscribe(rows => {
      if (this.selectedParentChildId !== sid) {
        this.parentChildLoading = false;
        return;
      }
      this.exams = (rows ?? []).map(row => this.toChildScopedExamCard(row, child));
      this.clearParentSelectionIfExamInvisible();
      const keep = previousExamId != null ? this.exams.find(e => e.id === previousExamId) : null;
      if (keep) {
        this.selectExam(keep, this.parentDetailTab);
        return;
      }
      if (!this.selectedExam && this.exams.length) {
        const pick = wantResults
          ? (this.exams.find(e => e.resultsPublished) ?? this.exams[0])
          : this.exams[0];
        this.selectExam(pick, wantResults ? 'results' : 'timetable');
      }
      this.parentChildLoading = false;
    }, () => {
      if (this.selectedParentChildId === sid) {
        this.exams = [];
      }
      this.parentChildLoading = false;
    });
  }

  private toChildScopedExamCard(summary: {
    id: number;
    name: string;
    academicYearId?: number;
    startDate?: string;
    endDate?: string;
    status: string;
    resultsPublished: boolean;
  }, child: Student): Exam {
    const status = (summary.status ?? 'upcoming').toLowerCase();
    const safeStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' =
      status === 'ongoing' || status === 'completed' || status === 'cancelled' ? status : 'upcoming';
    return {
      id: Number(summary.id),
      name: summary.name ?? '',
      academicYearId: summary.academicYearId ?? 0,
      startDate: summary.startDate ?? '',
      endDate: summary.endDate ?? '',
      status: safeStatus,
      resultsPublished: !!summary.resultsPublished,
      classIds: [child.classId],
      classScopes: [{ classId: child.classId, sectionId: child.sectionId }],
      scheduleSlots: [],
      tenantId: child.tenantId ?? ''
    };
  }

  private clearParentSelectionIfExamInvisible(): void {
    if (this.role !== 'parent' || !this.selectedExam) {
      return;
    }
    const visible = new Set(this.parentFilteredExams.map(e => e.id));
    if (!visible.has(this.selectedExam.id)) {
      this.selectedExam = null;
      this.scheduleDraft = [];
      this.marks = [];
      this.afterMarksLoaded();
      this.rebuildSchedulePaging();
    }
  }

  private buildSyntheticClassesFromChildren(children: Student[]): SchoolClass[] {
    const byClass = new Map<
      number,
      { name: string; sections: Map<number, { id: number; name: string; classId: number; capacity: number; studentCount: number }> }
    >();
    const tenantId = children[0]?.tenantId ?? '';
    for (const ch of children) {
      const cid = ch.classId;
      if (!byClass.has(cid)) {
        byClass.set(cid, { name: formatSchoolClassDisplayName(cid, ch.className?.trim(), this.translate), sections: new Map() });
      }
      if (ch.sectionId > 0) {
        byClass.get(cid)!.sections.set(ch.sectionId, {
          id: ch.sectionId,
          name: ch.sectionName?.trim() || `Section`,
          classId: cid,
          capacity: 0,
          studentCount: 0
        });
      }
    }
    return [...byClass.entries()]
      .map(([id, v]) => ({
        id,
        name: v.name,
        grade: 0,
        sections: [...v.sections.values()],
        academicYearId: 0,
        tenantId
      }))
      .sort((a, b) => a.id - b.id);
  }

  scopeSummary(exam: Exam): string {
    const scopes = exam.classScopes?.length
      ? exam.classScopes
      : (exam.classIds ?? []).map(cid => ({ classId: cid, sectionId: null as number | null }));
    if (!scopes.length) return this.translate.instant('exams.scopeNoClasses');
    const allSec = this.translate.instant('exams.scopeAllSections');
    const secFb = this.translate.instant('exams.scopeSectionFallback');
    const parts = scopes.map(s => {
      const cls = this.classes.find(c => c.id === s.classId);
      const apiName = 'className' in s ? (s as { className?: string }).className : undefined;
      const name = formatSchoolClassDisplayName(s.classId, cls?.name ?? apiName, this.translate);
      if (s.sectionId == null) return `${name} · ${allSec}`;
      const sec = cls?.sections?.find(x => x.id === s.sectionId);
      const secApi = 'sectionName' in s ? (s as { sectionName?: string }).sectionName : undefined;
      return `${name} · ${sec?.name || secApi || secFb}`;
    });
    const more =
      parts.length > 3 ? ' ' + this.translate.instant('exams.scopeMore', { n: parts.length - 3 }) : '';
    return parts.slice(0, 3).join(' · ') + more;
  }

  examStatusLabel(status: string | undefined): string {
    const k = (status ?? '').toLowerCase();
    const key = `exams.status.${k}`;
    const t = this.translate.instant(key);
    return t !== key ? t : (status ?? '');
  }

  childClassDisplay(c: Student): string {
    return formatSchoolClassDisplayName(c.classId, c.className, this.translate);
  }

  get selectedExamClasses(): SchoolClass[] {
    if (!this.selectedExam) return [];
    const ids = new Set(this.selectedExam.classIds ?? []);
    return this.classes.filter(cls => ids.has(cls.id));
  }

  get sectionsForSelectedClass(): SectionLite[] {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  sectionsForClass(classId: number): SectionLite[] {
    const cls = this.classes.find(c => c.id === classId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  get sectionHint(): string {
    if (!this.selectedExam || this.selectedClassId == null) return '';
    const scoped = this.selectedExam.classScopes?.filter(s => s.classId === this.selectedClassId) ?? [];
    if (!scoped.length) return '';
    const onlySections = scoped.map(s => s.sectionId).filter((x): x is number => x != null);
    if (!onlySections.length) return '';
    if (onlySections.length === 1 && this.marksSectionId == null) {
      return this.translate.instant('exams.sectionHintSingle');
    }
    return '';
  }

  openCreateModal(): void {
    this.editExamId = null;
    this.examWizardStep = 1;
    this.newExam = {
      name: '',
      examType: '',
      boardCode: 'CBSE',
      sessionType: 'ANNUAL',
      termCode: 'TERM_1',
      assessmentKind: 'THEORY',
      markingScheme: 'marks',
      maxPapersPerDayPerClass: 0,
      requireRoom: false,
      requireInvigilator: false,
      academicYearId: null,
      startDate: '',
      endDate: '',
      classIds: []
    };
    this.selectedTemplateId = null;
    this.sectionChoiceByClass = {};
    this.showCreateModal = true;
  }

  openEditModal(exam: Exam): void {
    this.editExamId = exam.id;
    this.examWizardStep = 1;
    this.newExam = {
      name: exam.name || '',
      examType: exam.examType || '',
      boardCode: exam.boardCode || 'CBSE',
      sessionType: this.normalizeSessionTypeForApi(exam.sessionType),
      termCode: exam.termCode || 'TERM_1',
      assessmentKind: this.normalizeAssessmentKindForApi(exam.assessmentKind),
      markingScheme: exam.markingScheme || 'marks',
      maxPapersPerDayPerClass: Number((exam.gradingConfig?.['examOperations'] as Record<string, unknown> | undefined)?.['maxPapersPerDayPerClass'] || 0),
      requireRoom: Boolean((exam.gradingConfig?.['examOperations'] as Record<string, unknown> | undefined)?.['requireRoom']),
      requireInvigilator: Boolean((exam.gradingConfig?.['examOperations'] as Record<string, unknown> | undefined)?.['requireInvigilator']),
      academicYearId: exam.academicYearId ?? null,
      startDate: exam.startDate || '',
      endDate: exam.endDate || '',
      classIds: [...(exam.classIds || [])]
    };
    this.sectionChoiceByClass = {};
    if (exam.classScopes?.length) {
      this.newExam.classIds = [...new Set(exam.classScopes.map(s => s.classId))];
      for (const scope of exam.classScopes) {
        this.sectionChoiceByClass[scope.classId] = scope.sectionId ?? null;
      }
    } else {
      for (const cid of this.newExam.classIds) {
        this.sectionChoiceByClass[cid] = null;
      }
    }
    this.showCreateModal = true;
  }

  openConfigModal(): void {
    this.configAcademicYearId = this.configAcademicYearId ?? this.academicYears.find(y => y.isCurrent)?.id ?? this.academicYears[0]?.id ?? null;
    this.configMessage = '';
    this.configError = false;
    this.showConfigAdvancedJson = false;
    this.reportCardBuilderSectionErrors = [];
    this.reportCardBuilderFieldErrors = {};
    this.showConfigModal = true;
    this.hydrateReportCardBuilderFromDraft();
    this.hydrateFriendlyConfigFromDraft();
    this.onConfigYearChange();
  }

  onConfigYearChange(): void {
    if (this.configAcademicYearId != null) {
      this.examsFacade.loadConfigs(this.configAcademicYearId).subscribe(draft => {
        this.moduleConfigDraft = { ...draft };
        this.hydrateReportCardBuilderFromDraft();
        this.hydrateFriendlyConfigFromDraft();
      });
    }
    this.loadConfigHistory();
  }

  saveModuleConfigs(): void {
    if (this.configAcademicYearId == null) {
      this.configMessage = this.translate.instant('exams.configYearRequired');
      this.configError = true;
      return;
    }
    if (!this.validateReportCardBuilder()) {
      this.configMessage = this.translate.instant('exams.configValidationFixErrors');
      this.configError = true;
      return;
    }
    this.syncDraftFromReportCardBuilder();
    this.syncDraftFromFriendlyConfig();
    for (const key of ['GRADING_SCHEMA', 'REPORT_CARD_SCHEMA', 'WORKFLOW_SCHEMA', 'AI_SCHEMA'] as ExamModuleConfigKey[]) {
      try {
        JSON.parse(this.moduleConfigDraft[key] || '{}');
      } catch {
        this.configMessage = this.translate.instant('exams.configInvalidJson', { key });
        this.configError = true;
        return;
      }
    }
    this.confirmDialog
      .confirm({
        title: 'Save exam engine settings?',
        message: 'This will update grading, report card, workflow, and AI rules for the selected academic year.',
        details: [
          `Academic year: ${this.academicYears.find(y => y.id === this.configAcademicYearId)?.name || this.configAcademicYearId}`,
          'Changes apply to upcoming exam operations and report card generation.',
          'You can still revise settings later and track version history.',
        ],
        confirmLabel: 'Save settings',
        cancelLabel: 'Review again',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.configSaving = true;
        this.configError = false;
        this.configMessage = '';
        this.examsFacade.saveConfigs(this.configAcademicYearId as number, this.moduleConfigDraft).subscribe({
          next: () => {
            this.configSaving = false;
            this.configMessage = this.translate.instant('exams.configSaved');
            this.configError = false;
            this.loadConfigHistory();
          },
          error: () => {
            this.configSaving = false;
            this.configMessage = this.translate.instant('exams.configSaveError');
            this.configError = true;
          }
        });
      });
  }

  applyBoardPreset(board: 'CBSE' | 'ICSE' | 'STATE'): void {
    this.confirmDialog
      .confirm({
        title: 'Apply board preset?',
        message: `This will replace current draft settings with the ${board} preset template.`,
        details: [
          'Grading bands and report card sections will be auto-updated.',
          'Only your current draft is replaced. Nothing is saved until you click "Save settings".',
        ],
        confirmLabel: 'Apply preset',
        cancelLabel: 'Keep current draft',
        variant: 'primary',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.moduleConfigDraft = { ...this.examsFacade.applyBoardPreset(board) };
        this.hydrateReportCardBuilderFromDraft();
        this.hydrateFriendlyConfigFromDraft();
      });
  }

  sectionErrorAt(index: number): string {
    return this.reportCardBuilderSectionErrors[index] || '';
  }

  fieldErrorAt(sectionIndex: number, fieldIndex: number): string {
    return this.reportCardBuilderFieldErrors[`${sectionIndex}:${fieldIndex}`] || '';
  }

  get reportCardPreviewJson(): string {
    try {
      return JSON.stringify(this.buildReportCardSchemaFromBuilder(), null, 2);
    } catch {
      return '{}';
    }
  }

  get selectedHistoryLeftConfigJson(): string {
    const row = this.configHistoryRows.find(r => r.versionNo === this.selectedHistoryLeftVersion);
    return JSON.stringify(row?.config ?? {}, null, 2);
  }

  get selectedHistoryRightConfigJson(): string {
    const row = this.configHistoryRows.find(r => r.versionNo === this.selectedHistoryRightVersion);
    return JSON.stringify(row?.config ?? {}, null, 2);
  }

  get selectedHistoryDiffSummary(): string[] {
    const left = this.configHistoryRows.find(r => r.versionNo === this.selectedHistoryLeftVersion)?.config;
    const right = this.configHistoryRows.find(r => r.versionNo === this.selectedHistoryRightVersion)?.config;
    if (!left || !right) {
      return [];
    }
    return this.buildHistoryDiffSummary(left, right);
  }

  get isExamDateRangeInvalid(): boolean {
    const start = this.parseDateOnly(this.newExam.startDate);
    const end = this.parseDateOnly(this.newExam.endDate);
    if (!start || !end) {
      return false;
    }
    return end.getTime() < start.getTime();
  }

  loadConfigHistory(): void {
    if (this.configAcademicYearId == null) {
      this.configHistoryRows = [];
      this.selectedHistoryLeftVersion = null;
      this.selectedHistoryRightVersion = null;
      return;
    }
    this.examService.getModuleConfigHistory(this.configAcademicYearId, 'REPORT_CARD_SCHEMA').subscribe(rows => {
      this.configHistoryRows = [...rows].sort((a, b) => Number(b.versionNo || 0) - Number(a.versionNo || 0));
      this.selectedHistoryLeftVersion = this.configHistoryRows[0]?.versionNo ?? null;
      this.selectedHistoryRightVersion = this.configHistoryRows[1]?.versionNo ?? this.configHistoryRows[0]?.versionNo ?? null;
    });
  }

  restoreReportCardSchemaFromVersion(versionNo: number): void {
    if (this.configAcademicYearId == null) {
      return;
    }
    const row = this.configHistoryRows.find(r => r.versionNo === versionNo);
    if (!row) {
      return;
    }
    this.confirmDialog
      .confirm({
        title: `Restore version v${versionNo}?`,
        message: 'This will replace the current report card schema with the selected historical version.',
        details: [
          'Your latest schema draft for this year will be overwritten.',
          'A new history entry will be created so this action remains traceable.',
        ],
        confirmLabel: 'Restore version',
        cancelLabel: 'Cancel',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.configSaving = true;
        this.examService.upsertModuleConfig(
          'REPORT_CARD_SCHEMA',
          this.configAcademicYearId as number,
          row.config,
          `Restore from version ${versionNo}`
        ).subscribe({
          next: () => {
            this.moduleConfigDraft.REPORT_CARD_SCHEMA = JSON.stringify(row.config, null, 2);
            this.hydrateReportCardBuilderFromDraft();
            this.hydrateFriendlyConfigFromDraft();
            this.configMessage = this.translate.instant('exams.configRestoreSuccess', { versionNo });
            this.configError = false;
            this.configSaving = false;
            this.loadConfigHistory();
          },
          error: () => {
            this.configMessage = this.translate.instant('exams.configSaveError');
            this.configError = true;
            this.configSaving = false;
          }
        });
      });
  }

  get canProceedExamWizardStep(): boolean {
    if (this.examWizardStep === 1) {
      return !!this.newExam.name?.trim();
    }
    if (this.examWizardStep === 2) {
      return this.newExam.academicYearId != null && !!this.newExam.startDate && !!this.newExam.endDate && !this.isExamDateRangeInvalid;
    }
    if (this.examWizardStep === 3) {
      return this.newExam.classIds.length > 0;
    }
    return true;
  }

  nextExamWizardStep(): void {
    if (!this.canProceedExamWizardStep || this.examWizardStep >= 4) return;
    this.examWizardStep = (this.examWizardStep + 1) as ExamWizardStep;
  }

  previousExamWizardStep(): void {
    if (this.examWizardStep <= 1) return;
    this.examWizardStep = (this.examWizardStep - 1) as ExamWizardStep;
  }

  toggleConfigAdvancedJson(): void {
    this.showConfigAdvancedJson = !this.showConfigAdvancedJson;
  }

  addReportSection(): void {
    this.reportCardSectionsBuilder = [
      ...this.reportCardSectionsBuilder,
      {
        key: `section_${this.reportCardSectionsBuilder.length + 1}`,
        title: `Section ${this.reportCardSectionsBuilder.length + 1}`,
        layout: 'list',
        fields: [],
      }
    ];
  }

  removeReportSection(index: number): void {
    const section = this.reportCardSectionsBuilder[index];
    if (!section) return;
    this.confirmDialog
      .confirm({
        title: 'Remove this report section?',
        message: 'This section and all fields inside it will be removed from the draft schema.',
        details: [
          `Section key: ${section.key || '(empty)'}`,
          `Section title: ${section.title || '(empty)'}`,
          `Fields to remove: ${section.fields.length}`,
        ],
        confirmLabel: 'Remove section',
        cancelLabel: 'Keep section',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.reportCardSectionsBuilder = this.reportCardSectionsBuilder.filter((_, i) => i !== index);
      });
  }

  moveReportSection(index: number, delta: number): void {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= this.reportCardSectionsBuilder.length) return;
    const copy = [...this.reportCardSectionsBuilder];
    const [row] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, row);
    this.reportCardSectionsBuilder = copy;
  }

  addReportField(sectionIndex: number): void {
    const section = this.reportCardSectionsBuilder[sectionIndex];
    if (!section) return;
    const field: ReportCardFieldDraft = {
      key: 'newField',
      label: 'New field',
      format: '',
      visible: true,
      order: section.fields.length + 1,
    };
    const copy = [...this.reportCardSectionsBuilder];
    copy[sectionIndex] = { ...section, fields: [...section.fields, field] };
    this.reportCardSectionsBuilder = copy;
  }

  removeReportField(sectionIndex: number, fieldIndex: number): void {
    const section = this.reportCardSectionsBuilder[sectionIndex];
    if (!section) return;
    const field = section.fields[fieldIndex];
    if (!field) return;
    this.confirmDialog
      .confirm({
        title: 'Remove this report field?',
        message: 'This field will be removed from the current section draft.',
        details: [
          `Section: ${section.title || section.key || '(untitled)'}`,
          `Field key: ${field.key || '(empty)'}`,
          `Field label: ${field.label || '(empty)'}`,
        ],
        confirmLabel: 'Remove field',
        cancelLabel: 'Keep field',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        const copy = [...this.reportCardSectionsBuilder];
        copy[sectionIndex] = { ...section, fields: section.fields.filter((_, i) => i !== fieldIndex) };
        this.reportCardSectionsBuilder = copy;
      });
  }

  private hydrateReportCardBuilderFromDraft(): void {
    try {
      const parsed = JSON.parse(this.moduleConfigDraft.REPORT_CARD_SCHEMA || '{}') as Record<string, unknown>;
      const rawSections = Array.isArray(parsed['sections']) ? parsed['sections'] : [];
      const built: ReportCardSectionDraft[] = rawSections.map((row, idx) => {
        if (typeof row === 'string') {
          return {
            key: row,
            title: this.titleCaseFromKey(row),
            layout: this.inferLayoutFromKey(row),
            fields: [],
          };
        }
        if (row && typeof row === 'object') {
          const obj = row as Record<string, unknown>;
          const rawFields = Array.isArray(obj['fields']) ? obj['fields'] : Array.isArray(obj['columns']) ? obj['columns'] : [];
          const fields: ReportCardFieldDraft[] = rawFields
            .filter(v => v && typeof v === 'object')
            .map((v, fIdx) => {
              const f = v as Record<string, unknown>;
              return {
                key: String(f['key'] ?? `field_${fIdx + 1}`),
                label: String(f['label'] ?? this.titleCaseFromKey(String(f['key'] ?? `field_${fIdx + 1}`))),
                format: String(f['format'] ?? ''),
                visible: f['visible'] !== false,
                order: Number(f['order'] ?? fIdx + 1),
              };
            });
          return {
            key: String(obj['key'] ?? `section_${idx + 1}`),
            title: String(obj['title'] ?? this.titleCaseFromKey(String(obj['key'] ?? `section_${idx + 1}`))),
            layout: this.normalizeLayout(obj['layout']),
            fields,
          };
        }
        return {
          key: `section_${idx + 1}`,
          title: `Section ${idx + 1}`,
          layout: 'list',
          fields: [],
        };
      });
      this.reportCardSectionsBuilder = built.length ? built : this.defaultReportCardBuilderSections();
    } catch {
      this.reportCardSectionsBuilder = this.defaultReportCardBuilderSections();
    }
  }

  private syncDraftFromReportCardBuilder(): void {
    try {
      const existing = JSON.parse(this.moduleConfigDraft.REPORT_CARD_SCHEMA || '{}') as Record<string, unknown>;
      const sections = this.buildReportCardSchemaFromBuilder().sections as unknown[];
      const merged = {
        ...existing,
        sections,
      };
      this.moduleConfigDraft.REPORT_CARD_SCHEMA = JSON.stringify(merged, null, 2);
    } catch {
      // keep existing draft as is
    }
  }

  private hydrateFriendlyConfigFromDraft(): void {
    const grading = this.parseDraftConfig(this.moduleConfigDraft.GRADING_SCHEMA);
    const workflow = this.parseDraftConfig(this.moduleConfigDraft.WORKFLOW_SCHEMA);
    const ai = this.parseDraftConfig(this.moduleConfigDraft.AI_SCHEMA);
    this.configFriendly = {
      gradingScale: String(grading['scale'] ?? this.configFriendly.gradingScale ?? 'percentage'),
      passPercent: Number(grading['passPercent'] ?? this.configFriendly.passPercent ?? 40),
      requireApproval: !!workflow['requireApproval'],
      allowTeacherDraft: !!workflow['allowTeacherDraft'],
      autoPublishResults: !!workflow['autoPublishResults'],
      enableRemarksSuggestion: !!ai['enableRemarksSuggestion'],
      enableRiskPrediction: !!ai['enableRiskPrediction'],
      enableTopperTrend: !!ai['enableTopperTrend'],
    };
  }

  private syncDraftFromFriendlyConfig(): void {
    const grading = this.parseDraftConfig(this.moduleConfigDraft.GRADING_SCHEMA);
    const workflow = this.parseDraftConfig(this.moduleConfigDraft.WORKFLOW_SCHEMA);
    const ai = this.parseDraftConfig(this.moduleConfigDraft.AI_SCHEMA);

    grading['scale'] = this.configFriendly.gradingScale || 'percentage';
    grading['passPercent'] = Number.isFinite(Number(this.configFriendly.passPercent))
      ? Math.max(0, Math.min(100, Number(this.configFriendly.passPercent)))
      : 40;

    workflow['requireApproval'] = !!this.configFriendly.requireApproval;
    workflow['allowTeacherDraft'] = !!this.configFriendly.allowTeacherDraft;
    workflow['autoPublishResults'] = !!this.configFriendly.autoPublishResults;

    ai['enableRemarksSuggestion'] = !!this.configFriendly.enableRemarksSuggestion;
    ai['enableRiskPrediction'] = !!this.configFriendly.enableRiskPrediction;
    ai['enableTopperTrend'] = !!this.configFriendly.enableTopperTrend;

    this.moduleConfigDraft.GRADING_SCHEMA = JSON.stringify(grading, null, 2);
    this.moduleConfigDraft.WORKFLOW_SCHEMA = JSON.stringify(workflow, null, 2);
    this.moduleConfigDraft.AI_SCHEMA = JSON.stringify(ai, null, 2);
  }

  private parseDraftConfig(raw: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(raw || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private buildReportCardSchemaFromBuilder(): Record<string, unknown> {
    const sections = this.reportCardSectionsBuilder.map(s => {
      const fields = [...s.fields]
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map(f => ({
          key: f.key.trim(),
          label: f.label.trim(),
          format: f.format?.trim() || undefined,
          visible: f.visible,
          order: Number(f.order || 0),
        }));
      return {
        key: s.key.trim(),
        title: s.title.trim(),
        layout: s.layout,
        ...(s.layout === 'table' ? { columns: fields } : { fields }),
      };
    });
    return { sections };
  }

  private validateReportCardBuilder(): boolean {
    const sectionErrors: string[] = [];
    const fieldErrors: Record<string, string> = {};
    let valid = true;

    if (!this.reportCardSectionsBuilder.length) {
      this.reportCardBuilderSectionErrors = [this.translate.instant('exams.configValidationSectionRequired')];
      this.reportCardBuilderFieldErrors = {};
      return false;
    }

    this.reportCardSectionsBuilder.forEach((section, sIdx) => {
      const secErr: string[] = [];
      if (!section.key?.trim()) {
        secErr.push(this.translate.instant('exams.configValidationSectionKeyRequired'));
      }
      if (!section.title?.trim()) {
        secErr.push(this.translate.instant('exams.configValidationSectionTitleRequired'));
      }
      sectionErrors[sIdx] = secErr.join(' ');
      if (secErr.length) {
        valid = false;
      }

      section.fields.forEach((field, fIdx) => {
        const errs: string[] = [];
        if (!field.key?.trim()) errs.push(this.translate.instant('exams.configValidationFieldKeyRequired'));
        if (!field.label?.trim()) errs.push(this.translate.instant('exams.configValidationFieldLabelRequired'));
        if (!Number.isFinite(Number(field.order)) || Number(field.order) <= 0) {
          errs.push(this.translate.instant('exams.configValidationFieldOrderInvalid'));
        }
        const k = `${sIdx}:${fIdx}`;
        if (errs.length) {
          fieldErrors[k] = errs.join(' ');
          valid = false;
        }
      });
    });

    this.reportCardBuilderSectionErrors = sectionErrors;
    this.reportCardBuilderFieldErrors = fieldErrors;
    return valid;
  }

  private defaultReportCardBuilderSections(): ReportCardSectionDraft[] {
    return [
      { key: 'header', title: 'Header', layout: 'list', fields: [] },
      { key: 'scholastic', title: 'Scholastic', layout: 'table', fields: [] },
      { key: 'totals', title: 'Totals', layout: 'badges', fields: [] },
      { key: 'remarks', title: 'Remarks', layout: 'remarks', fields: [] },
    ];
  }

  private inferLayoutFromKey(key: string): ReportSectionLayout {
    const k = String(key || '').trim().toLowerCase();
    if (k.includes('remark')) return 'remarks';
    if (k.includes('subject') || k.includes('scholastic')) return 'table';
    if (k.includes('total') || k.includes('summary')) return 'badges';
    return 'list';
  }

  private normalizeLayout(raw: unknown): ReportSectionLayout {
    const l = String(raw ?? '').trim().toLowerCase();
    if (l === 'table' || l === 'badges' || l === 'remarks' || l === 'list') return l;
    return 'list';
  }

  private titleCaseFromKey(key: string): string {
    return String(key || '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  private parseDateOnly(value: string): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  private buildHistoryDiffSummary(
    leftConfig: Record<string, unknown>,
    rightConfig: Record<string, unknown>
  ): string[] {
    const summary: string[] = [];
    const leftSections = this.extractSchemaSections(leftConfig);
    const rightSections = this.extractSchemaSections(rightConfig);

    if (leftSections.length !== rightSections.length) {
      summary.push(
        this.translate.instant('exams.configHistoryDiffSectionsCount', {
          left: leftSections.length,
          right: rightSections.length
        })
      );
    }

    const leftMap = new Map(leftSections.map(section => [section.key, section]));
    const rightMap = new Map(rightSections.map(section => [section.key, section]));
    const added = rightSections.filter(section => !leftMap.has(section.key)).map(section => section.key);
    const removed = leftSections.filter(section => !rightMap.has(section.key)).map(section => section.key);
    if (added.length) {
      summary.push(this.translate.instant('exams.configHistoryDiffSectionsAdded', { value: added.join(', ') }));
    }
    if (removed.length) {
      summary.push(this.translate.instant('exams.configHistoryDiffSectionsRemoved', { value: removed.join(', ') }));
    }

    const changedSections: string[] = [];
    const sharedKeys = leftSections.map(section => section.key).filter(key => rightMap.has(key));
    for (const key of sharedKeys) {
      const leftSection = leftMap.get(key);
      const rightSection = rightMap.get(key);
      if (!leftSection || !rightSection) {
        continue;
      }
      const changedTitle = leftSection.title !== rightSection.title;
      const changedLayout = leftSection.layout !== rightSection.layout;
      const changedFields = leftSection.fields.length !== rightSection.fields.length;
      if (changedTitle || changedLayout || changedFields) {
        changedSections.push(key);
      }
    }
    if (changedSections.length) {
      summary.push(this.translate.instant('exams.configHistoryDiffSectionsChanged', { value: changedSections.join(', ') }));
    }

    const leftTheme = String(leftConfig['theme'] ?? '');
    const rightTheme = String(rightConfig['theme'] ?? '');
    if (leftTheme !== rightTheme) {
      summary.push(this.translate.instant('exams.configHistoryDiffTheme', { left: leftTheme || '-', right: rightTheme || '-' }));
    }

    if (!summary.length) {
      summary.push(this.translate.instant('exams.configHistoryDiffNoMajorChanges'));
    }
    return summary;
  }

  private extractSchemaSections(config: Record<string, unknown>): Array<{ key: string; title: string; layout: string; fields: string[] }> {
    const rawSections = Array.isArray(config['sections']) ? config['sections'] : [];
    return rawSections.map((entry, idx) => {
      if (typeof entry === 'string') {
        return { key: entry, title: entry, layout: 'list', fields: [] };
      }
      if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>;
        const fields = Array.isArray(obj['fields'])
          ? obj['fields']
          : Array.isArray(obj['columns'])
            ? obj['columns']
            : [];
        const fieldKeys = fields
          .filter(field => field && typeof field === 'object')
          .map(field => String((field as Record<string, unknown>)['key'] ?? ''))
          .filter(Boolean);
        return {
          key: String(obj['key'] ?? `section_${idx + 1}`),
          title: String(obj['title'] ?? ''),
          layout: String(obj['layout'] ?? 'list'),
          fields: fieldKeys
        };
      }
      return { key: `section_${idx + 1}`, title: '', layout: 'list', fields: [] };
    });
  }

  selectExam(exam: Exam, parentInitialTab: 'timetable' | 'results' = 'timetable'): void {
    this.selectedExam = exam;
    this.selectedClassId = exam.classIds[0] ?? null;
    this.marksSectionId = null;
    this.marksSubject = '';
    this.marksByStudent = {};
    this.marksScopeRows = [];
    this.marksScopeError = '';
    this.scheduleUiMessage = '';
    this.scheduleUiError = false;
    this.recordedSearch = '';
    this.entrySearch = '';
    this.parentResultsSearch = '';
    this.recordedPageIndex = 0;
    this.entryPageIndex = 0;
    this.parentResultsPageIndex = 0;
    this.schedulePageIndex = 0;
    this.detailTab = this.canEnterMarks ? 'marks' : 'timetable';
    if (this.role === 'parent') {
      this.parentDetailTab =
          parentInitialTab === 'results' && exam.resultsPublished ? 'results' : 'timetable';
      const sid = this.selectedParentChildId;
      if (sid == null) {
        this.marks = [];
        this.scheduleDraft = (exam.scheduleSlots ?? []).map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        this.afterMarksLoaded();
        this.rebuildSchedulePaging();
        return;
      }
      this.parentService.getChildExamMarks(sid, exam.id).subscribe({
        next: m => {
          this.marks = m;
          this.afterMarksLoaded();
        },
        error: () => {
          this.marks = [];
          this.afterMarksLoaded();
        }
      });
      this.parentService.getChildExamSchedule(sid, exam.id).subscribe({
        next: slots => {
          const list = slots.length ? slots : (exam.scheduleSlots ?? []);
          this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
          if (this.selectedExam && this.selectedExam.id === exam.id) {
            this.selectedExam.scheduleSlots = [...list];
          }
          this.schedulePageIndex = 0;
          this.rebuildSchedulePaging();
        },
        error: () => {
          const list = exam.scheduleSlots ?? [];
          this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
          this.scheduleUiMessage = this.translate.instant('exams.scheduleLoadErrorParent');
          this.scheduleUiError = true;
          this.schedulePageIndex = 0;
          this.rebuildSchedulePaging();
        }
      });
      this.parentService.acknowledgeExamNotifications(exam.id).subscribe(() => {
        this.parentService.getExamNotificationUnreadCount().subscribe(n => (this.parentExamUnreadCount = Number(n || 0)));
      });
      return;
    }
    this.examService.getMarksByExam(exam.id).subscribe(m => {
      this.marks = m;
      this.afterMarksLoaded();
    });
    this.examService.getSchedule(exam.id).subscribe({
      next: slots => {
        const list = slots.length ? slots : (exam.scheduleSlots ?? []);
        this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        if (this.selectedExam && this.selectedExam.id === exam.id) {
          this.selectedExam.scheduleSlots = [...list];
        }
        this.schedulePageIndex = 0;
        this.rebuildSchedulePaging();
      },
      error: () => {
        const list = exam.scheduleSlots ?? [];
        this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        this.scheduleUiMessage = this.translate.instant('exams.scheduleLoadErrorBundled');
        this.scheduleUiError = true;
        this.schedulePageIndex = 0;
        this.rebuildSchedulePaging();
      }
    });
    if (this.canEnterMarks) {
      this.loadMarksEntryStudents();
    }
    if (this.canEnterMarks && this.role === 'teacher') {
      this.examService.getMarksEntryScope(exam.id).subscribe({
        next: rows => {
          this.marksScopeRows = rows ?? [];
          this.applyMarksScopeDefaults();
        },
        error: () => {
          this.marksScopeRows = [];
          this.marksScopeError = this.translate.instant('exams.marksScopeError');
        }
      });
    }
  }

  className(classId: number | undefined): string {
    if (classId == null) {
      return this.translate.instant('exams.dash');
    }
    const cls = this.classes.find(c => c.id === classId);
    return formatSchoolClassDisplayName(classId, cls?.name, this.translate);
  }

  /** HH:MM for API values like "09:00:00". */
  formatSlotTime(t: string | undefined): string {
    if (!t?.trim()) {
      return this.translate.instant('exams.dash');
    }
    const parts = t.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
  }

  scheduleSubjectOptions(row: ExamScheduleSlot): string[] {
    const set = new Set<string>();
    const classId = row.classId ?? null;
    for (const scoped of this.marksScopeRows) {
      if (classId != null && scoped.classId !== classId) {
        continue;
      }
      if (scoped.subjectName?.trim()) {
        set.add(scoped.subjectName.trim());
      }
    }
    for (const mark of this.marks) {
      if (classId != null && mark.classId !== classId) {
        continue;
      }
      if (mark.subjectName?.trim()) {
        set.add(mark.subjectName.trim());
      }
    }
    for (const slot of this.scheduleDraft) {
      if (classId != null && slot.classId !== classId) {
        continue;
      }
      if (slot.subjectName?.trim()) {
        set.add(slot.subjectName.trim());
      }
    }
    if (row.subjectName?.trim()) {
      set.add(row.subjectName.trim());
    }
    for (const subject of this.subjectCatalog) {
      if (subject.name?.trim()) {
        set.add(subject.name.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  schedulePaperTypeOptionsForRow(row: ExamScheduleSlot): string[] {
    const set = new Set(this.schedulePaperTypeOptions);
    for (const slot of this.scheduleDraft) {
      if (slot.paperType?.trim()) {
        set.add(slot.paperType.trim().toUpperCase());
      }
    }
    if (row.paperType?.trim()) {
      set.add(row.paperType.trim().toUpperCase());
    }
    return [...set];
  }

  sectionName(classId: number | undefined, sectionId: number): string {
    if (classId == null) {
      return String(sectionId);
    }
    const cls = this.classes.find(c => c.id === classId);
    return cls?.sections?.find(s => s.id === sectionId)?.name ?? String(sectionId);
  }

  private applyMarksScopeDefaults(): void {
    if (!this.teacherMarksScopeActive || !this.selectedExam) {
      return;
    }
    const allow = new Set(this.marksScopeRows.map(r => r.classId));
    if (this.selectedClassId != null && !allow.has(this.selectedClassId)) {
      const pick = this.selectedExamClasses.find(c => allow.has(c.id));
      this.selectedClassId = pick?.id ?? this.selectedClassId;
    }
    if (this.selectedClassId == null) {
      const first = this.marksClassOptions[0];
      this.selectedClassId = first?.id ?? null;
    }
    this.onClassOrSectionChange();
  }

  onTimetableTab(): void {
    this.detailTab = 'timetable';
    if (this.role === 'parent') {
      this.parentDetailTab = 'timetable';
    }
    if (!this.selectedExam) return;
    const ex = this.selectedExam;
    if (this.role === 'parent') {
      const sid = this.selectedParentChildId;
      if (sid == null) {
        return;
      }
      this.parentService.getChildExamSchedule(sid, ex.id).subscribe({
        next: slots => {
          const list = slots.length ? slots : (ex.scheduleSlots ?? []);
          this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
          this.schedulePageIndex = 0;
          this.rebuildSchedulePaging();
        },
        error: () => {
          this.scheduleDraft = (ex.scheduleSlots ?? []).map(s => ({ ...s, sectionId: s.sectionId ?? null }));
          this.schedulePageIndex = 0;
          this.rebuildSchedulePaging();
        }
      });
      return;
    }
    this.examService.getSchedule(ex.id).subscribe({
      next: slots => {
        const list = slots.length ? slots : (ex.scheduleSlots ?? []);
        this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        this.schedulePageIndex = 0;
        this.rebuildSchedulePaging();
      },
      error: () => {
        this.scheduleDraft = (ex.scheduleSlots ?? []).map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        this.schedulePageIndex = 0;
        this.rebuildSchedulePaging();
      }
    });
  }

  onClassOrSectionChange(): void {
    this.loadMarksEntryStudents();
  }

  downloadParentReportCardPdf(): void {
    if (this.role !== 'parent' || this.selectedParentChildId == null || !this.selectedExam) {
      return;
    }
    this.parentService.getChildExamReportCardPdf(this.selectedParentChildId, this.selectedExam.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-card-${this.selectedParentChildId}-${this.selectedExam!.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.parentService.queueChildExamReportCardJob(this.selectedParentChildId!, this.selectedExam!.id).subscribe(job => {
          this.scheduleUiMessage = `Report card queued as async job #${job.id}. Download will be available once ready.`;
          this.scheduleUiError = false;
        });
      }
    });
  }

  loadMarksEntryStudents(): void {
    if (this.selectedClassId == null) {
      this.marksEntryStudents = [];
      this.entryPageIndex = 0;
      this.rebuildEntryPaging();
      return;
    }
    const req$ =
      this.marksSectionId != null
        ? this.studentService.getStudentsByClassAndSection(this.selectedClassId, this.marksSectionId)
        : this.studentService.getStudentsByClass(this.selectedClassId);
    req$.subscribe(students => {
      this.marksEntryStudents = students;
      this.marksByStudent = {};
      this.entryPageIndex = 0;
      this.rebuildEntryPaging();
    });
  }

  onScheduleRowClass(row: ExamScheduleSlot): void {
    row.sectionId = null;
  }

  addScheduleRow(): void {
    const cid = this.selectedExam?.classIds[0] ?? this.classes[0]?.id;
    if (cid == null) return;
    const defaultDate = this.selectedExam?.startDate?.trim() || new Date().toISOString().slice(0, 10);
    this.scheduleDraft.push({
      examId: this.selectedExam?.id,
      classId: cid,
      sectionId: null,
      subjectName: '',
      paperType: '',
      invigilatorName: '',
      examDate: defaultDate,
      startTime: '09:00',
      endTime: '12:00',
      room: '',
      notes: ''
    });
    this.rebuildSchedulePaging();
  }

  removeScheduleRowPaged(uiIndex: number): void {
    const gi = this.schedulePageIndex * this.schedulePageSize + uiIndex;
    if (gi < 0 || gi >= this.scheduleDraft.length) {
      return;
    }
    const row = this.scheduleDraft[gi];
    this.confirmDialog
      .confirm({
        title: 'Remove this timetable row?',
        message: 'This row will be removed from the current timetable draft.',
        details: [
          `Date: ${row.examDate || '-'}`,
          `Subject: ${row.subjectName || '-'}`,
          `Time: ${this.formatSlotTime(row.startTime)} - ${this.formatSlotTime(row.endTime)}`,
        ],
        confirmLabel: 'Remove row',
        cancelLabel: 'Keep row',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.scheduleDraft.splice(gi, 1);
        this.rebuildSchedulePaging();
      });
  }

  saveSchedule(): void {
    if (!this.selectedExam) return;
    this.scheduleUiMessage = '';
    this.scheduleUiError = false;
    if (this.scheduleDraft.length > 0) {
      for (let i = 0; i < this.scheduleDraft.length; i++) {
        const r = this.scheduleDraft[i];
        const n = i + 1;
        if (r.classId == null) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowClass', { n });
          this.scheduleUiError = true;
          return;
        }
        if (!r.subjectName?.trim()) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowSubject', { n });
          this.scheduleUiError = true;
          return;
        }
        if (!r.examDate?.trim()) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowDate', { n });
          this.scheduleUiError = true;
          return;
        }
        if (!r.startTime?.trim() || !r.endTime?.trim()) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowTime', { n });
          this.scheduleUiError = true;
          return;
        }
        if (r.startTime >= r.endTime) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowTimeOrder', { n });
          this.scheduleUiError = true;
          return;
        }
        if (this.examRuleRequireRoom() && !r.room?.trim()) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowRoomRequired', { n });
          this.scheduleUiError = true;
          return;
        }
        if (this.examRuleRequireInvigilator() && !r.invigilatorName?.trim()) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowInvigilatorRequired', { n });
          this.scheduleUiError = true;
          return;
        }
      }
      const seen = new Set<string>();
      const dailyCountByClassSection = new Map<string, number>();
      for (let i = 0; i < this.scheduleDraft.length; i++) {
        const a = this.scheduleDraft[i];
        const key = `${a.examDate}|${a.classId}|${a.sectionId ?? 'ALL'}`;
        dailyCountByClassSection.set(key, (dailyCountByClassSection.get(key) ?? 0) + 1);
        for (let j = i + 1; j < this.scheduleDraft.length; j++) {
          const b = this.scheduleDraft[j];
          const bKey = `${b.examDate}|${b.classId}|${b.sectionId ?? 'ALL'}`;
          if (key !== bKey) continue;
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            this.scheduleUiMessage = this.translate.instant('exams.validation.rowConflict', { a: i + 1, b: j + 1 });
            this.scheduleUiError = true;
            return;
          }
        }
        const subjectKey = `${key}|${(a.subjectName || '').trim().toLowerCase()}`;
        if (seen.has(subjectKey)) {
          this.scheduleUiMessage = this.translate.instant('exams.validation.rowDuplicateSubject', { n: i + 1 });
          this.scheduleUiError = true;
          return;
        }
        seen.add(subjectKey);
      }
      const maxPapers = this.examRuleMaxPapersPerDay();
      if (maxPapers > 0 && [...dailyCountByClassSection.values()].some(c => c > maxPapers)) {
        this.scheduleUiMessage = this.translate.instant('exams.validation.rowMaxPapersPerDay', { max: maxPapers });
        this.scheduleUiError = true;
        return;
      }
    }
    this.confirmDialog
      .confirm({
        title: 'Publish this timetable draft?',
        message: 'This will replace the existing timetable rows for this exam with the current grid.',
        details: [
          `Exam: ${this.selectedExam.name || 'Selected exam'}`,
          `Rows to save: ${this.scheduleDraft.length}`,
          'Previous rows for this exam are replaced to keep one final timetable version.',
        ],
        confirmLabel: 'Save timetable',
        cancelLabel: 'Continue editing',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.scheduleSaving = true;
        const payload = this.scheduleDraft.map(({ classId, sectionId, subjectName, paperType, invigilatorName, examDate, startTime, endTime, room, notes }) => ({
          classId: classId as number,
          sectionId: sectionId ?? null,
          subjectName,
          paperType: paperType?.trim() || undefined,
          invigilatorName: invigilatorName?.trim() || undefined,
          examDate,
          startTime,
          endTime,
          room,
          notes
        }));
        this.examService.replaceSchedule(this.selectedExam!.id, payload).subscribe({
          next: rows => {
            this.scheduleDraft = rows.map(r => ({ ...r, sectionId: r.sectionId ?? null }));
            this.selectedExam!.scheduleSlots = [...rows];
            this.scheduleSaving = false;
            this.scheduleUiMessage = this.translate.instant('exams.timetableSaved');
            this.scheduleUiError = false;
            this.schedulePageIndex = 0;
            this.rebuildSchedulePaging();
          },
          error: (err: unknown) => {
            this.scheduleSaving = false;
            const http = err as { error?: { message?: string }; message?: string };
            const msg =
              err instanceof Error
                ? err.message
                : (http?.error?.message ?? http?.message ?? this.translate.instant('exams.saveFailed'));
            this.scheduleUiMessage =
              msg +
              (String(msg).toLowerCase().includes('network') ? '' : this.translate.instant('exams.scheduleSaveNetwork'));
            this.scheduleUiError = true;
          }
        });
      });
  }

  toggleClassSelection(classId: number): void {
    if (this.newExam.classIds.includes(classId)) {
      this.newExam.classIds = this.newExam.classIds.filter(id => id !== classId);
      delete this.sectionChoiceByClass[classId];
      return;
    }
    this.newExam.classIds = [...this.newExam.classIds, classId];
    this.sectionChoiceByClass[classId] = null;
  }

  saveExamDefinition(): void {
    if (!this.newExam.name?.trim() || this.newExam.academicYearId == null || !this.newExam.classIds.length) return;
    const classScopes: ExamClassScope[] = this.newExam.classIds.map(cid => ({
      classId: cid,
      sectionId: this.sectionChoiceByClass[cid] ?? null
    }));
    const exam: Exam = {
      id: 0,
      name: this.newExam.name.trim(),
      examType: this.newExam.examType?.trim() || 'custom',
      boardCode: this.newExam.boardCode?.trim() || 'CBSE',
      sessionType: this.normalizeSessionTypeForApi(this.newExam.sessionType),
      termCode: this.newExam.termCode?.trim() || 'TERM_1',
      assessmentKind: this.normalizeAssessmentKindForApi(this.newExam.assessmentKind),
      markingScheme: this.newExam.markingScheme || 'marks',
      gradingConfig: {
        scheme: this.newExam.markingScheme || 'marks',
        examOperations: {
          maxPapersPerDayPerClass: Number(this.newExam.maxPapersPerDayPerClass || 0),
          requireRoom: !!this.newExam.requireRoom,
          requireInvigilator: !!this.newExam.requireInvigilator
        }
      },
      academicYearId: this.newExam.academicYearId,
      startDate: this.newExam.startDate,
      endDate: this.newExam.endDate,
      classIds: [...this.newExam.classIds],
      classScopes,
      status: 'upcoming',
      workflowState: this.role === 'teacher' ? 'PENDING_APPROVAL' : 'APPROVED',
      tenantId: ''
    };
    this.confirmDialog
      .confirm({
        title: this.editExamId == null ? 'Create this exam?' : 'Update this exam setup?',
        message: 'Please verify the exam name, date range, and class scope before continuing.',
        details: [
          `Exam: ${exam.name}`,
          `Classes selected: ${classScopes.length}`,
          this.editExamId == null ? 'A new exam record will be created.' : 'Existing exam setup will be updated for selected classes.',
        ],
        confirmLabel: this.editExamId == null ? 'Create exam' : 'Update exam',
        cancelLabel: 'Review details',
        variant: 'primary',
      })
      .subscribe(ok => {
        if (!ok) return;
        const save$ = this.editExamId == null
          ? this.examService.addExam(exam, classScopes)
          : this.examService.updateExam(this.editExamId, exam, classScopes);
        save$.subscribe(createdExam => {
          this.showCreateModal = false;
          this.editExamId = null;
          if (this.staffUsesServerPaging) {
            this.staffExamPageIndex = 0;
            const cid = createdExam.id;
            const seq = ++this.staffExamSeq;
            this.examService
              .getExamsPage({
                page: 0,
                size: this.staffExamPageSize,
                q: this.staffExamSearch.trim() || undefined,
              })
              .subscribe(p => {
                if (seq !== this.staffExamSeq) {
                  return;
                }
                this.exams = p.content;
                this.staffExamTotal = p.totalElements;
                this.staffExamPageIndex = p.page;
                this.staffExamPageSize = p.size;
                this.selectExam(this.exams.find(e => e.id === cid) ?? createdExam);
                this.cdr.markForCheck();
              });
            return;
          }
          this.exams = [createdExam, ...this.exams];
          this.selectExam(createdExam);
        });
      });
  }

  private normalizeSessionTypeForApi(raw: string | null | undefined): string {
    const normalized = (raw ?? '').trim().toUpperCase();
    if (!normalized) return 'ANNUAL';
    if (normalized === 'TERM') return 'HALF_YEARLY';
    if (normalized === 'MONTHLY') return 'PERIODIC';
    if (['PERIODIC', 'HALF_YEARLY', 'ANNUAL', 'BOARD'].includes(normalized)) {
      return normalized;
    }
    return 'ANNUAL';
  }

  private normalizeAssessmentKindForApi(raw: string | null | undefined): string {
    const normalized = (raw ?? '').trim().toUpperCase();
    if (!normalized) return 'THEORY';
    if (normalized === 'INTERNAL') return 'PROJECT';
    if (normalized === 'COMPOSITE') return 'HYBRID';
    if (['THEORY', 'PRACTICAL', 'VIVA', 'PROJECT', 'HYBRID'].includes(normalized)) {
      return normalized;
    }
    return 'THEORY';
  }

  saveMarks(): void {
    if (!this.selectedExam || this.selectedClassId == null || !this.marksSubject) return;
    const wf = (this.selectedExam.workflowState || '').toUpperCase();
    if (wf === 'DRAFT' || wf === 'PENDING_APPROVAL' || wf === 'REJECTED' || wf === 'FROZEN') {
      return;
    }
    if (this.role === 'teacher') {
      const allow = new Set(this.subjectSelectOptions.map(s => s.trim().toLowerCase()));
      if (!allow.size || !allow.has(this.marksSubject.trim().toLowerCase())) {
        return;
      }
    }
    if (Number(this.maxMarks) <= 0) {
      return;
    }
    const classId = this.selectedClassId;
    const payload = this.marksEntryStudents
      .filter(student => this.marksByStudent[student.id] !== null && this.marksByStudent[student.id] !== undefined)
      .map(student => {
        const obtained = Number(this.marksByStudent[student.id]);
        if (!Number.isFinite(obtained) || obtained < 0 || obtained > Number(this.maxMarks)) {
          return null;
        }
        return {
          id: 0,
          examId: this.selectedExam!.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          subjectName: this.marksSubject,
          marksObtained: obtained,
          maxMarks: Number(this.maxMarks),
          grade: this.getAutoGrade(obtained, this.maxMarks),
          classId,
          tenantId: ''
        } as MarkRecord;
      })
      .filter((m): m is MarkRecord => !!m);
    if (!payload.length) return;
    this.confirmDialog
      .confirm({
        title: 'Save marks now?',
        message: 'This will update marks for this subject and class, replacing earlier values for the same student entries.',
        details: [
          `Exam: ${this.selectedExam.name || 'Selected exam'}`,
          `Class: ${this.classes.find(c => c.id === classId)?.name || classId}`,
          `Subject: ${this.marksSubject}`,
          `Records to save: ${payload.length}`,
        ],
        confirmLabel: 'Save marks',
        cancelLabel: 'Check entries',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.marksSaving = true;
        this.examService.saveMarks(this.selectedExam!.id, payload).subscribe({
          next: savedMarks => {
            this.marksSaving = false;
            this.marks = [...this.marks.filter(m => !(m.subjectName === this.marksSubject && m.classId === classId)), ...savedMarks];
            this.marksByStudent = {};
            this.rebuildRecordedPaging();
            this.rebuildParentResultsPaging();
            this.rebuildEntryPaging();
          },
          error: () => {
            this.marksSaving = false;
          }
        });
      });
  }

  private afterMarksLoaded(): void {
    this.recordedPageIndex = 0;
    this.parentResultsPageIndex = 0;
    this.rebuildRecordedPaging();
    this.rebuildParentResultsPaging();
  }

  private filterRecordedMarks(): MarkRecord[] {
    const q = this.recordedSearch.trim().toLowerCase();
    if (!q) {
      return this.marks;
    }
    return this.marks.filter(
      m =>
        (m.studentName || '').toLowerCase().includes(q) || (m.subjectName || '').toLowerCase().includes(q)
    );
  }

  rebuildRecordedPaging(): void {
    const pg = sliceToPage(this.filterRecordedMarks(), this.recordedPageIndex, this.recordedPageSize);
    this.pagedRecordedMarks = pg.content;
    this.recordedPageIndex = pg.page;
    this.recordedFilteredTotal = pg.totalElements;
  }

  onRecordedSearchChange(): void {
    this.recordedPageIndex = 0;
    this.rebuildRecordedPaging();
  }

  onRecordedPageIndex(i: number): void {
    this.recordedPageIndex = i;
    this.rebuildRecordedPaging();
  }

  onRecordedPageSize(s: number): void {
    this.recordedPageSize = s;
    this.recordedPageIndex = 0;
    this.rebuildRecordedPaging();
  }

  private filterEntryStudents(): Student[] {
    const q = this.entrySearch.trim().toLowerCase();
    if (!q) {
      return this.marksEntryStudents;
    }
    return this.marksEntryStudents.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.trim().toLowerCase();
      const roll = String(s.rollNumber ?? '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }

  rebuildEntryPaging(): void {
    const pg = sliceToPage(this.filterEntryStudents(), this.entryPageIndex, this.entryPageSize);
    this.pagedMarksEntryStudents = pg.content;
    this.entryPageIndex = pg.page;
    this.entryFilteredTotal = pg.totalElements;
  }

  onEntrySearchChange(): void {
    this.entryPageIndex = 0;
    this.rebuildEntryPaging();
  }

  onEntryPageIndex(i: number): void {
    this.entryPageIndex = i;
    this.rebuildEntryPaging();
  }

  onEntryPageSize(s: number): void {
    this.entryPageSize = s;
    this.entryPageIndex = 0;
    this.rebuildEntryPaging();
  }

  private filterParentMarks(): MarkRecord[] {
    const q = this.parentResultsSearch.trim().toLowerCase();
    if (!q) {
      return this.marks;
    }
    return this.marks.filter(m => (m.subjectName || '').toLowerCase().includes(q));
  }

  rebuildParentResultsPaging(): void {
    const pg = sliceToPage(this.filterParentMarks(), this.parentResultsPageIndex, this.parentResultsPageSize);
    this.pagedParentMarks = pg.content;
    this.parentResultsPageIndex = pg.page;
    this.parentResultsFilteredTotal = pg.totalElements;
  }

  onParentResultsSearchChange(): void {
    this.parentResultsPageIndex = 0;
    this.rebuildParentResultsPaging();
  }

  onParentResultsPageIndex(i: number): void {
    this.parentResultsPageIndex = i;
    this.rebuildParentResultsPaging();
  }

  onParentResultsPageSize(s: number): void {
    this.parentResultsPageSize = s;
    this.parentResultsPageIndex = 0;
    this.rebuildParentResultsPaging();
  }

  rebuildSchedulePaging(): void {
    const pg = sliceToPage(this.scheduleDraft, this.schedulePageIndex, this.schedulePageSize);
    this.pagedScheduleDraft = pg.content;
    this.schedulePageIndex = pg.page;
    this.scheduleListTotal = pg.totalElements;
  }

  onSchedulePageIndex(i: number): void {
    this.schedulePageIndex = i;
    this.rebuildSchedulePaging();
  }

  onSchedulePageSize(s: number): void {
    this.schedulePageSize = s;
    this.schedulePageIndex = 0;
    this.rebuildSchedulePaging();
  }

  getExamBadge(status: string): string {
    if (status === 'completed') return 'badge-success';
    if (status === 'ongoing') return 'badge-warning';
    return 'badge-info';
  }

  examWorkflowLabel(state: string | undefined): string {
    const key = (state || 'APPROVED').toUpperCase();
    const tKey = `exams.workflow.${key}`;
    const t = this.translate.instant(tKey);
    return t === tKey ? key : t;
  }

  isFrozenWorkflow(state: string | undefined): boolean {
    return (state || '').toUpperCase() === 'FROZEN';
  }

  canSubmitForApproval(exam: Exam): boolean {
    if (!this.uiAccess.hasExamStaffReadAccess()) return false;
    const s = (exam.workflowState || '').toUpperCase();
    return s === 'DRAFT' || s === 'REJECTED' || s === '';
  }

  canApproveWorkflow(exam: Exam): boolean {
    if (!this.uiAccess.hasSchoolExamsOfficeWriteAccess()) return false;
    return (exam.workflowState || '').toUpperCase() === 'PENDING_APPROVAL';
  }

  canFreezeWorkflow(exam: Exam): boolean {
    if (!this.uiAccess.hasSchoolExamsOfficeWriteAccess()) return false;
    const s = (exam.workflowState || '').toUpperCase();
    return s === 'APPROVED' || s === 'PUBLISHED';
  }

  submitSelectedExamForApproval(): void {
    if (!this.selectedExam) return;
    this.confirmDialog
      .confirm({
        title: 'Send exam for approval?',
        message: 'This sends the exam setup to the exam office for final review.',
        details: [
          `Exam: ${this.selectedExam.name}`,
          'After submission, workflow state changes to Pending Approval.',
        ],
        confirmLabel: 'Submit for approval',
        cancelLabel: 'Not now',
        variant: 'primary',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.examService.submitForApproval(this.selectedExam!.id).subscribe(ex => this.patchSelectedExam(ex));
      });
  }

  approveSelectedExam(publishNow: boolean): void {
    if (!this.selectedExam) return;
    this.confirmDialog
      .confirm({
        title: publishNow ? 'Approve and publish this exam?' : 'Approve this exam?',
        message: publishNow
          ? 'The exam becomes approved and immediately available for publishing workflows.'
          : 'The exam will move to Approved state and can be published later.',
        details: [
          `Exam: ${this.selectedExam.name}`,
          `Current state: ${this.examWorkflowLabel(this.selectedExam.workflowState)}`,
        ],
        confirmLabel: publishNow ? 'Approve & publish' : 'Approve exam',
        cancelLabel: 'Cancel',
        variant: 'warning',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.examService.approveExam(this.selectedExam!.id, publishNow).subscribe(ex => this.patchSelectedExam(ex));
      });
  }

  rejectSelectedExam(): void {
    if (!this.selectedExam) return;
    this.confirmDialog
      .confirm({
        title: 'Reject this exam submission?',
        message: 'This sends the exam back for corrections before approval.',
        details: [
          `Exam: ${this.selectedExam.name}`,
          'Workflow state changes to Rejected.',
        ],
        confirmLabel: 'Reject submission',
        cancelLabel: 'Keep pending',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.examService.rejectExam(this.selectedExam!.id).subscribe(ex => this.patchSelectedExam(ex));
      });
  }

  freezeSelectedExam(): void {
    if (!this.selectedExam) return;
    this.confirmDialog
      .confirm({
        title: 'Freeze this exam?',
        message: 'Freezing locks workflow updates and prevents further operational changes.',
        details: [
          `Exam: ${this.selectedExam.name}`,
          'Use freeze only after all marks and timetable updates are complete.',
        ],
        confirmLabel: 'Freeze exam',
        cancelLabel: 'Keep editable',
        variant: 'danger',
      })
      .subscribe(ok => {
        if (!ok) return;
        this.examService.freezeExam(this.selectedExam!.id).subscribe(ex => this.patchSelectedExam(ex));
      });
  }

  private patchSelectedExam(next: Exam): void {
    this.exams = this.exams.map(e => (e.id === next.id ? next : e));
    this.selectedExam = next;
  }

  onTemplateChange(): void {
    if (this.selectedTemplateId == null) return;
    const tpl = this.examTemplates.find(t => t.id === this.selectedTemplateId);
    if (!tpl) return;
    this.newExam.examType = tpl.boardType?.toLowerCase() || this.newExam.examType;
    this.newExam.boardCode = tpl.boardType?.toUpperCase() || this.newExam.boardCode;
    this.newExam.markingScheme = tpl.defaultMarkingScheme || this.newExam.markingScheme;
    const ops = (tpl.rules as any)?.examOperations;
    if (ops) {
      this.newExam.maxPapersPerDayPerClass = Number(ops.maxPapersPerDayPerClass ?? this.newExam.maxPapersPerDayPerClass);
      this.newExam.requireRoom = !!ops.requireRoom;
      this.newExam.requireInvigilator = !!ops.requireInvigilator;
    }
  }

  private examRuleRequireRoom(): boolean {
    return !!((this.selectedExam?.gradingConfig as any)?.examOperations?.requireRoom);
  }

  private examRuleRequireInvigilator(): boolean {
    return !!((this.selectedExam?.gradingConfig as any)?.examOperations?.requireInvigilator);
  }

  private examRuleMaxPapersPerDay(): number {
    const raw = (this.selectedExam?.gradingConfig as any)?.examOperations?.maxPapersPerDayPerClass;
    const val = Number(raw ?? 0);
    return Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
  }

  getGradeBadge(grade: string): string {
    if (!grade?.trim()) return 'badge-neutral';
    if (grade.startsWith('A')) return 'badge-success';
    if (grade.startsWith('B')) return 'badge-info';
    if (grade.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  getAutoGrade(marks: number, maxMarks: number): string {
    const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'D';
  }

  getDraftMark(studentId: number): number {
    return Number(this.marksByStudent[studentId] ?? 0);
  }

  private fetchStaffExamsPage(): void {
    if (!this.staffUsesServerPaging) {
      return;
    }
    const seq = ++this.staffExamSeq;
    this.examService
      .getExamsPage({
        page: this.staffExamPageIndex,
        size: this.staffExamPageSize,
        q: this.staffExamSearch.trim() || undefined,
        status: this.selectedExamListFilterStatusParam(),
      })
      .subscribe(p => {
        if (seq !== this.staffExamSeq) {
          return;
        }
        this.exams = p.content;
        this.staffExamTotal = p.totalElements;
        this.staffExamPageIndex = p.page;
        this.staffExamPageSize = p.size;
        if (this.selectedExam) {
          const sid = this.selectedExam.id;
          const next = this.exams.find(e => e.id === sid);
          if (next) {
            this.selectExam(next);
          }
        }
        this.cdr.markForCheck();
      });
  }

  onStaffExamSearchChange(): void {
    if (!this.staffUsesServerPaging) {
      return;
    }
    if (this.staffExamSearchTimer) {
      clearTimeout(this.staffExamSearchTimer);
    }
    this.staffExamSearchTimer = setTimeout(() => {
      this.staffExamSearchTimer = null;
      this.staffExamPageIndex = 0;
      this.fetchStaffExamsPage();
    }, 350);
  }

  onStaffExamFilterChange(): void {
    this.staffExamPageIndex = 0;
    if (this.staffUsesServerPaging) {
      this.fetchStaffExamsPage();
      return;
    }
    this.clearSelectionIfNotVisible();
  }

  onStaffExamPageIndexChange(idx: number): void {
    this.staffExamPageIndex = idx;
    this.fetchStaffExamsPage();
  }

  onStaffExamPageSizeChange(size: number): void {
    this.staffExamPageSize = size;
    this.staffExamPageIndex = 0;
    this.fetchStaffExamsPage();
  }

  refreshExams(): void {
    if (this.role === 'parent') {
      forkJoin({
        children: this.parentService.getChildren()
      }).subscribe(({ children }) => {
        this.parentChildren = children ?? [];
        this.classes = this.buildSyntheticClassesFromChildren(this.parentChildren);
        if (
          this.selectedParentChildId != null &&
          !this.parentChildren.some(c => c.id === this.selectedParentChildId)
        ) {
          this.selectedParentChildId =
            this.parentChildren.length === 1 ? (this.parentChildren[0]?.id ?? null) : null;
        }
        this.onParentChildChangeForExams();
      });
      return;
    }
    this.academicService.getAcademicYears().subscribe(years => (this.academicYears = years));
    this.academicService.getClasses().subscribe(classes => (this.classes = classes));
    this.academicService.getSubjectCatalog().subscribe(rows => (this.subjectCatalog = rows ?? []));
    if (this.staffUsesServerPaging) {
      this.fetchStaffExamsPage();
      return;
    }
    this.examService.getExams().subscribe(exams => {
      this.exams = exams;
      this.clearSelectionIfNotVisible();
      if (this.selectedExam) {
        const sid = this.selectedExam.id;
        const next = exams.find(e => e.id === sid);
        if (next) this.selectExam(next);
      }
    });
  }

  private selectedExamListFilterStatusParam(): string | undefined {
    return this.selectedExamListFilter === 'ALL' ? undefined : this.selectedExamListFilter.toLowerCase();
  }

  private matchesExamListFilter(exam: Exam): boolean {
    switch (this.selectedExamListFilter) {
      case 'UPCOMING':
      case 'ONGOING':
      case 'COMPLETED':
        return (exam.status || '').toUpperCase() === this.selectedExamListFilter;
      case 'APPROVED':
      case 'FROZEN':
      case 'PUBLISHED':
        return (exam.workflowState || '').toUpperCase() === this.selectedExamListFilter;
      default:
        return true;
    }
  }

  private clearSelectionIfNotVisible(): void {
    if (!this.selectedExam) {
      return;
    }
    if (!this.examGridList.some(e => e.id === this.selectedExam!.id)) {
      this.selectedExam = null;
    }
  }

  private loadReferenceData(): void {
    this.academicService.getAcademicYears().subscribe(years => (this.academicYears = years));
    this.academicService.getClasses().subscribe(classes => (this.classes = classes));
    this.academicService.getSubjectCatalog().subscribe(rows => (this.subjectCatalog = rows ?? []));
    this.examService.getTemplates().subscribe(rows => (this.examTemplates = rows ?? []));
  }

  private loadExams(): void {
    if (this.staffUsesServerPaging) {
      this.fetchStaffExamsPage();
      return;
    }
    this.examService.getExams().subscribe(exams => (this.exams = exams));
  }
}

type SectionLite = { id: number; name: string };
