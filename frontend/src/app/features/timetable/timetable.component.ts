import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { SchoolClass, Student, Teacher, TimetableEntry, TimetableGrid } from '../../core/models/models';
import { ParentService } from '../../core/services/parent.service';
import { OperationsService } from '../../core/services/operations.service';
import { AttendanceCoverConflictPayload, AttendanceCoverRow } from '../../core/models/operations.models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { formatSchoolClassDisplayName, formatSchoolClassName } from '../../core/i18n/school-class-display';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { RouterModule } from '@angular/router';
import { SchedulingConflictError } from '../../core/errors/scheduling-conflict.error';
import { TimetableConflictError } from '../../core/errors/timetable-conflict.error';
import {
  buildTimetableConflictDialogStrings,
  createTimetableConflictHumanLabels,
} from '../../core/timetable/timetable-conflict-dialog.builder';
import { formatDateDdMmYyyy } from '../../core/utils/date-format';
import { UserFacingHttpError } from '../../core/http/user-facing-http-error';
import {
  detectTimetableLocalViolations,
  sameTimetableClassSection,
  type TimetableLocalViolation,
  type TimetableLocalViolationKind,
} from '../../core/timetable/timetable-recurring-slot.validation';

type TimetableEntryForm = Omit<Partial<TimetableEntry>, 'teacherId' | 'classId' | 'sectionId'> & {
  teacherId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
};

type ParentTimetableContract = {
  getChildTimetableEntries(studentId: number): import('rxjs').Observable<TimetableEntry[]>;
  getChildTimetableGrid(studentId: number): import('rxjs').Observable<TimetableGrid>;
};

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ErpDatePickerComponent, ErpI18nPhDirective, TranslateModule, SchoolClassNamePipe],
  styles: [
    `
      /* Slot tiles: soft tints + left accent using app tokens (light + dark themes). */
      .timetable-slot-cell {
        --tt-accent: var(--clr-primary);
        position: relative;
        border-radius: var(--radius-md);
        padding: 10px 10px 10px 12px;
        min-height: 72px;
        border: 1px solid color-mix(in srgb, var(--tt-accent) 22%, var(--clr-border));
        background: color-mix(in srgb, var(--tt-accent) 7%, var(--clr-surface));
        box-shadow: 0 1px 0 color-mix(in srgb, var(--clr-border) 65%, transparent);
        transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        overflow: hidden;
      }
      .timetable-slot-cell::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        border-radius: var(--radius-md) 0 0 var(--radius-md);
        background: linear-gradient(180deg, color-mix(in srgb, var(--tt-accent) 92%, #fff 8%), var(--tt-accent));
        opacity: 0.95;
      }
      .timetable-slot-cell:hover {
        border-color: color-mix(in srgb, var(--tt-accent) 38%, var(--clr-border));
        box-shadow: 0 6px 18px color-mix(in srgb, var(--clr-text) 12%, transparent);
        transform: translateY(-1px);
      }
      .timetable-slot--tone-0 {
        --tt-accent: var(--clr-primary);
      }
      .timetable-slot--tone-1 {
        --tt-accent: var(--clr-info);
      }
      .timetable-slot--tone-2 {
        --tt-accent: var(--clr-success);
      }
      .timetable-slot--tone-3 {
        --tt-accent: color-mix(in srgb, var(--clr-accent) 85%, var(--clr-primary) 15%);
      }
      .timetable-slot-subject {
        font-weight: 700;
        color: var(--clr-text);
        font-size: 13px;
        line-height: 1.3;
        letter-spacing: -0.01em;
      }
      .timetable-slot-class {
        font-size: 12px;
        font-weight: 600;
        color: var(--clr-primary);
        margin-top: 2px;
      }
      .timetable-slot-teacher {
        font-size: 12px;
        color: var(--clr-text-secondary);
        margin-top: 2px;
      }
      .timetable-slot-time {
        font-size: 11px;
        color: var(--clr-text-muted);
        margin-top: 4px;
      }
      .timetable-slot-cell--week .timetable-slot-subject {
        font-size: 13px;
      }
      .timetable-slot-cell--week .timetable-slot-class {
        font-size: 11px;
      }
      .timetable-slot-cell--week .timetable-slot-teacher {
        font-size: 11px;
      }
      .timetable-slot-cell--week .timetable-slot-time {
        font-size: 10px;
      }
      .timetable-toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 1200;
        min-width: min(360px, calc(100vw - 24px));
        max-width: min(460px, calc(100vw - 24px));
        border-radius: var(--radius-md);
        box-shadow: 0 10px 28px color-mix(in srgb, var(--clr-text) 18%, transparent);
      }
      .btn-group-erp .active-layout {
        background: var(--clr-primary);
        color: #fff;
        border-color: var(--clr-primary);
      }
      .timetable-calendar td {
        vertical-align: top;
      }
      .timetable-calendar-week .timetable-slot-cell {
        min-height: 88px;
      }
      .classic-wrap .timetable-slot-cell {
        box-shadow: 0 1px 2px color-mix(in srgb, var(--clr-text) 6%, transparent);
      }
      .timetable-slot--cover {
        --tt-accent: var(--clr-info);
        border-color: color-mix(in srgb, var(--clr-info) 40%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-info) 12%, var(--clr-surface));
      }
      .timetable-slot--cover::before {
        background: linear-gradient(180deg, color-mix(in srgb, var(--clr-info) 95%, #fff 5%), var(--clr-info));
      }
      .timetable-slot-empty {
        display: inline-block;
        min-height: 40px;
        min-width: 100%;
        padding: 8px;
        border-radius: var(--radius-sm, 6px);
        border: 1px dashed color-mix(in srgb, var(--clr-text-muted) 35%, var(--clr-border));
        color: var(--clr-text-muted);
        font-size: 12px;
        background: color-mix(in srgb, var(--clr-surface-muted) 50%, transparent);
      }
      /* Page heading: keep actions aligned when title + toggles wrap (parent / narrow viewports). */
      .timetable-page-heading .timetable-heading-text {
        min-width: 0;
      }
      .timetable-page-title {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
      }
      .timetable-toolbar-actions {
        row-gap: 8px;
      }
      /* Classic grid: fluid columns — avoid min-width:180px × N forcing horizontal page scroll. */
      .timetable-classic-scroll {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .timetable-classic-table {
        width: max-content;
        min-width: 100%;
        table-layout: auto;
      }
      .timetable-classic-table th,
      .timetable-classic-table td {
        vertical-align: top;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .timetable-classic-table th:first-child,
      .timetable-classic-table td:first-child {
        width: 6.25rem;
        white-space: nowrap;
      }
      .timetable-classic-table.erp-table thead th {
        padding: 8px 6px;
        font-size: 10px;
        letter-spacing: 0.04em;
      }
      .timetable-classic-table.erp-table tbody td {
        padding: 6px;
      }
      col.timetable-classic-col-day {
        width: 6.25rem;
      }
      col.timetable-classic-col-slot {
        width: 9rem;
      }
      .timetable-calendar {
        width: max-content;
        min-width: 100%;
      }
      .timetable-calendar th,
      .timetable-calendar td {
        min-width: 9rem;
      }
      .classic-wrap .timetable-slot-cell {
        min-height: 64px;
        padding: 8px 8px 8px 11px;
      }
      .classic-wrap .timetable-slot-subject {
        font-size: 12px;
      }
      .classic-wrap .timetable-slot-class {
        font-size: 11px;
      }
      .classic-wrap .timetable-slot-teacher {
        font-size: 11px;
      }
      .classic-wrap .timetable-slot-time {
        font-size: 10px;
        margin-top: 3px;
      }
      @media (max-width: 767.98px) {
        .timetable-toast {
          right: 12px;
          left: 12px;
          bottom: 12px;
          min-width: unset;
          max-width: unset;
        }
      }
      @media (max-width: 767.98px) {
        .timetable-page-title {
          font-size: 20px;
        }
        .timetable-toolbar-wrap,
        .timetable-toolbar-actions,
        .timetable-toolbar-actions .btn-group-erp {
          width: 100%;
        }
        .timetable-toolbar-actions .btn-outline-erp,
        .timetable-toolbar-actions .btn-primary-erp {
          flex: 1 1 auto;
          justify-content: center;
        }
        col.timetable-classic-col-slot,
        .timetable-calendar th,
        .timetable-calendar td {
          min-width: 8.5rem;
        }
        .timetable-slot-cell {
          min-height: 68px;
          padding: 8px 8px 8px 10px;
        }
        .timetable-slot-subject {
          font-size: 12px;
        }
        .timetable-slot-class,
        .timetable-slot-teacher {
          font-size: 11px;
        }
      }
    `,
  ],
  template: `
    <div data-testid="timetable-page">
      <div *ngIf="toastMessage" class="alert alert-success timetable-toast mb-0 py-2 px-3" role="status">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <span>{{ toastMessage }}</span>
          <button type="button" class="btn-close" (click)="clearToast()" [attr.aria-label]="'timetable.closeToast' | translate"></button>
        </div>
      </div>
      <div
        class="timetable-page-heading mb-4 animate-in d-flex flex-column flex-lg-row gap-3 align-items-stretch align-items-lg-center justify-content-lg-between"
      >
        <div class="timetable-heading-text flex-grow-1">
          <h2 class="timetable-page-title">{{ 'timetable.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="!isParent">{{ 'timetable.leadAdmin' | translate }}</p>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="isParent">{{ 'timetable.leadParent' | translate }}</p>
        </div>
        <div class="timetable-toolbar-wrap flex-shrink-0" *ngIf="!isAdmin || timetableSection === 'schedule'">
          <div class="d-flex flex-wrap gap-2 align-items-center timetable-toolbar-actions justify-content-start justify-content-lg-end">
            <div class="btn-group-erp d-flex gap-1" *ngIf="isAdmin">
              <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="scheduleScope === 'class'" (click)="setScheduleScope('class')">
                {{ 'timetable.scopeClass' | translate }}
              </button>
              <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="scheduleScope === 'teacher'" (click)="setScheduleScope('teacher')">
                {{ 'timetable.scopeTeacher' | translate }}
              </button>
            </div>
            <div class="btn-group-erp d-flex gap-1">
              <button
                *ngIf="!isParent"
                type="button"
                class="btn-outline-erp btn-sm"
                [class.active-layout]="layout === 'dayRows'"
                (click)="setTimetableLayout('dayRows')"
              >
                {{ 'timetable.layoutClassic' | translate }}
              </button>
              <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="layout === 'periodRows'" (click)="setTimetableLayout('periodRows')">
                {{ 'timetable.layoutWeek' | translate }}
              </button>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="refreshTimetable()">
              <i class="bi bi-arrow-clockwise"></i> {{ 'timetable.refresh' | translate }}
            </button>
            <button
              *ngIf="canMutateTimetable && scheduleScope === 'class'"
              class="btn-primary-erp btn-sm"
              [disabled]="!canEditTimetable()"
              (click)="openCreateModal()"
              type="button"
            >
              <i class="bi bi-plus-lg"></i> {{ 'timetable.addSlot' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div class="erp-tabs mb-3" *ngIf="isAdmin">
        <button type="button" class="erp-tab" [class.active]="timetableSection === 'schedule'" (click)="setTimetableSection('schedule')">
          {{ 'timetable.tab.schedule' | translate }}
        </button>
        <button type="button" class="erp-tab" [class.active]="timetableSection === 'covers'" (click)="setTimetableSection('covers')">
          {{ 'timetable.tab.coversAdmin' | translate }}
        </button>
        <button type="button" class="erp-tab" (click)="openAssignTimetableTab()">
          {{ 'timetable.tab.assign' | translate }}
        </button>
      </div>

      <ng-container *ngIf="!isAdmin || timetableSection === 'schedule'">
      <div class="erp-card mb-4 animate-in" *ngIf="isParent">
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="erp-label">{{ 'timetable.labelChild' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedChildId" (change)="onParentChildChange()">
              <option [ngValue]="null">{{ 'timetable.selectChild' | translate }}</option>
              <option *ngFor="let ch of myChildren" [ngValue]="ch.id">
                {{ ch.firstName }} {{ ch.lastName }} — {{ ch.className | schoolClassName }} {{ ch.sectionName }}
              </option>
            </select>
          </div>
          <p class="text-muted small col-12 mb-0">{{ 'timetable.parentHint' | translate }}</p>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in" *ngIf="!isParent">
        <div class="row g-3 align-items-end" *ngIf="scheduleScope === 'class'">
          <div class="col-md-3">
            <label class="erp-label">{{ 'timetable.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
              <option [ngValue]="null">{{ 'timetable.selectClass' | translate }}</option>
              <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
            </select>
          </div>
          <div class="col-md-3" *ngIf="sections.length">
            <label class="erp-label">{{ 'timetable.labelSection' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedSectionId" (change)="loadTimetable()">
              <option [ngValue]="null">{{ 'timetable.selectSection' | translate }}</option>
              <option *ngFor="let sec of sections" [ngValue]="sec.id">{{ sec.name }}</option>
            </select>
          </div>
          <div class="col-md-3" *ngIf="selectedClassTeacherName">
            <label class="erp-label">{{ 'timetable.labelClassTeacher' | translate }}</label>
            <input class="erp-input" [value]="selectedClassTeacherName" readonly />
          </div>
          <div class="col-md-3">
            <label class="erp-label">{{ 'timetable.labelSessionDate' | translate }}</label>
            <app-erp-date-picker
              [(ngModel)]="classViewDate"
              (ngModelChange)="onClassViewDateChange()"
              placeholderI18nKey="timetable.datePlaceholderCover"
            />
          </div>
        </div>
        <div class="row g-3 align-items-end" *ngIf="scheduleScope === 'teacher'">
          <div class="col-md-4" *ngIf="!isTeacherViewer">
            <label class="erp-label">{{ 'timetable.labelTeacher' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedTeacherId" (change)="onTeacherChange()">
              <option [ngValue]="null">{{ 'timetable.selectTeacher' | translate }}</option>
              <option *ngFor="let t of teachers" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
            </select>
          </div>
          <div [class.col-md-4]="!isTeacherViewer" [class.col-md-6]="isTeacherViewer">
            <label class="erp-label">{{ 'timetable.labelSessionDate' | translate }}</label>
            <app-erp-date-picker
              [(ngModel)]="teacherViewDate"
              (ngModelChange)="onTeacherViewDateChange()"
              placeholderI18nKey="timetable.datePlaceholderCover"
            />
          </div>
          <p class="text-muted small col-12 mb-0">
            <ng-container *ngIf="isAdmin">
              {{ 'timetable.hintAdminCoverBefore' | translate }}<strong>{{ 'timetable.hintAdminCoverStrong' | translate }}</strong
              >{{ 'timetable.hintAdminCoverAfter' | translate }}
            </ng-container>
            <ng-container *ngIf="isTeacherViewer">
              {{ 'timetable.hintTeacherCoverBefore' | translate }}<span class="badge-erp badge-info" style="font-size: 10px;">{{
                'timetable.coverBadge' | translate
              }}</span
              >{{ 'timetable.hintTeacherCoverAfter' | translate }}
            </ng-container>
            <ng-container *ngIf="!isAdmin && !isTeacherViewer && !isParent">{{ 'timetable.hintReadOnly' | translate }}</ng-container>
          </p>
        </div>
        <p *ngIf="scheduleScope === 'class' && selectedClassId && !sections.length" class="text-muted small mt-2 mb-0">
          {{ 'timetable.noSectionsClass' | translate }}
        </p>
        <p *ngIf="scheduleScope === 'class' && selectedClassId && sections.length && !selectedSectionId" class="text-muted small mt-2 mb-0">
          {{ 'timetable.pickSection' | translate }}
        </p>
        <p *ngIf="scheduleScope === 'teacher' && isAdmin && selectedTeacherId" class="text-muted small mt-2 mb-0">
          {{ 'timetable.teacherGridHint' | translate }}
        </p>
      </div>

      <div class="erp-card mb-4 animate-in" *ngIf="showTeacherScheduleEmptyHint || showClassScheduleEmptyHint">
        <p class="text-muted mb-0 small">{{ 'timetable.emptyTeacherSession' | translate }}</p>
      </div>

      <div class="erp-card mb-4 classic-wrap animate-in" *ngIf="grid?.days?.length && layout === 'dayRows'">
        <div class="timetable-classic-scroll">
          <table class="erp-table timetable-classic-table">
            <colgroup>
              <col class="timetable-classic-col-day" />
              <col *ngFor="let p of grid?.periods" class="timetable-classic-col-slot" />
            </colgroup>
            <thead>
              <tr>
                <th>{{ 'timetable.gridDayPeriod' | translate }}</th>
                <th *ngFor="let period of grid?.periods">{{ 'timetable.gridPeriod' | translate: { n: period } }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of grid?.days">
                <td>
                  <strong>{{ weekdayLabel(day) }}</strong>
                </td>
                <td *ngFor="let period of grid?.periods">
                  <ng-container *ngIf="getEntry(day, period) as entry; else emptySlot">
                    <div
                      class="timetable-slot-cell"
                      [ngClass]="slotToneClass(period)"
                      [class.timetable-slot--cover]="isCoverRow(entry)"
                    >
                      <div class="d-flex align-items-center gap-1 flex-wrap mb-1">
                        <span *ngIf="isCoverRow(entry)" class="badge-erp badge-info" style="font-size: 9px; text-transform: uppercase;">{{
                          'timetable.coverBadge' | translate
                        }}</span>
                        <span *ngIf="isCoverRow(entry) && entry.coverForDate" class="text-muted" style="font-size: 10px;">{{ entry.coverForDate }}</span>
                      </div>
                      <div class="timetable-slot-subject">{{ entry.subjectName }}</div>
                      <div class="timetable-slot-class">{{ entryClassSectionLabel(entry) }}</div>
                      <div *ngIf="!isTeacherViewer" class="timetable-slot-teacher">{{ entry.teacherName }}</div>
                      <div class="timetable-slot-time">{{ entry.startTime }} - {{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-2 mt-2" *ngIf="canMutateTimetable && !isCoverRow(entry)">
                        <button class="btn-outline-erp btn-xs" (click)="openEditModal(entry)">{{ 'timetable.edit' | translate }}</button>
                        <button class="btn-outline-erp btn-xs" (click)="deleteEntry(entry.id)">{{ 'timetable.delete' | translate }}</button>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #emptySlot>
                    <span class="timetable-slot-empty">—</span>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card mb-4 timetable-calendar-week animate-in" *ngIf="grid?.days?.length && layout === 'periodRows'">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h4 class="erp-card-title mb-0" style="font-size: 15px;">{{ 'timetable.weekMatrixTitle' | translate }}</h4>
          <div class="d-flex align-items-center flex-wrap gap-2">
            <span *ngIf="!isParent" class="text-muted small">{{ 'timetable.weekMatrixSubtitle' | translate }}</span>
            <button
              *ngIf="canMutateTimetable && canEditTimetable() && scheduleScope === 'class'"
              type="button"
              class="btn-outline-erp btn-xs"
              (click)="addPeriodRow()"
            >
              <i class="bi bi-plus-lg"></i> {{ 'timetable.addPeriodRow' | translate }}
            </button>
          </div>
        </div>
        <div class="timetable-classic-scroll">
          <table class="erp-table timetable-calendar">
            <thead>
              <tr>
                <th style="min-width: 88px;">{{ 'timetable.thPeriod' | translate }}</th>
                <th *ngFor="let day of grid?.days" style="min-width: 160px;">{{ weekdayLabel(day) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let period of periodRowsForWeekView">
                <td>
                  <div class="d-flex align-items-center justify-content-between gap-2">
                    <strong>{{ 'timetable.gridPeriodShort' | translate: { n: period } }}</strong>
                    <button
                      *ngIf="canMutateTimetable && canEditTimetable() && scheduleScope === 'class'"
                      type="button"
                      class="btn-outline-erp btn-xs"
                      (click)="requestRemovePeriodRow(period)"
                    >
                      {{ 'timetable.removeRow' | translate }}
                    </button>
                  </div>
                </td>
                <td *ngFor="let day of grid?.days">
                  <ng-container *ngIf="getEntry(day, period) as entry; else emptyCal">
                    <div
                      class="timetable-slot-cell timetable-slot-cell--week"
                      [ngClass]="slotToneClass(period)"
                      [class.timetable-slot--cover]="isCoverRow(entry)"
                    >
                      <div *ngIf="isCoverRow(entry)" class="mb-1">
                        <span class="badge-erp badge-info" style="font-size: 8px;">{{ 'timetable.coverBadge' | translate }}</span>
                      </div>
                      <div class="timetable-slot-subject">{{ entry.subjectName }}</div>
                      <div class="timetable-slot-class">{{ entryClassSectionLabel(entry) }}</div>
                      <div *ngIf="!isTeacherViewer" class="timetable-slot-teacher">{{ entry.teacherName }}</div>
                      <div class="timetable-slot-time">{{ entry.startTime }}-{{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-1 mt-1 flex-wrap" *ngIf="canMutateTimetable && !isCoverRow(entry)">
                        <button class="btn-outline-erp btn-xs" (click)="openEditModal(entry)">{{ 'timetable.edit' | translate }}</button>
                        <button class="btn-outline-erp btn-xs" (click)="deleteEntry(entry.id)">{{ 'timetable.deleteShort' | translate }}</button>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #emptyCal>
                    <span class="timetable-slot-empty">{{ 'timetable.emptyCell' | translate }}</span>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </ng-container>

      <div class="erp-card animate-in mb-4" *ngIf="isAdmin && timetableSection === 'covers'">
        <h4 class="erp-card-title mb-3">{{ 'operations.covers.title' | translate }}</h4>
        <p class="text-muted small mb-3">{{ 'timetable.coversAdminLead' | translate }}</p>
        <div *ngIf="coverAdminError" class="alert alert-danger py-2 px-3 small mb-3" style="border-radius: var(--radius-md);">{{ coverAdminError }}</div>
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelDate' | translate }}</label>
            <app-erp-date-picker
              [(ngModel)]="coverDate"
              (ngModelChange)="reloadCoversAdmin()"
              [minDate]="todayIso"
              placeholderI18nKey="operations.covers.phCoverDate"
            />
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.classId" (change)="onCoverClassChanged()">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name | schoolClassName }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelSection' | translate }}</label>
            <select
              class="erp-select"
              [(ngModel)]="coverForm.sectionId"
              [compareWith]="compareCoverSectionIds"
              (ngModelChange)="refreshCoverRegularTeacher()"
            >
              <!-- With sections: explicit null option so the browser does not show the first section while ngModel stays null. -->
              <option *ngIf="coverSections.length > 0" [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngIf="coverSections.length === 0" [ngValue]="null">{{ 'timetable.sectionWholeClass' | translate }}</option>
              <option *ngFor="let s of coverSections" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelPeriod' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.periodNumber" (ngModelChange)="refreshCoverRegularTeacher()">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let p of coverPeriodOptions" [ngValue]="p">{{ p }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelRegularTeacher' | translate }}</label>
            <input class="erp-input" [value]="coverSlotRegularTeacherName" readonly />
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelSubstituteTeacher' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.coveringTeacherId">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let te of coverTeachersForDropdown" [ngValue]="te.id">{{ te.firstName }} {{ te.lastName }}</option>
            </select>
          </div>
        </div>
        <div class="erp-form-group mb-3">
          <label class="erp-label">{{ 'operations.covers.labelReason' | translate }}</label>
          <input type="text" class="erp-input" [(ngModel)]="coverForm.reason" erpI18nPh="operations.covers.phReason" />
        </div>
        <button type="button" class="btn-primary-erp btn-sm me-2" (click)="submitCover()">{{ 'operations.covers.addCover' | translate }}</button>
        <button type="button" class="btn-outline-erp btn-sm" (click)="reloadCoversAdmin()">{{ 'operations.covers.refreshList' | translate }}</button>
        <div class="erp-table-scroll mt-3">
        <table class="erp-table mb-0">
          <thead>
            <tr>
              <th>{{ 'operations.covers.thDate' | translate }}</th>
              <th>{{ 'operations.covers.thClass' | translate }}</th>
              <th>{{ 'operations.covers.thSection' | translate }}</th>
              <th>{{ 'operations.covers.thPeriod' | translate }}</th>
              <th>{{ 'operations.covers.labelRegularTeacher' | translate }}</th>
              <th>{{ 'operations.covers.thCovering' | translate }}</th>
              <th>{{ 'operations.covers.thStatus' | translate }}</th>
              <th>{{ 'students.list.thActions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of coversAdmin">
              <td>{{ formatCoverTableDate(c.coverDate) }}</td>
              <td>{{ coverRowClassDisplay(c) | schoolClassName }}</td>
              <td>{{ coverRowSectionDisplay(c) }}</td>
              <td>{{ c.periodNumber ?? ('transport.dash' | translate) }}</td>
              <td>{{ coverRowRegularTeacherDisplay(c) }}</td>
              <td>{{ coverRowTeacherDisplay(c) }}</td>
              <td>{{ c.status }}</td>
              <td>
                <button *ngIf="c.status === 'ACTIVE'" type="button" class="btn-outline-erp btn-xs" (click)="cancelCoverAdmin(c)">
                  {{ 'operations.covers.cancel' | translate }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ (editingEntryId != null ? 'timetable.modalEdit' : 'timetable.modalAdd') | translate }}</h3>
          <button class="btn-icon" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="erp-label">{{ 'timetable.labelDay' | translate }}</label>
              <select class="erp-select" [(ngModel)]="entryForm.day" [disabled]="editingEntryId != null">
                <option *ngFor="let day of dayOptions" [value]="day">{{ ('timetable.days.' + day.toLowerCase()) | translate }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="erp-label">{{ 'timetable.labelPeriod' | translate }}</label>
              <input class="erp-input" type="number" [(ngModel)]="entryForm.period" [disabled]="editingEntryId != null" />
            </div>
            <div class="col-md-6">
              <label class="erp-label">{{ 'timetable.labelTeacherForm' | translate }}</label>
              <select
                class="erp-select"
                [(ngModel)]="entryForm.teacherId"
                (change)="syncTeacherName()"
                [disabled]="scheduleScope === 'teacher' && selectedTeacherId != null && editingEntryId == null"
              >
                <option [ngValue]="null">{{ 'timetable.selectTeacherForm' | translate }}</option>
                <option *ngFor="let teacher of teachers" [ngValue]="teacher.id">{{ teacher.firstName }} {{ teacher.lastName }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="erp-label">{{ 'timetable.labelSubject' | translate }}</label>
              <select class="erp-select" [(ngModel)]="entryForm.subjectName" name="slotSubjectSel">
                <option [ngValue]="''">{{ 'timetable.selectSubject' | translate }}</option>
                <option *ngFor="let n of subjectCatalogNames" [ngValue]="n">{{ n }}</option>
              </select>
              <p *ngIf="!subjectCatalogNames.length" class="small mb-1 mt-1" style="color: var(--clr-warning);">
                {{ 'timetable.subjectCatalogEmpty' | translate }}
                <a routerLink="/app/academic" fragment="erp-subject-catalog" class="ms-1">{{ 'timetable.manageSubjectCatalog' | translate }}</a>
              </p>
            </div>
            <ng-container *ngIf="scheduleScope === 'teacher'">
              <div class="col-md-6">
                <label class="erp-label">{{ 'timetable.labelClassForm' | translate }}</label>
                <select class="erp-select" [(ngModel)]="entryForm.classId" (change)="onEntryFormClassChange()">
                  <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name | schoolClassName }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="erp-label">{{ 'timetable.labelSection' | translate }}</label>
                <select class="erp-select" [(ngModel)]="entryForm.sectionId">
                  <option *ngIf="entryFormSections.length === 0" [ngValue]="null">{{ 'timetable.sectionWholeClass' | translate }}</option>
                  <option *ngFor="let sec of entryFormSections" [ngValue]="sec.id">{{ sec.name }}</option>
                </select>
              </div>
            </ng-container>
            <div class="col-12">
              <label class="erp-label">{{ 'timetable.timePicker12hTitle' | translate }}</label>
              <div class="d-flex flex-wrap gap-3 align-items-end mb-2">
                <div>
                  <span class="small text-muted d-block mb-1">{{ 'timetable.labelStart' | translate }}</span>
                  <div class="d-flex gap-1 align-items-center flex-wrap timetable-slot-time-row">
                    <select class="erp-select" style="min-width: 4.25rem" [(ngModel)]="modalTime12.startH" name="slotSh">
                      <option *ngFor="let h of modalHours12" [ngValue]="h">{{ h }}</option>
                    </select>
                    <select class="erp-select" style="min-width: 4.25rem" [(ngModel)]="modalTime12.startM" name="slotSm">
                      <option *ngFor="let m of modalMinuteOptions" [ngValue]="m">{{ m }}</option>
                    </select>
                    <select class="erp-select" style="min-width: 4.5rem" [(ngModel)]="modalTime12.startAp" name="slotSap">
                      <option ngValue="AM">AM</option>
                      <option ngValue="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span class="small text-muted d-block mb-1">{{ 'timetable.labelEnd' | translate }}</span>
                  <div class="d-flex gap-1 align-items-center flex-wrap timetable-slot-time-row">
                    <select class="erp-select" style="min-width: 4.25rem" [(ngModel)]="modalTime12.endH" name="slotEh">
                      <option *ngFor="let h of modalHours12" [ngValue]="h">{{ h }}</option>
                    </select>
                    <select class="erp-select" style="min-width: 4.25rem" [(ngModel)]="modalTime12.endM" name="slotEm">
                      <option *ngFor="let m of modalMinuteOptions" [ngValue]="m">{{ m }}</option>
                    </select>
                    <select class="erp-select" style="min-width: 4.5rem" [(ngModel)]="modalTime12.endAp" name="slotEap">
                      <option ngValue="AM">AM</option>
                      <option ngValue="PM">PM</option>
                    </select>
                  </div>
                </div>
                <button type="button" class="btn-primary-erp btn-sm" (click)="applyModal12hTimes()">
                  {{ 'timetable.applyTimes' | translate }}
                </button>
              </div>
              <p class="small text-muted mb-0" *ngIf="slotModalTimesApplied">
                {{ 'timetable.storedTimesHint' | translate }}
                <strong class="text-body">{{ entryForm.startTime }} – {{ entryForm.endTime }}</strong>
              </p>
            </div>
            <div class="col-md-12">
              <label class="erp-label">{{ 'timetable.labelRoom' | translate }}</label>
              <input class="erp-input" [(ngModel)]="entryForm.room" />
            </div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="closeModal()">{{ 'timetable.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveEntry()">{{ (editingEntryId != null ? 'timetable.update' : 'timetable.create') | translate }}</button>
        </div>
      </div>
    </div>
  `,
})
export class TimetableComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly uiAccess = inject(UiAccessService);

  classes: SchoolClass[] = [];
  sections: { id: number; name: string }[] = [];
  teachers: Teacher[] = [];
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;
  selectedTeacherId: number | null = null;
  scheduleScope: 'class' | 'teacher' = 'class';
  isAdmin = false;
  isParent = false;
  canMutateTimetable = false;
  myChildren: Student[] = [];
  selectedChildId: number | null = null;
  entries: TimetableEntry[] = [];
  grid: TimetableGrid | null = null;
  layout: 'dayRows' | 'periodRows' = 'dayRows';
  /** Admin-only: schedule grid vs attendance cover assignments (aligned with Operations hub data). */
  timetableSection: 'schedule' | 'covers' = 'schedule';
  coverDate = new Date().toISOString().split('T')[0];
  coverForm = {
    classId: null as number | null,
    sectionId: null as number | null,
    coveringTeacherId: null as number | null,
    reason: '',
    periodNumber: null as number | null,
  };
  coversAdmin: AttendanceCoverRow[] = [];
  coverAdminError = '';
  /** Timetable teacher scheduled for the selected class/section/period on the cover date (excluded from covering dropdown). */
  coverSlotRegularTeacherId: number | null = null;
  coverPeriodOptions: number[] = [];
  showModal = false;
  editingEntryId: number | null = null;
  dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  entryForm: TimetableEntryForm = this.defaultEntryForm();
  /** Subject names from catalog (Add/Edit slot — strict picklist). */
  subjectCatalogNames: string[] = [];
  /** Shown only after the user clicks “Apply times” (or when editing an existing saved slot). */
  slotModalTimesApplied = false;
  /** 12-hour clock controls for the slot modal; applied explicitly so users confirm times. */
  modalTime12 = {
    startH: '8',
    startM: '00',
    startAp: 'AM' as 'AM' | 'PM',
    endH: '8',
    endM: '45',
    endAp: 'AM' as 'AM' | 'PM',
  };
  readonly modalHours12 = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  readonly modalMinuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  /** Local calendar date (YYYY-MM-DD); avoids UTC drift from `toISOString()` for “today”. */
  teacherViewDate = '';
  /** Same semantics as {@link #teacherViewDate}: which calendar day’s recurring rows to show in “by class” classic (day) layout. */
  classViewDate = '';
  /** Raw API rows for “by teacher” scope (classic view may show one weekday; week matrix uses the full week). */
  private teacherScheduleRows: TimetableEntry[] = [];
  /** Full week entries for “by class” before day vs week layout filtering. */
  private classScheduleRows: TimetableEntry[] = [];
  /** Admin-added empty period rows (so new slots can be added before backend has rows for that period). */
  private manualPeriodRows = new Set<number>();
  toastMessage = '';
  private toastClearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private timetableService: TimetableService,
    private academicService: AcademicService,
    private teacherService: TeacherService,
    private parentService: ParentService,
    private operations: OperationsService,
    private confirmDialog: ConfirmDialogService,
    private auth: AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get coverSections(): { id: number; name: string }[] {
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  get coverTeachersForDropdown(): Teacher[] {
    const skip = this.coverSlotRegularTeacherId;
    if (skip == null) {
      return this.teachers;
    }
    return this.teachers.filter(t => Number(t.id) !== Number(skip));
  }

  get coverSlotRegularTeacherName(): string {
    if (this.coverSlotRegularTeacherId == null) {
      return this.translate.instant('operations.covers.notAvailable');
    }
    const t = this.teachers.find(x => Number(x.id) === Number(this.coverSlotRegularTeacherId));
    return t ? `${t.firstName} ${t.lastName}`.trim() : this.translate.instant('operations.covers.notAvailable');
  }

  formatCoverTableDate(raw: string | null | undefined): string {
    return formatDateDdMmYyyy(raw) || '—';
  }

  onCoverClassChanged(): void {
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    const secs = cls?.sections ?? [];
    if (secs.length === 1) {
      this.coverForm.sectionId = secs[0].id;
    } else {
      this.coverForm.sectionId = null;
    }
    this.refreshCoverRegularTeacher();
  }

  /** Aligns select ngModel with option values when API/mock mixes number vs string ids. */
  compareCoverSectionIds(a: number | null | undefined, b: number | null | undefined): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
  }

  get entryFormSections(): { id: number; name: string }[] {
    const cid = this.entryForm.classId ?? undefined;
    const c = cid != null ? this.classes.find(x => x.id === cid) : undefined;
    return c ? c.sections.map(s => ({ id: s.id, name: s.name })) : [];
  }

  get selectedClassTeacherName(): string {
    if (this.selectedClassId == null) {
      return '';
    }
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) {
      return '';
    }
    if (!cls.sections?.length) {
      return cls.classTeacherName?.trim() || this.translate.instant('timetable.classTeacherNotAssigned');
    }
    const sid = this.selectedSectionId;
    if (sid == null) {
      return this.translate.instant('timetable.classTeacherSelectSectionHint');
    }
    const sec = cls.sections.find(s => s.id === sid);
    return sec?.classTeacherName?.trim() || this.translate.instant('timetable.classTeacherNotAssigned');
  }

  /** Human-readable class name for cover admin list (falls back to id). */
  coverRowClassDisplay(row: AttendanceCoverRow): string {
    return formatSchoolClassDisplayName(row.classId, this.classes.find(x => x.id === row.classId)?.name, this.translate);
  }

  /** Human-readable section for cover list (whole-class / all-sections / section name). */
  coverRowSectionDisplay(row: AttendanceCoverRow): string {
    const cls = this.classes.find(x => x.id === row.classId);
    if (!cls?.sections?.length) {
      return this.translate.instant('timetable.sectionWholeClass');
    }
    if (row.sectionId == null) {
      return this.translate.instant('operations.covers.allSections');
    }
    return cls.sections.find(s => s.id === row.sectionId)?.name ?? String(row.sectionId);
  }

  coverRowTeacherDisplay(row: AttendanceCoverRow): string {
    const t = this.teachers.find(x => x.id === row.coveringTeacherId);
    return t ? `${t.firstName} ${t.lastName}`.trim() : String(row.coveringTeacherId);
  }

  coverRowRegularTeacherDisplay(row: AttendanceCoverRow): string {
    if (row.regularTeacherId == null) {
      return this.translate.instant('operations.covers.notAvailable');
    }
    const t = this.teachers.find(x => x.id === row.regularTeacherId);
    return t ? `${t.firstName} ${t.lastName}`.trim() : String(row.regularTeacherId);
  }

  /** Resolve the regular teacher from the recurring timetable for the cover form (local calendar weekday + period). */
  refreshCoverRegularTeacher(): void {
    this.coverSlotRegularTeacherId = null;
    this.coverPeriodOptions = [];
    const cid = this.coverForm.classId;
    if (cid == null) {
      this.clearCoverTeacherIfInvalid();
      return;
    }
    const cls = this.classes.find(c => c.id === cid);
    const hasSecs = (cls?.sections?.length ?? 0) > 0;
    if (hasSecs && this.coverForm.sectionId == null) {
      this.clearCoverTeacherIfInvalid();
      return;
    }
    const secParam = hasSecs ? this.coverForm.sectionId! : undefined;
    this.timetableService.getByClassAndSection(cid, secParam).subscribe({
      next: entries => {
        this.coverPeriodOptions = this.timetableService.listPeriodsForCoverDate(entries, this.coverDate);
        const currentPeriod = this.coverForm.periodNumber != null ? Number(this.coverForm.periodNumber) : null;
        if (currentPeriod == null || !this.coverPeriodOptions.includes(currentPeriod)) {
          this.coverForm.periodNumber = this.coverPeriodOptions.length === 1 ? this.coverPeriodOptions[0] : null;
        }
        const period = Number(this.coverForm.periodNumber);
        const tid = Number.isFinite(period) && period > 0
          ? this.timetableService.findRegularTeacherIdForCoverSlot(entries, this.coverDate, period)
          : null;
        this.coverSlotRegularTeacherId = tid;
        if (tid != null && Number(this.coverForm.coveringTeacherId) === Number(tid)) {
          this.coverForm.coveringTeacherId = null;
        }
        this.clearCoverTeacherIfInvalid();
        this.cdr.markForCheck();
      },
      error: () => {
        this.coverSlotRegularTeacherId = null;
        this.coverPeriodOptions = [];
        this.coverForm.periodNumber = null;
        this.clearCoverTeacherIfInvalid();
        this.cdr.markForCheck();
      },
    });
  }

  private clearCoverTeacherIfInvalid(): void {
    const allowed = new Set(this.coverTeachersForDropdown.map(t => Number(t.id)));
    const cur = this.coverForm.coveringTeacherId;
    if (cur != null && !allowed.has(Number(cur))) {
      this.coverForm.coveringTeacherId = null;
    }
  }

  private buildCoverConflictLocationLine(c: AttendanceCoverConflictPayload): string {
    const labels = createTimetableConflictHumanLabels(this.classes, this.translate);
    const classId = c.classId ?? this.coverForm.classId;
    if (classId == null) {
      return '—';
    }
    const sectionId = c.sectionId !== undefined ? c.sectionId : this.coverForm.sectionId;
    let loc = `${labels.classDisplayName(classId)} · ${labels.sectionDisplayForClass(classId, sectionId)}`;
    const p = c.periodNumber;
    if (p != null && p > 0) {
      loc += ` · ${this.translate.instant('timetable.gridPeriod', { n: p })}`;
    }
    return this.translate.instant('operations.covers.conflictDetailScope', { location: loc });
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    this.teacherViewDate = this.defaultTeacherSessionCalendarDate();
    this.classViewDate = this.defaultTeacherSessionCalendarDate();

    const r = this.auth.getNormalizedRole();
    this.isAdmin = this.uiAccess.hasAcademicDeskAdminAccess();
    this.isParent = r === 'parent';
    this.canMutateTimetable = this.uiAccess.hasAcademicDeskAdminAccess();
    if (this.isParent) {
      this.layout = 'periodRows';
    }
    if (r === 'teacher') {
      this.scheduleScope = 'teacher';
    } else if (!this.isAdmin) {
      this.scheduleScope = 'class';
    }
    const sec = this.route.snapshot.queryParamMap.get('section');
    if (this.isAdmin && sec === 'covers') {
      this.timetableSection = 'covers';
    }
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      if (!this.isAdmin) {
        return;
      }
      const raw = ((q['section'] as string) || '').toLowerCase();
      this.timetableSection = raw === 'covers' ? 'covers' : 'schedule';
      if (this.timetableSection === 'covers') {
        this.bootstrapCoversAdmin();
      }
      this.cdr.markForCheck();
    });
    this.operations.attendanceCoverMutations$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(mutation => {
      if (this.coverDate === mutation.coverDate) {
        if (this.isAdmin && this.timetableSection === 'covers') {
          this.reloadCoversAdmin();
        }
        this.reloadCurrentScheduleView();
      }
    });
    if (this.isParent) {
      this.loadParentTimetableContext();
    } else {
      this.refreshTimetable();
    }
    if (this.isAdmin && this.timetableSection === 'covers') {
      this.bootstrapCoversAdmin();
    }
    this.academicService.getSubjectCatalog().subscribe({
      next: cat => {
        this.subjectCatalogNames = [...new Set(cat.map(s => (s.name ?? '').trim()).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b)
        );
      },
      error: () => (this.subjectCatalogNames = []),
    });
  }

  setTimetableSection(section: 'schedule' | 'covers'): void {
    this.timetableSection = section;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: section === 'schedule' ? null : 'covers' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (section === 'covers') {
      this.bootstrapCoversAdmin();
    }
  }

  openAssignTimetableTab(): void {
    void this.router.navigateByUrl('/app/timetable/onboarding');
  }

  private bootstrapCoversAdmin(): void {
    if (!this.classes.length) {
      this.academicService.getClasses().subscribe(c => {
        this.classes = c;
        this.reloadCoversAdmin();
      });
    } else {
      this.reloadCoversAdmin();
    }
    if (!this.teachers.length) {
      this.teacherService.getTeachers().subscribe(t => (this.teachers = t));
    }
  }

  reloadCoversAdmin(): void {
    this.coverAdminError = '';
    this.refreshCoverRegularTeacher();
    this.operations.listAttendanceCoversAdmin(this.coverDate).subscribe({
      next: rows => (this.coversAdmin = rows || []),
      error: (e: Error) => {
        this.coverAdminError = e?.message || this.translate.instant('attendance.errors.saveFailed');
      },
    });
  }

  /** Local calendar “today” for min-date validation (cover assignments are forward-looking). */
  get todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  submitCover(): void {
    this.coverAdminError = '';
    if (this.coverDate && this.coverDate < this.todayIso) {
      this.coverAdminError = this.translate.instant('operations.covers.pastDateNotAllowed');
      return;
    }
    if (this.coverForm.classId == null || this.coverForm.coveringTeacherId == null) {
      this.warnInvalidTimetableInput('timetable.validationClassSectionRequired');
      return;
    }
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    const secId = this.coverForm.sectionId;
    const sectionChosen = secId != null && Number(secId) > 0;
    if ((cls?.sections?.length ?? 0) > 0 && !sectionChosen) {
      this.coverAdminError = this.translate.instant('operations.covers.sectionRequired');
      return;
    }
    if (this.coverForm.periodNumber == null) {
      this.coverAdminError = this.translate.instant('operations.covers.periodRequired');
      return;
    }
    if (
      this.coverSlotRegularTeacherId != null &&
      Number(this.coverForm.coveringTeacherId) === Number(this.coverSlotRegularTeacherId)
    ) {
      this.coverAdminError = this.translate.instant('operations.covers.sameAsAbsentTeacher');
      return;
    }
    if (!this.coverPeriodOptions.includes(Number(this.coverForm.periodNumber))) {
      this.coverAdminError = this.translate.instant('operations.covers.periodUnavailable');
      return;
    }
    this.createCoverWithOptionalReplace(undefined);
  }

  private createCoverWithOptionalReplace(replaceCoverAssignmentId: number | undefined): void {
    const period =
      this.coverForm.periodNumber != null && this.coverForm.periodNumber > 0 ? this.coverForm.periodNumber : undefined;
    this.operations
      .createAttendanceCover({
        coverDate: this.coverDate,
        classId: this.coverForm.classId!,
        sectionId: this.coverForm.sectionId ?? undefined,
        regularTeacherId: this.coverSlotRegularTeacherId ?? undefined,
        coveringTeacherId: this.coverForm.coveringTeacherId!,
        reason: this.coverForm.reason,
        periodNumber: period,
        replaceCoverAssignmentId,
      }, {
        actorUserId: this.auth.getCurrentUser()?.id ?? null,
        actorName: this.auth.getCurrentUser()?.name ?? undefined,
      })
      .subscribe({
        next: () => {
          this.coverForm.reason = '';
          this.reloadCoversAdmin();
          this.refreshTimetable();
        },
        error: (e: unknown) => {
          if (e instanceof SchedulingConflictError) {
            const c = e.conflict;
            const otherName = c.existingCoveringTeacherName?.trim() || `Teacher #${c.existingCoveringTeacherId}`;
            this.confirmDialog
              .confirm({
                title: this.translate.instant('operations.covers.conflictTitle'),
                message: this.translate.instant('operations.covers.conflictMessage', { name: otherName }),
                details: [
                  this.translate.instant('operations.covers.conflictDetailDate', { date: this.coverDate }),
                  this.buildCoverConflictLocationLine(c),
                ],
                variant: 'warning',
                confirmLabel: this.translate.instant('operations.covers.conflictConfirmReplace'),
                cancelLabel: this.translate.instant('operations.covers.conflictKeep'),
              })
              .pipe(filter(Boolean), take(1))
              .subscribe(() => this.createCoverWithOptionalReplace(c.existingCoverAssignmentId));
            return;
          }
          this.coverAdminError = e instanceof Error ? e.message : this.translate.instant('attendance.errors.saveFailed');
        },
      });
  }

  cancelCoverAdmin(c: AttendanceCoverRow): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('operations.covers.cancelConfirmTitle'),
        message: this.translate.instant('operations.covers.cancelConfirmMessage'),
        variant: 'danger',
        confirmLabel: this.translate.instant('operations.covers.cancelConfirm'),
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() =>
        this.operations
          .cancelAttendanceCover(c.id, {
            coverDate: c.coverDate,
            classId: c.classId,
            sectionId: c.sectionId ?? null,
          }, {
            actorUserId: this.auth.getCurrentUser()?.id ?? null,
            actorName: this.auth.getCurrentUser()?.name ?? undefined,
          })
          .subscribe({
            next: () => {
              this.reloadCoversAdmin();
              this.refreshTimetable();
            },
            error: (e: Error) => {
              this.coverAdminError = e?.message || this.translate.instant('attendance.errors.saveFailed');
            },
          })
      );
  }

  get isTeacherViewer(): boolean {
    return (this.auth.getRole() ?? '').toLowerCase() === 'teacher';
  }

  /** True when “by teacher” is selected but the grid has no cells (e.g. Sunday with no weekend school). */
  get showTeacherScheduleEmptyHint(): boolean {
    return (
      this.scheduleScope === 'teacher' &&
      this.selectedTeacherId != null &&
      !this.isParent &&
      (this.grid?.days?.length ?? 0) === 0
    );
  }

  /** Classic “today” layout for class scope when the chosen calendar day has no Mon–Sat row (e.g. Sunday). */
  get showClassScheduleEmptyHint(): boolean {
    return (
      this.scheduleScope === 'class' &&
      !this.isParent &&
      this.layout === 'dayRows' &&
      this.selectedClassId != null &&
      (this.sections.length === 0 || this.selectedSectionId != null) &&
      (this.grid?.days?.length ?? 0) === 0
    );
  }

  setTimetableLayout(next: 'dayRows' | 'periodRows'): void {
    this.layout = next;
    if (this.scheduleScope === 'teacher' && this.selectedTeacherId != null && this.teacherScheduleRows.length) {
      this.applyTeacherScopeViewModel();
    }
    if (this.scheduleScope === 'class' && this.classScheduleRows.length) {
      this.applyClassScopeViewModel();
    }
  }

  /** YYYY-MM-DD in the browser's local timezone (not UTC). */
  private localCalendarDateString(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Default session date: Mon–Sat → today; Sunday → previous Saturday (last school day in a typical Indian Mon–Sat week).
   */
  private defaultTeacherSessionCalendarDate(): string {
    const d = new Date();
    if (d.getDay() === 0) {
      d.setDate(d.getDate() - 1);
    }
    return this.localCalendarDateString(d);
  }

  /** Class + section for grid cells (API may send {@link TimetableEntry.className} / {@link TimetableEntry.sectionName}). */
  entryClassSectionLabel(entry: TimetableEntry): string {
    const cn = formatSchoolClassName(entry.className?.trim(), this.translate);
    const sn = entry.sectionName?.trim();
    if (cn && sn) {
      return `${cn} - ${sn}`;
    }
    if (cn) {
      return cn;
    }
    const cls = this.classes.find(c => c.id === entry.classId);
    const cname = formatSchoolClassDisplayName(entry.classId, cls?.name?.trim(), this.translate);
    const sec = cls?.sections?.find(s => s.id === entry.sectionId);
    const sname = sec?.name?.trim();
    return sname ? `${cname} - ${sname}` : cname;
  }

  /** Localized weekday label; API values stay English — display only. */
  weekdayLabel(day: string): string {
    const d = this.normalizeDay(day).toLowerCase();
    const key = `timetable.days.${d}`;
    const tr = this.translate.instant(key);
    return tr !== key ? tr : day;
  }

  isCoverRow(entry: TimetableEntry): boolean {
    return entry.scheduleSource === 'COVER';
  }

  /** Period-based accent so columns read as distinct but still on-brand (primary / info / success / accent blend). */
  slotToneClass(period: number): string {
    const n = Math.max(1, period | 0);
    return `timetable-slot--tone-${(n - 1) % 4}`;
  }

  private loadParentTimetableContext(): void {
    this.parentService.getChildren().subscribe(children => {
      this.myChildren = children || [];
      this.classes = this.buildParentSyntheticClasses(this.myChildren);
      if (this.myChildren.length === 1) {
        this.selectedChildId = this.myChildren[0].id;
        this.applyParentChildSelection();
      } else if (this.selectedChildId != null) {
        this.applyParentChildSelection();
      }
    });
  }

  private buildParentSyntheticClasses(children: Student[]): SchoolClass[] {
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
          studentCount: 0,
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
        tenantId,
      }))
      .sort((a, b) => a.id - b.id);
  }

  onParentChildChange(): void {
    this.applyParentChildSelection();
  }

  private applyParentChildSelection(): void {
    const st = this.myChildren.find(x => x.id === this.selectedChildId);
    if (!st) {
      this.entries = [];
      this.grid = null;
      return;
    }
    this.selectedClassId = st.classId;
    const cls = this.classes.find(c => c.id === st.classId);
    this.sections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    this.selectedSectionId = st.sectionId > 0 ? st.sectionId : null;
    this.loadTimetable();
  }

  refreshTimetable(): void {
    if (this.isAdmin && this.timetableSection === 'covers') {
      this.reloadCoversAdmin();
      return;
    }
    if (this.isParent) {
      this.loadParentTimetableContext();
      return;
    }
    forkJoin({
      teachers: this.teacherService.getTeachers(),
      classes: this.academicService.getClasses(),
    }).subscribe({
      next: ({ teachers, classes }) => {
        this.teachers = teachers;
        this.classes = classes;
        if (this.scheduleScope === 'teacher' && this.selectedTeacherId == null && this.isTeacherViewer) {
          const me = this.auth.getCurrentUser()?.id;
          const row = teachers.find(t => t.userId != null && Number(t.userId) === Number(me));
          if (row) {
            this.selectedTeacherId = row.id;
          }
        }
        const sel = this.classes.find(c => c.id === this.selectedClassId);
        this.sections = sel ? sel.sections.map(s => ({ id: s.id, name: s.name })) : [];
        this.reloadCurrentScheduleView();
      },
      error: () => {
        this.entries = [];
        this.grid = null;
      },
    });
  }

  setScheduleScope(scope: 'class' | 'teacher'): void {
    this.scheduleScope = scope;
    this.manualPeriodRows.clear();
    this.entries = [];
    this.grid = null;
    this.teacherScheduleRows = [];
    this.classScheduleRows = [];
    if (scope === 'class') {
      this.selectedTeacherId = null;
      if (this.selectedClassId != null && (this.sections.length === 0 || this.selectedSectionId != null)) {
        this.loadTimetable();
      }
    } else {
      this.selectedClassId = null;
      this.selectedSectionId = null;
      this.sections = [];
      if (this.selectedTeacherId != null) {
        this.loadTeacherTimetable();
      }
    }
  }

  onTeacherChange(): void {
    this.entries = [];
    this.grid = null;
    this.teacherScheduleRows = [];
    this.manualPeriodRows.clear();
    if (this.selectedTeacherId == null) {
      return;
    }
    this.loadTeacherTimetable();
  }

  onTeacherViewDateChange(): void {
    if (this.scheduleScope === 'teacher' && this.selectedTeacherId != null) {
      this.loadTeacherTimetable();
    }
  }

  onClassViewDateChange(): void {
    if (this.scheduleScope === 'class' && this.classScheduleRows.length) {
      this.applyClassScopeViewModel();
    }
  }

  private loadTeacherTimetable(): void {
    if (this.selectedTeacherId == null) {
      return;
    }
    this.timetableService.getByTeacher(this.selectedTeacherId, this.resolveTeacherViewCalendarDate()).subscribe({
      next: rows => {
        this.teacherScheduleRows = rows ?? [];
        this.applyTeacherScopeViewModel();
      },
      error: () => {
        this.teacherScheduleRows = [];
        this.entries = [];
        this.grid = null;
      },
    });
  }

  /**
   * Classic grid: one calendar school day (Mon–Sat). Week matrix: Mon–Sat columns in order, current school week pattern.
   */
  private applyTeacherScopeViewModel(): void {
    const raw = this.teacherScheduleRows;
    if (this.layout === 'periodRows') {
      this.entries = raw.filter(e => this.timetableService.isIndianSchoolTeachingDayName(e.day));
      this.grid = this.timetableService.toSchoolWeekMatrixGrid(this.entries);
    } else {
      const dow = this.weekdayEnglishFromIsoDate(this.resolveTeacherViewCalendarDate());
      this.entries = raw.filter(e => this.normalizeDay(e.day) === this.normalizeDay(dow));
      this.grid = this.timetableService.toGridFromEntries(this.entries, { restrictToWeekdays: [dow] });
    }
  }

  /**
   * “By class” schedule: week matrix uses all Mon–Sat rows; classic (day) layout uses the selected session date’s weekday only
   * — same model as {@link #applyTeacherScopeViewModel} without a second HTTP round-trip.
   */
  private applyClassScopeViewModel(): void {
    const raw = this.classScheduleRows;
    if (!raw.length) {
      this.entries = [];
      this.grid = null;
      return;
    }
    if (this.layout === 'periodRows') {
      this.entries = raw.filter(e => this.timetableService.isIndianSchoolTeachingDayName(e.day));
      this.grid = this.timetableService.toSchoolWeekMatrixGrid(this.entries);
    } else {
      const dow = this.weekdayEnglishFromIsoDate(this.resolveClassViewCalendarDate());
      this.entries = raw.filter(e => this.normalizeDay(e.day) === this.normalizeDay(dow));
      this.grid = this.timetableService.toGridFromEntries(this.entries, { restrictToWeekdays: [dow] });
    }
  }

  private resolveTeacherViewCalendarDate(): string {
    const raw = (this.teacherViewDate ?? '').trim();
    return raw.length ? raw : this.defaultTeacherSessionCalendarDate();
  }

  private resolveClassViewCalendarDate(): string {
    const raw = (this.classViewDate ?? '').trim();
    return raw.length ? raw : this.defaultTeacherSessionCalendarDate();
  }

  private weekdayEnglishFromIsoDate(iso: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(iso + 'T12:00:00');
    return days[d.getDay()];
  }

  onEntryFormClassChange(): void {
    const ids = new Set(this.entryFormSections.map(s => s.id));
    const sid = this.entryForm.sectionId;
    if (sid != null && sid !== 0 && !ids.has(sid)) {
      this.entryForm.sectionId = this.entryFormSections[0]?.id ?? null;
    }
  }

  onClassChange(): void {
    const selectedClass = this.classes.find(cls => cls.id === this.selectedClassId);
    this.sections = selectedClass ? selectedClass.sections.map(section => ({ id: section.id, name: section.name })) : [];
    this.selectedSectionId = null;
    this.entries = [];
    this.grid = null;
    this.classScheduleRows = [];
    this.manualPeriodRows.clear();
    if (this.selectedClassId != null && this.sections.length === 0) {
      this.loadTimetable();
    }
  }

  canEditTimetable(): boolean {
    if (!this.canMutateTimetable) {
      return false;
    }
    if (this.scheduleScope === 'teacher') {
      return this.isAdmin && this.selectedTeacherId != null;
    }
    if (this.selectedClassId == null) return false;
    if (this.sections.length > 0) return this.selectedSectionId != null;
    return true;
  }

  loadTimetable(): void {
    if (this.isParent) {
      if (this.selectedChildId == null) {
        this.entries = [];
        this.grid = null;
        return;
      }
      const parentTimetable = this.parentService as ParentService & ParentTimetableContract;
      forkJoin({
        entries: parentTimetable.getChildTimetableEntries(this.selectedChildId),
        grid: parentTimetable.getChildTimetableGrid(this.selectedChildId),
      }).subscribe({
        next: ({ entries, grid }) => {
          this.entries = entries ?? [];
          this.grid = grid ?? null;
        },
        error: () => {
          this.entries = [];
          this.grid = null;
        },
      });
      return;
    }
    if (this.selectedClassId == null) return;
    if (this.sections.length > 0 && this.selectedSectionId == null) return;
    const sectionArg = this.sections.length > 0 ? this.selectedSectionId! : undefined;
    this.timetableService.getByClassAndSection(this.selectedClassId, sectionArg).subscribe({
      next: rows => {
        this.classScheduleRows = rows ?? [];
        this.applyClassScopeViewModel();
      },
      error: () => {
        this.classScheduleRows = [];
        this.entries = [];
        this.grid = null;
      },
    });
  }

  getEntry(day: string, period: number): TimetableEntry | undefined {
    const nd = this.normalizeDay(day);
    return this.entries.find(entry => this.normalizeDay(entry.day) === nd && entry.period === period);
  }

  /**
   * “Add Slot” — class/section scoped only so admins attach a recurring weekly lesson to one class timetable
   * (teacher’s personal schedule derives from these rows). Intro dialog explains behaviour before opening the form.
   */
  openCreateModal(): void {
    if (!this.canMutateTimetable || this.scheduleScope !== 'class' || !this.canEditTimetable()) {
      return;
    }
    const details = this.buildAddSlotIntroDetails();
    this.confirmDialog
      .confirm({
        title: this.translate.instant('timetable.addSlotIntroTitle'),
        message: this.translate.instant('timetable.addSlotIntroMessage'),
        details,
        variant: 'primary',
        confirmLabel: this.translate.instant('timetable.addSlotIntroContinue'),
        cancelLabel: this.translate.instant('timetable.addSlotIntroCancel'),
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => this.openCreateModalAfterIntroAck());
  }

  private openCreateModalAfterIntroAck(): void {
    this.editingEntryId = null;
    this.slotModalTimesApplied = false;
    this.entryForm = this.defaultEntryForm();
    this.showModal = true;
    this.syncModal12hFromEntryForm();
  }

  /** Short context lines for “Add Slot” intro (class/section scope + recurring + conflict rules). */
  private buildAddSlotIntroDetails(): string[] {
    const labels = createTimetableConflictHumanLabels(this.classes, this.translate);
    const cid = this.selectedClassId;
    const clazz = cid != null ? labels.classDisplayName(cid) : '—';
    const sectionLabel = labels.sectionDisplayForClass(
      cid,
      this.sections.length > 0 ? this.selectedSectionId : undefined
    );
    return [
      this.translate.instant('timetable.addSlotIntroDetailScope', { clazz, section: sectionLabel }),
      this.translate.instant('timetable.addSlotIntroDetailRecurring'),
      this.translate.instant('timetable.addSlotIntroDetailConflicts'),
    ];
  }

  openEditModal(entry: TimetableEntry): void {
    if (!this.canMutateTimetable || this.isCoverRow(entry)) {
      return;
    }
    this.editingEntryId = entry.id;
    this.entryForm = { ...entry };
    const aligned = this.resolveSubjectCatalogName(this.entryForm.subjectName ?? '');
    if (aligned != null) {
      this.entryForm.subjectName = aligned;
    }
    this.slotModalTimesApplied = true;
    this.showModal = true;
    this.syncModal12hFromEntryForm();
  }

  /** Aligns persisted subject text with the canonical catalog spelling for the subject dropdown. */
  private resolveSubjectCatalogName(raw: string): string | null {
    const t = (raw ?? '').trim();
    if (!t) {
      return null;
    }
    const key = this.normalizeSubjectLabel(t);
    return this.subjectCatalogNames.find(n => this.normalizeSubjectLabel(n) === key) ?? null;
  }

  private normalizeSubjectLabel(s: string): string {
    return s.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  closeModal(): void {
    this.showModal = false;
    this.slotModalTimesApplied = false;
    this.entryForm = this.defaultEntryForm();
    this.editingEntryId = null;
  }

  syncTeacherName(): void {
    const tid = this.entryForm.teacherId ?? undefined;
    const teacher = tid != null ? this.teachers.find(item => item.id === tid) : undefined;
    this.entryForm.teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : '';
  }

  saveEntry(): void {
    this.applyModal12hTimes();
    this.persistTimetableSlot(undefined);
  }

  applyModal12hTimes(): void {
    this.entryForm.startTime = this.join12HourTo24(this.modalTime12.startH, this.modalTime12.startM, this.modalTime12.startAp);
    this.entryForm.endTime = this.join12HourTo24(this.modalTime12.endH, this.modalTime12.endM, this.modalTime12.endAp);
    this.slotModalTimesApplied = true;
    this.cdr.markForCheck();
  }

  private syncModal12hFromEntryForm(): void {
    const s = this.entryForm.startTime || '08:00';
    const e = this.entryForm.endTime || '08:45';
    const a = this.split24HourTo12(s);
    const b = this.split24HourTo12(e);
    this.modalTime12 = {
      startH: a.h,
      startM: a.m,
      startAp: a.ap,
      endH: b.h,
      endM: b.m,
      endAp: b.ap,
    };
  }

  private split24HourTo12(t: string): { h: string; m: string; ap: 'AM' | 'PM' } {
    const raw = (t || '00:00').trim();
    const [hs, ms] = raw.split(':');
    let rh = Number(hs);
    const rm = Math.min(59, Math.max(0, Number(ms) || 0));
    if (!Number.isFinite(rh) || rh < 0 || rh > 23) {
      rh = 8;
    }
    const ap: 'AM' | 'PM' = rh >= 12 ? 'PM' : 'AM';
    let h12 = rh % 12;
    if (h12 === 0) {
      h12 = 12;
    }
    return { h: String(h12), m: String(rm).padStart(2, '0'), ap };
  }

  private join12HourTo24(h: string, m: string, ap: 'AM' | 'PM'): string {
    let hh = parseInt(h, 10);
    const mm = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
    if (!Number.isFinite(hh) || hh < 1 || hh > 12) {
      hh = 8;
    }
    if (ap === 'AM') {
      if (hh === 12) {
        hh = 0;
      }
    } else if (hh !== 12) {
      hh += 12;
    }
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  private warnInvalidTimetableInput(messageKey: string): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('timetable.validationTitle'),
        message: this.translate.instant(messageKey),
        variant: 'warning',
        confirmLabel: this.translate.instant('timetable.validationAcknowledge'),
        cancelLabel: '',
      })
      .pipe(take(1))
      .subscribe();
  }

  /**
   * Fast client checks (required fields, catalog, clock order). Period/teacher/room clashes
   * and overlapping times are evaluated in {@link persistTimetableSlot} using a school-wide fetch
   * so “by class” and “by teacher” flows see the same rules as the server.
   */
  private validateTimetableBasic(payload: TimetableEntry): boolean {
    if (!payload.teacherId) {
      this.warnInvalidTimetableInput('timetable.validationTeacherRequired');
      return false;
    }
    if (!payload.subjectName.trim()) {
      this.warnInvalidTimetableInput('timetable.validationSubjectRequired');
      return false;
    }
    if (this.subjectCatalogNames.length === 0) {
      this.warnInvalidTimetableInput('timetable.validationSubjectCatalogEmpty');
      return false;
    }
    const subj = payload.subjectName.trim();
    const sk = this.normalizeSubjectLabel(subj);
    if (!this.subjectCatalogNames.some(n => this.normalizeSubjectLabel(n) === sk)) {
      this.warnInvalidTimetableInput('timetable.validationSubjectNotInCatalog');
      return false;
    }
    if (!payload.startTime || !payload.endTime || payload.startTime >= payload.endTime) {
      this.warnInvalidTimetableInput('timetable.validationTimeRange');
      return false;
    }
    if (payload.period < 1 || payload.period > 12) {
      this.warnInvalidTimetableInput('timetable.validationPeriodRange');
      return false;
    }
    if (!payload.classId || (this.sections.length > 0 && payload.sectionId == null)) {
      this.warnInvalidTimetableInput('timetable.validationClassSectionRequired');
      return false;
    }
    return true;
  }

  private localViolationHintKey(kind: TimetableLocalViolationKind): string {
    const map: Record<TimetableLocalViolationKind, string> = {
      CLASS_PERIOD: 'timetable.localViolationHintClassPeriod',
      TEACHER_PERIOD: 'timetable.localViolationHintTeacherPeriod',
      ROOM_PERIOD: 'timetable.localViolationHintRoomPeriod',
      CLASS_TIME: 'timetable.localViolationHintClassTime',
      TEACHER_TIME: 'timetable.localViolationHintTeacherTime',
      ROOM_TIME: 'timetable.localViolationHintRoomTime',
    };
    return map[kind];
  }

  private localViolationSummaryKey(kind: TimetableLocalViolationKind): string {
    const map: Record<TimetableLocalViolationKind, string> = {
      CLASS_PERIOD: 'timetable.localViolationSummaryClassPeriod',
      TEACHER_PERIOD: 'timetable.localViolationSummaryTeacherPeriod',
      ROOM_PERIOD: 'timetable.localViolationSummaryRoomPeriod',
      CLASS_TIME: 'timetable.localViolationSummaryClassTime',
      TEACHER_TIME: 'timetable.localViolationSummaryTeacherTime',
      ROOM_TIME: 'timetable.localViolationSummaryRoomTime',
    };
    return map[kind];
  }

  private showLocalTimetableViolationDialog(violation: TimetableLocalViolation, candidate: TimetableEntry): void {
    const labels = createTimetableConflictHumanLabels(this.classes, this.translate);
    const b = violation.blocking;
    const dayLabel = this.weekdayLabel(candidate.day);
    const summary = this.translate.instant(this.localViolationSummaryKey(violation.kind), {
      day: dayLabel,
      period: String(candidate.period),
      yourTime: `${candidate.startTime}–${candidate.endTime}`,
      otherTime: `${b.startTime}–${b.endTime}`,
    });
    const whenBlocking = this.translate.instant('timetable.localViolationBlockingWhen', {
      day: this.weekdayLabel(b.day),
      period: String(b.period),
      start: b.startTime || '',
      end: b.endTime || '',
    });
    const roomDash = this.translate.instant('transport.dash');
    const blockingLine = this.translate.instant('timetable.localViolationBlockingLine', {
      subject: (b.subjectName || '').trim() || roomDash,
      teacher: (b.teacherName || '').trim() || roomDash,
      clazz: labels.classDisplayName(b.classId),
      section: labels.sectionDisplayForClass(b.classId, b.sectionId ?? null),
      when: whenBlocking,
      room: (b.room || '').trim() || roomDash,
    });
    const details = [
      this.translate.instant('timetable.localViolationLead'),
      this.translate.instant('timetable.localViolationBlockingHeading'),
      blockingLine,
      this.translate.instant('timetable.localViolationWhatToDo'),
      this.translate.instant(this.localViolationHintKey(violation.kind)),
    ];
    this.confirmDialog
      .confirm({
        title: this.translate.instant('timetable.localViolationTitle'),
        message: summary,
        details,
        variant: 'warning',
        confirmLabel: this.translate.instant('timetable.validationAcknowledge'),
        cancelLabel: '',
      })
      .pipe(take(1))
      .subscribe();
  }

  get periodRowsForWeekView(): number[] {
    const base = this.grid?.periods ?? [];
    const merged = new Set<number>(base.filter(p => Number.isFinite(p) && p > 0));
    this.manualPeriodRows.forEach(p => {
      if (Number.isFinite(p) && p > 0) {
        merged.add(p);
      }
    });
    return [...merged].sort((a, b) => a - b);
  }

  addPeriodRow(): void {
    if (!this.canMutateTimetable || !this.canEditTimetable()) {
      return;
    }
    const current = this.periodRowsForWeekView;
    const nextPeriod = current.length ? Math.max(...current) + 1 : 1;
    if (nextPeriod > 12) {
      this.confirmDialog
        .confirm({
          title: this.translate.instant('timetable.periodRowLimitTitle'),
          message: this.translate.instant('timetable.periodRowLimitMessage'),
          variant: 'warning',
          confirmLabel: this.translate.instant('timetable.validationAcknowledge'),
          cancelLabel: '',
        })
        .pipe(take(1))
        .subscribe();
      return;
    }
    this.manualPeriodRows.add(nextPeriod);
    this.showToast(this.translate.instant('timetable.addPeriodRowToast', { period: nextPeriod }));
    this.cdr.markForCheck();
  }

  requestRemovePeriodRow(period: number): void {
    if (!this.canMutateTimetable || !this.canEditTimetable() || this.scheduleScope !== 'class') {
      return;
    }
    const rowsToDelete = this.classScheduleRows.filter(e => Number(e.period) === Number(period) && !this.isCoverRow(e));
    const hasRows = rowsToDelete.length > 0;
    const affectedTeachers = [...new Set(rowsToDelete.map(r => (r.teacherName || '').trim()).filter(Boolean))];
    const details = hasRows
      ? [
          this.translate.instant('timetable.removePeriodRowDetailCount', {
            count: rowsToDelete.length,
            period,
          }),
          this.translate.instant('timetable.removePeriodRowDetailTeachers', {
            count: affectedTeachers.length,
          }),
          this.translate.instant('timetable.removePeriodRowDetailTeacherNames', {
            names: affectedTeachers.slice(0, 3).join(', ') || '—',
          }),
          this.translate.instant('timetable.removePeriodRowDetailUndoHint'),
        ]
      : [this.translate.instant('timetable.removePeriodRowDetailEmpty', { period })];
    this.confirmDialog
      .confirm({
        title: this.translate.instant('timetable.removePeriodRowTitle', { period }),
        message: this.translate.instant(
          hasRows ? 'timetable.removePeriodRowMessageWithSlots' : 'timetable.removePeriodRowMessageWithoutSlots',
          { period }
        ),
        details,
        variant: hasRows ? 'danger' : 'warning',
        confirmLabel: this.translate.instant(hasRows ? 'timetable.removePeriodRowConfirm' : 'timetable.removeRow'),
        cancelLabel: this.translate.instant('timetable.conflictKeep'),
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        if (!hasRows) {
          this.manualPeriodRows.delete(period);
          this.showToast(this.translate.instant('timetable.removePeriodRowToastEmpty', { period }));
          this.cdr.markForCheck();
          return;
        }
        const uniqueIds = [...new Set(rowsToDelete.map(r => r.id))];
        this.timetableService.deleteTimetableEntriesByIds(uniqueIds).subscribe({
          next: res => {
            this.manualPeriodRows.delete(period);
            this.reloadCurrentScheduleView();

            if (res.firstErrorMessage) {
              const partial = res.deletedCount > 0;
              this.confirmDialog
                .confirm({
                  title: this.translate.instant(
                    partial ? 'timetable.removePeriodRowPartialTitle' : 'timetable.removePeriodRowFailedTitle'
                  ),
                  message: this.translate.instant(
                    partial ? 'timetable.removePeriodRowPartialMessage' : 'timetable.removePeriodRowFailedDetail',
                    {
                      period,
                      deleted: res.deletedCount,
                      detail: res.firstErrorMessage,
                    }
                  ),
                  details: [
                    this.translate.instant('timetable.removePeriodRowRefreshHint'),
                    this.translate.instant('timetable.removePeriodRowPartialStats', {
                      deleted: res.deletedCount,
                      missing: res.notFoundCount,
                      planned: uniqueIds.length,
                    }),
                  ],
                  variant: partial ? 'warning' : 'danger',
                  confirmLabel: this.translate.instant('timetable.validationAcknowledge'),
                  cancelLabel: '',
                })
                .pipe(take(1))
                .subscribe();
              return;
            }

            if (res.deletedCount > 0 && res.notFoundCount > 0) {
              this.showToast(
                this.translate.instant('timetable.removePeriodRowToastWithNotFound', {
                  slots: res.deletedCount,
                  missing: res.notFoundCount,
                  teachers: affectedTeachers.length,
                  period,
                })
              );
            } else if (res.deletedCount > 0) {
              this.showToast(
                this.translate.instant('timetable.removePeriodRowToastWithImpacts', {
                  slots: res.deletedCount,
                  teachers: affectedTeachers.length,
                  period,
                })
              );
            } else if (res.notFoundCount > 0) {
              this.showToast(this.translate.instant('timetable.removePeriodRowToastAllAlreadyGone', { period }));
            }
          },
          error: () => {
            this.confirmDialog
              .confirm({
                title: this.translate.instant('timetable.removePeriodRowFailedTitle'),
                message: this.translate.instant('timetable.removePeriodRowFailedMessage'),
                variant: 'warning',
                confirmLabel: this.translate.instant('timetable.validationAcknowledge'),
                cancelLabel: '',
              })
              .pipe(take(1))
              .subscribe();
          },
        });
      });
  }

  clearToast(): void {
    this.toastMessage = '';
    if (this.toastClearTimer) {
      clearTimeout(this.toastClearTimer);
      this.toastClearTimer = null;
    }
  }

  private showToast(message: string): void {
    this.clearToast();
    this.toastMessage = message;
    this.toastClearTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastClearTimer = null;
      this.cdr.markForCheck();
    }, 5500);
    this.cdr.markForCheck();
  }

  /**
   * Class/section that the add/edit modal will persist for the current scope (matches API payload).
   * Used for conflict dialogs so “pending assignment” labels match what will be saved.
   */
  private getEffectiveSlotClassSectionForSave(): { classId: number; sectionId: number } {
    let classId: number;
    let sectionId: number;
    if (this.scheduleScope === 'class') {
      classId = this.selectedClassId!;
      sectionId = this.sections.length > 0 ? this.selectedSectionId! : 0;
    } else {
      classId = this.entryForm.classId ?? this.classes[0]?.id ?? 0;
      const cls = this.classes.find(c => c.id === classId);
      if (cls && cls.sections.length > 0) {
        const picked = this.entryForm.sectionId;
        sectionId = picked != null && picked !== 0 ? picked : cls.sections[0].id;
      } else {
        sectionId = 0;
      }
    }
    return { classId, sectionId };
  }

  /** Payload as sent to timetable create/update (single source for validation + save confirm). */
  private buildPersistPayload(): TimetableEntry {
    const { classId, sectionId } = this.getEffectiveSlotClassSectionForSave();
    const teacherId = this.entryForm.teacherId ?? 0;
    return {
      id: this.editingEntryId ?? 0,
      classId,
      sectionId,
      day: this.entryForm.day || 'Monday',
      period: Number(this.entryForm.period || 1),
      startTime: this.entryForm.startTime || '',
      endTime: this.entryForm.endTime || '',
      subjectName:
        this.resolveSubjectCatalogName(this.entryForm.subjectName || '') ?? (this.entryForm.subjectName || '').trim(),
      teacherId,
      teacherName: this.entryForm.teacherName || '',
      room: this.entryForm.room || '',
      tenantId: '',
    };
  }

  /** User-facing bullets before persisting a new class-scoped recurring slot (after validation passes). */
  private buildAddSlotPersistConfirmDetails(payload: TimetableEntry): string[] {
    const labels = createTimetableConflictHumanLabels(this.classes, this.translate);
    const dow = this.weekdayLabel(payload.day);
    const teacher = payload.teacherName?.trim() || this.translate.instant('timetable.addSlotPersistTeacherUnset');
    const room = payload.room?.trim() || this.translate.instant('transport.dash');
    const clazz = labels.classDisplayName(payload.classId);
    const sec = labels.sectionDisplayForClass(payload.classId, payload.sectionId ?? null);
    return [
      this.translate.instant('timetable.addSlotPersistDetailClassSection', { clazz, section: sec }),
      this.translate.instant('timetable.addSlotPersistDetailWhen', {
        day: dow,
        period: payload.period,
        start: payload.startTime,
        end: payload.endTime,
      }),
      this.translate.instant('timetable.addSlotPersistDetailSubjectTeacher', {
        subject: payload.subjectName,
        teacher,
      }),
      this.translate.instant('timetable.addSlotPersistDetailRoom', { room }),
      this.translate.instant('timetable.addSlotPersistDetailEffect'),
      this.translate.instant('timetable.addSlotPersistDetailConflictsHint'),
    ];
  }

  private persistTimetableSlot(
    replaceTimetableEntryId?: number,
    persistOpts?: { skipNewSlotUserConfirm?: boolean }
  ): void {
    if (!this.canMutateTimetable) {
      return;
    }

    const runPersist = (): void => {
      const execPayload = this.buildPersistPayload();
      if (!this.validateTimetableBasic(execPayload)) {
        return;
      }

      const finishWithRequest = (): void => {
        const request$ =
          this.editingEntryId != null
            ? this.timetableService.updateEntry(this.editingEntryId, execPayload, replaceTimetableEntryId)
            : this.timetableService.addEntry(execPayload, replaceTimetableEntryId);
        request$.subscribe({
          next: () => {
            this.manualPeriodRows.add(execPayload.period);
            this.closeModal();
            this.reloadCurrentScheduleView();
          },
          error: (e: unknown) => {
            if (e instanceof TimetableConflictError) {
              this.promptTimetableConflictReplace(e);
              return;
            }
            if (e instanceof UserFacingHttpError && e.httpStatus === 409) {
              this.confirmDialog
                .confirm({
                  title: this.translate.instant('timetable.genericConflictTitle'),
                  message: this.translate.instant('timetable.genericConflictMessage'),
                  details: [
                    this.translate.instant('timetable.genericConflictDetailAction'),
                    e.message || this.translate.instant('timetable.genericConflictDetailFallback'),
                  ],
                  variant: 'warning',
                  confirmLabel: this.translate.instant('timetable.validationAcknowledge'),
                  cancelLabel: '',
                })
                .pipe(take(1))
                .subscribe();
              return;
            }
            console.error(e);
          },
        });
      };

      const ignoreIds = new Set<number>();
      if (replaceTimetableEntryId != null && replaceTimetableEntryId > 0) {
        ignoreIds.add(replaceTimetableEntryId);
      }

      forkJoin({
        teacherRows: this.timetableService.getByTeacher(execPayload.teacherId).pipe(catchError(() => of<TimetableEntry[]>([]))),
        globalRows: this.timetableService.getAll().pipe(catchError(() => of<TimetableEntry[]>([]))),
      })
        .pipe(take(1))
        .subscribe({
          next: ({ teacherRows, globalRows }) => {
            const global = globalRows ?? [];
            const classScoped =
              this.scheduleScope === 'class'
                ? this.classScheduleRows
                : global.filter(e => sameTimetableClassSection(e, execPayload));

            const violation = detectTimetableLocalViolations(execPayload, {
              classScopedRows: classScoped,
              teacherScopedRows: teacherRows ?? [],
              globalRows: global,
              ignoreEntryIds: ignoreIds,
            });
            if (violation) {
              this.showLocalTimetableViolationDialog(violation, execPayload);
              return;
            }
            finishWithRequest();
          },
          error: () => {
            finishWithRequest();
          },
        });
    };

    const isCreate = this.editingEntryId == null;
    const needsSaveConfirm =
      isCreate &&
      this.scheduleScope === 'class' &&
      !persistOpts?.skipNewSlotUserConfirm &&
      replaceTimetableEntryId == null;

    const snapshot = this.buildPersistPayload();
    if (!this.validateTimetableBasic(snapshot)) {
      return;
    }

    if (needsSaveConfirm) {
      this.confirmDialog
        .confirm({
          title: this.translate.instant('timetable.addSlotPersistTitle'),
          message: this.translate.instant('timetable.addSlotPersistMessage'),
          details: this.buildAddSlotPersistConfirmDetails(snapshot),
          variant: 'primary',
          confirmLabel: this.translate.instant('timetable.addSlotPersistConfirm'),
          cancelLabel: this.translate.instant('timetable.conflictKeep'),
        })
        .pipe(filter(Boolean), take(1))
        .subscribe(() => runPersist());
      return;
    }

    runPersist();
  }

  private promptTimetableConflictReplace(err: TimetableConflictError): void {
    const labels = createTimetableConflictHumanLabels(this.classes, this.translate);
    const pending = this.getEffectiveSlotClassSectionForSave();
    const dlg = buildTimetableConflictDialogStrings({
      translate: this.translate,
      conflict: err.conflict,
      labels,
      pendingClassId: pending.classId,
      pendingSectionId: pending.sectionId,
    });
    this.confirmDialog
      .confirm({
        ...dlg,
        variant: 'warning',
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() =>
        this.persistTimetableSlot(err.conflict.existingEntryId, { skipNewSlotUserConfirm: true })
      );
  }

  deleteEntry(id: number): void {
    if (!this.canMutateTimetable) {
      return;
    }
    this.confirmDialog
      .confirm({
        title: this.translate.instant('timetable.confirmDeleteTitle'),
        message: this.translate.instant('timetable.confirmDeleteMessage'),
        variant: 'danger',
        confirmLabel: this.translate.instant('timetable.confirmDelete'),
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        this.timetableService.deleteEntry(id).subscribe(() => {
          this.reloadCurrentScheduleView();
        });
      });
  }

  private reloadCurrentScheduleView(): void {
    if (this.isParent) {
      this.loadTimetable();
      return;
    }
    if (this.scheduleScope === 'teacher') {
      if (this.selectedTeacherId != null) {
        this.loadTeacherTimetable();
      } else {
        this.entries = [];
        this.grid = null;
      }
      return;
    }
    this.loadTimetable();
  }

  private defaultEntryForm(): TimetableEntryForm {
    return {
      day: 'Monday',
      period: 1,
      startTime: '08:00',
      endTime: '08:45',
      subjectName: '',
      teacherId: null,
      teacherName: '',
      room: '',
      classId: null,
      sectionId: null,
    };
  }

  private normalizeDay(day: string): string {
    return day ? day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() : day;
  }
}
