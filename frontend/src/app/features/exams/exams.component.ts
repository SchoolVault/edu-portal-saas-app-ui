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
import { runtimeConfig } from '../../core/config/runtime-config';
import { examAppliesToStudent } from '../../core/utils/exam-scope';
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
  ExamTemplate
} from '../../core/models/models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';

type ExamDetailTab = 'marks' | 'timetable';

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
  ],
  template: `
    <div data-testid="exams-page">
      <div class="erp-filter-toolbar mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'exams.pageTitle' | translate }}</h2>
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
        <div class="erp-filter-toolbar">
          <div class="erp-filter-toolbar__search">
            <div>
              <label class="erp-label">{{ 'exams.listSearch' | translate }}</label>
              <input
                type="search"
                class="erp-input"
                [(ngModel)]="staffExamSearch"
                (ngModelChange)="onStaffExamSearchChange()"
                [attr.placeholder]="'exams.listSearchPh' | translate"
              />
            </div>
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
              </div>
            </div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">
              <div><i class="bi bi-calendar3 me-1"></i>{{ exam.startDate }} → {{ exam.endDate }}</div>
              <div class="mt-1"><i class="bi bi-people me-1"></i>{{ scopeSummary(exam) }}</div>
            </div>
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

      <div *ngIf="role === 'parent' && selectedParentChildId != null && !examGridList.length" class="erp-card mb-4 animate-in empty-state">
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
              [disabled]="!selectedExam.resultsPublished"
              [title]="!selectedExam.resultsPublished ? ('exams.resultsNotPublishedTitle' | translate) : ''"
              (click)="selectedExam.resultsPublished && (parentDetailTab = 'results')"
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
          <p *ngIf="!selectedExam.resultsPublished" class="text-muted small">{{ 'exams.resultsNotPublished' | translate }}</p>
          <ng-container *ngIf="selectedExam.resultsPublished && marks.length">
            <div class="row g-2 align-items-end mb-2">
              <div class="col-md-6">
                <label class="erp-label small mb-1" erpI18nText="exams.searchParentResults"></label>
                <input type="search" class="erp-input" erpI18nPh="exams.searchParentResultsPh" [(ngModel)]="parentResultsSearch" (ngModelChange)="onParentResultsSearchChange()" />
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
          <p *ngIf="selectedExam.resultsPublished && !marks.length" class="text-muted small mb-0">{{ 'exams.noMarkRows' | translate }}</p>
        </ng-container>

        <ng-container *ngIf="detailTab === 'marks' && canEnterMarks">
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
              <select *ngIf="teacherMarksScopeActive && subjectSelectOptions.length" class="erp-select" [(ngModel)]="marksSubject">
                <option value="">{{ 'exams.selectSubject' | translate }}</option>
                <option *ngFor="let s of subjectSelectOptions" [ngValue]="s">{{ s }}</option>
              </select>
              <input
                *ngIf="!teacherMarksScopeActive"
                class="erp-input"
                erpI18nPh="exams.subjectPlaceholder"
                [(ngModel)]="marksSubject"
              />
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
        </ng-container>

        <ng-container *ngIf="role === 'parent' && parentDetailTab === 'timetable'">
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
        </ng-container>

        <ng-container *ngIf="role !== 'parent' && detailTab === 'timetable'">
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
                  <td><input class="erp-input" [(ngModel)]="row.subjectName" [disabled]="!canEditSchedule" /></td>
                  <td><input class="erp-input" [(ngModel)]="row.paperType" [disabled]="!canEditSchedule" /></td>
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
        </ng-container>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal-content-erp modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ 'exams.modalCreateTitle' | translate }}</h3>
          <button type="button" class="btn-icon" (click)="showCreateModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="erp-form-group">
            <label class="erp-label">{{ 'exams.labelExamName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="newExam.name" />
          </div>
          <div class="row g-3">
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
          <div class="erp-form-group">
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
          <div class="erp-form-group">
            <label class="erp-label">{{ 'exams.labelAcademicYear' | translate }}</label>
            <select class="erp-select" [(ngModel)]="newExam.academicYearId">
              <option [ngValue]="null">{{ 'exams.selectYear' | translate }}</option>
              <option *ngFor="let year of academicYears" [ngValue]="year.id">{{ year.name }}</option>
            </select>
          </div>
          <div class="row g-3">
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
          <div class="erp-form-group">
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
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="showCreateModal = false">{{ 'exams.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="createExam()">{{ 'exams.create' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .exam-card-pick { transition: border-color 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
      .exam-card-pick--disabled { cursor: not-allowed; opacity: 0.62; pointer-events: none; }
      .exam-card-active { border-color: var(--clr-accent) !important; box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-accent) 35%, transparent); }
      @media (max-width: 768px) {
        .modal-content-erp.modal-lg { width: min(96vw, 960px); margin: 12px auto; max-height: 92vh; overflow: auto; }
      }
    `
  ]
})
export class ExamsComponent implements OnInit {
  Math = Math;
  exams: Exam[] = [];
  marks: MarkRecord[] = [];
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  selectedExam: Exam | null = null;
  selectedClassId: number | null = null;
  marksSectionId: number | null = null;
  showCreateModal = false;
  detailTab: ExamDetailTab = 'marks';
  marksSubject = '';
  maxMarks = 100;
  marksSaving = false;
  scheduleSaving = false;
  scheduleUiMessage = '';
  scheduleUiError = false;
  marksEntryStudents: Student[] = [];
  marksByStudent: Record<number, number | null> = {};
  newExam = {
    name: '',
    examType: '',
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
  selectedParentChildId: number | null = null;
  parentDetailTab: 'timetable' | 'results' = 'timetable';

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
  private staffExamSeq = 0;
  private staffExamSearchTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private examService: ExamService,
    private academicService: AcademicService,
    private studentService: StudentService,
    private parentService: ParentService,
    private auth: AuthService,
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
    return this.role === 'admin' || this.role === 'super_admin' || this.role === 'teacher';
  }

  get canEnterMarks(): boolean {
    return this.role === 'admin' || this.role === 'teacher' || this.role === 'super_admin';
  }

  get canEditSchedule(): boolean {
    if (!(this.role === 'admin' || this.role === 'teacher' || this.role === 'super_admin')) return false;
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
    return [...base].sort(compareExamsForGrid);
  }

  get parentFilteredExams(): Exam[] {
    if (this.selectedParentChildId == null) {
      return [];
    }
    const st = this.parentChildren.find(c => c.id === this.selectedParentChildId);
    if (!st) {
      return [];
    }
    return this.exams.filter(e => examAppliesToStudent(e, st));
  }

  parentExamIsOpenable(exam: Exam): boolean {
    return (exam.status ?? '').toLowerCase() !== 'upcoming';
  }

  onExamCardClick(exam: Exam): void {
    if (this.role === 'parent' && !this.parentExamIsOpenable(exam)) {
      return;
    }
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
    if (!wantResults || this.selectedParentChildId == null) {
      return;
    }
    const visible = this.parentFilteredExams;
    const pick = visible.find(e => e.resultsPublished) ?? visible[0];
    if (pick) {
      this.selectExam(pick, 'results');
    }
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    if (this.role === 'parent') {
      this.detailTab = 'timetable';
      forkJoin({
        children: this.parentService.getChildren(),
        exams: this.examService.getParentPortalExamsAggregated()
      }).subscribe(({ children, exams }) => {
        this.parentChildren = children ?? [];
        this.classes = this.buildSyntheticClassesFromChildren(this.parentChildren);
        this.exams = exams;
        this.applyParentRouteQueryIntent();
        this.clearParentSelectionIfExamInvisible();
      });
      this.route.queryParamMap.pipe(skip(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (this.parentChildren.length) {
          this.applyParentRouteQueryIntent();
        }
      });
      return;
    }
    this.loadReferenceData();
    this.loadExams();
  }

  onParentChildChangeForExams(): void {
    if (this.role === 'parent' && this.selectedParentChildId == null) {
      this.selectedExam = null;
      this.scheduleDraft = [];
      this.marks = [];
      this.afterMarksLoaded();
      this.rebuildSchedulePaging();
      return;
    }
    this.clearParentSelectionIfExamInvisible();
    const ex = this.selectedExam;
    if (ex && this.role === 'parent') {
      this.selectExam(ex, this.parentDetailTab);
    }
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
    this.newExam = {
      name: '',
      examType: '',
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
      this.parentService.getChildExamMarks(sid, exam.id).subscribe(m => {
        this.marks = m;
        this.afterMarksLoaded();
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
    this.scheduleDraft.splice(gi, 1);
    this.rebuildSchedulePaging();
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
    this.examService.replaceSchedule(this.selectedExam.id, payload).subscribe({
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

  createExam(): void {
    if (!this.newExam.name?.trim() || this.newExam.academicYearId == null || !this.newExam.classIds.length) return;
    const classScopes: ExamClassScope[] = this.newExam.classIds.map(cid => ({
      classId: cid,
      sectionId: this.sectionChoiceByClass[cid] ?? null
    }));
    const exam: Exam = {
      id: 0,
      name: this.newExam.name.trim(),
      examType: this.newExam.examType?.trim() || 'custom',
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
    this.examService.addExam(exam, classScopes).subscribe(createdExam => {
      this.showCreateModal = false;
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
    this.marksSaving = true;
    this.examService.saveMarks(this.selectedExam.id, payload).subscribe({
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

  canSubmitForApproval(exam: Exam): boolean {
    const r = this.role;
    if (!(r === 'teacher' || r === 'admin' || r === 'super_admin')) return false;
    const s = (exam.workflowState || '').toUpperCase();
    return s === 'DRAFT' || s === 'REJECTED' || s === '';
  }

  canApproveWorkflow(exam: Exam): boolean {
    const r = this.role;
    if (!(r === 'admin' || r === 'super_admin')) return false;
    return (exam.workflowState || '').toUpperCase() === 'PENDING_APPROVAL';
  }

  canFreezeWorkflow(exam: Exam): boolean {
    const r = this.role;
    if (!(r === 'admin' || r === 'super_admin')) return false;
    const s = (exam.workflowState || '').toUpperCase();
    return s === 'APPROVED' || s === 'PUBLISHED';
  }

  submitSelectedExamForApproval(): void {
    if (!this.selectedExam) return;
    this.examService.submitForApproval(this.selectedExam.id).subscribe(ex => this.patchSelectedExam(ex));
  }

  approveSelectedExam(publishNow: boolean): void {
    if (!this.selectedExam) return;
    this.examService.approveExam(this.selectedExam.id, publishNow).subscribe(ex => this.patchSelectedExam(ex));
  }

  rejectSelectedExam(): void {
    if (!this.selectedExam) return;
    this.examService.rejectExam(this.selectedExam.id).subscribe(ex => this.patchSelectedExam(ex));
  }

  freezeSelectedExam(): void {
    if (!this.selectedExam) return;
    this.examService.freezeExam(this.selectedExam.id).subscribe(ex => this.patchSelectedExam(ex));
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
        children: this.parentService.getChildren(),
        exams: this.examService.getParentPortalExamsAggregated()
      }).subscribe(({ children, exams }) => {
        this.parentChildren = children ?? [];
        this.classes = this.buildSyntheticClassesFromChildren(this.parentChildren);
        if (
          this.selectedParentChildId != null &&
          !this.parentChildren.some(c => c.id === this.selectedParentChildId)
        ) {
          this.selectedParentChildId =
            this.parentChildren.length === 1 ? (this.parentChildren[0]?.id ?? null) : null;
        }
        this.exams = exams;
        this.clearParentSelectionIfExamInvisible();
        if (this.selectedExam) {
          const sid = this.selectedExam.id;
          const next = exams.find(e => e.id === sid);
          if (next) {
            this.selectExam(next);
          }
        }
      });
      return;
    }
    this.academicService.getAcademicYears().subscribe(years => (this.academicYears = years));
    this.academicService.getClasses().subscribe(classes => (this.classes = classes));
    if (this.staffUsesServerPaging) {
      this.fetchStaffExamsPage();
      return;
    }
    this.examService.getExams().subscribe(exams => {
      this.exams = exams;
      if (this.selectedExam) {
        const sid = this.selectedExam.id;
        const next = exams.find(e => e.id === sid);
        if (next) this.selectExam(next);
      }
    });
  }

  private loadReferenceData(): void {
    this.academicService.getAcademicYears().subscribe(years => (this.academicYears = years));
    this.academicService.getClasses().subscribe(classes => (this.classes = classes));
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
