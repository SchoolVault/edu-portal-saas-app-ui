import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import { AuthService } from '../../core/services/auth.service';
import { SchoolClass, Student, Teacher, TimetableEntry, TimetableGrid } from '../../core/models/models';
import { ParentService } from '../../core/services/parent.service';
import { OperationsService } from '../../core/services/operations.service';
import { AttendanceCoverRow } from '../../core/models/operations.models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, take } from 'rxjs/operators';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { SchedulingConflictError } from '../../core/errors/scheduling-conflict.error';
import { TimetableConflictError } from '../../core/errors/timetable-conflict.error';

type TimetableEntryForm = Omit<Partial<TimetableEntry>, 'teacherId' | 'classId' | 'sectionId'> & {
  teacherId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
};

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent, ErpI18nPhDirective, TranslateModule, SchoolClassNamePipe],
  styles: [
    `
      .timetable-slot-cell {
        background: var(--clr-bg);
        border-radius: var(--radius-md);
        padding: 8px;
        min-height: 72px;
        border: 1px solid var(--clr-border-light);
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
        background: linear-gradient(145deg, var(--clr-surface-alt), var(--clr-bg));
        min-height: 88px;
      }
      .classic-wrap .timetable-slot-cell {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
      .timetable-slot--cover {
        border-color: color-mix(in srgb, var(--clr-info) 35%, var(--clr-border-light));
        background: color-mix(in srgb, var(--clr-info) 8%, var(--clr-bg));
      }
    `,
  ],
  template: `
    <div data-testid="timetable-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'timetable.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="!isParent">{{ 'timetable.leadAdmin' | translate }}</p>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="isParent">{{ 'timetable.leadParent' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap align-items-center" *ngIf="!isAdmin || timetableSection === 'schedule'">
          <div class="btn-group-erp d-flex gap-1" *ngIf="isAdmin">
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="scheduleScope === 'class'" (click)="setScheduleScope('class')">
              {{ 'timetable.scopeClass' | translate }}
            </button>
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="scheduleScope === 'teacher'" (click)="setScheduleScope('teacher')">
              {{ 'timetable.scopeTeacher' | translate }}
            </button>
          </div>
          <div class="btn-group-erp d-flex gap-1">
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="layout === 'dayRows'" (click)="layout = 'dayRows'">
              {{ 'timetable.layoutClassic' | translate }}
            </button>
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="layout === 'periodRows'" (click)="layout = 'periodRows'">
              {{ 'timetable.layoutWeek' | translate }}
            </button>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshTimetable()">
            <i class="bi bi-arrow-clockwise"></i> {{ 'timetable.refresh' | translate }}
          </button>
          <button *ngIf="canMutateTimetable" class="btn-primary-erp btn-sm" [disabled]="!canEditTimetable()" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i> {{ 'timetable.addSlot' | translate }}
          </button>
        </div>
      </div>

      <div class="erp-tabs mb-3" *ngIf="isAdmin">
        <button type="button" class="erp-tab" [class.active]="timetableSection === 'schedule'" (click)="setTimetableSection('schedule')">
          {{ 'timetable.tab.schedule' | translate }}
        </button>
        <button type="button" class="erp-tab" [class.active]="timetableSection === 'covers'" (click)="setTimetableSection('covers')">
          {{ 'timetable.tab.coversAdmin' | translate }}
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
        </div>
        <div class="row g-3 align-items-end" *ngIf="scheduleScope === 'teacher'">
          <div class="col-md-4">
            <label class="erp-label">{{ 'timetable.labelTeacher' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedTeacherId" (change)="onTeacherChange()" [disabled]="isTeacherViewer">
              <option [ngValue]="null">{{ 'timetable.selectTeacher' | translate }}</option>
              <option *ngFor="let t of teachers" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
            </select>
          </div>
          <div class="col-md-4">
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

      <div class="erp-card mb-4 classic-wrap animate-in" *ngIf="grid?.days?.length && layout === 'dayRows'">
        <div style="overflow-x: auto;">
          <table class="erp-table">
            <thead>
              <tr>
                <th style="min-width: 120px;">{{ 'timetable.gridDayPeriod' | translate }}</th>
                <th *ngFor="let period of grid?.periods" style="min-width: 180px;">{{ 'timetable.gridPeriod' | translate: { n: period } }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of grid?.days">
                <td>
                  <strong>{{ weekdayLabel(day) }}</strong>
                </td>
                <td *ngFor="let period of grid?.periods">
                  <ng-container *ngIf="getEntry(day, period) as entry; else emptySlot">
                    <div class="timetable-slot-cell" [class.timetable-slot--cover]="isCoverRow(entry)">
                      <div class="d-flex align-items-center gap-1 flex-wrap mb-1">
                        <span *ngIf="isCoverRow(entry)" class="badge-erp badge-info" style="font-size: 9px; text-transform: uppercase;">{{
                          'timetable.coverBadge' | translate
                        }}</span>
                        <span *ngIf="isCoverRow(entry) && entry.coverForDate" class="text-muted" style="font-size: 10px;">{{ entry.coverForDate }}</span>
                      </div>
                      <div style="font-weight: 700; color: var(--clr-text);">{{ entry.subjectName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-secondary);">{{ entry.teacherName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-muted);">{{ entry.startTime }} - {{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-2 mt-2" *ngIf="canMutateTimetable && !isCoverRow(entry)">
                        <button class="btn-outline-erp btn-xs" (click)="openEditModal(entry)">{{ 'timetable.edit' | translate }}</button>
                        <button class="btn-outline-erp btn-xs" (click)="deleteEntry(entry.id)">{{ 'timetable.delete' | translate }}</button>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #emptySlot>
                    <span style="color: var(--clr-text-muted); font-size: 12px;">-</span>
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
          <span class="text-muted small">{{ 'timetable.weekMatrixSubtitle' | translate }}</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="erp-table timetable-calendar">
            <thead>
              <tr>
                <th style="min-width: 88px;">{{ 'timetable.thPeriod' | translate }}</th>
                <th *ngFor="let day of grid?.days" style="min-width: 160px;">{{ weekdayLabel(day) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let period of grid?.periods">
                <td>
                  <strong>{{ 'timetable.gridPeriodShort' | translate: { n: period } }}</strong>
                </td>
                <td *ngFor="let day of grid?.days">
                  <ng-container *ngIf="getEntry(day, period) as entry; else emptyCal">
                    <div class="timetable-slot-cell" [class.timetable-slot--cover]="isCoverRow(entry)">
                      <div *ngIf="isCoverRow(entry)" class="mb-1">
                        <span class="badge-erp badge-info" style="font-size: 8px;">{{ 'timetable.coverBadge' | translate }}</span>
                      </div>
                      <div style="font-weight: 700; font-size: 13px;">{{ entry.subjectName }}</div>
                      <div style="font-size: 11px; color: var(--clr-text-secondary);">{{ entry.teacherName }}</div>
                      <div style="font-size: 10px; color: var(--clr-text-muted);">{{ entry.startTime }}-{{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-1 mt-1 flex-wrap" *ngIf="canMutateTimetable && !isCoverRow(entry)">
                        <button class="btn-outline-erp btn-xs" (click)="openEditModal(entry)">{{ 'timetable.edit' | translate }}</button>
                        <button class="btn-outline-erp btn-xs" (click)="deleteEntry(entry.id)">{{ 'timetable.deleteShort' | translate }}</button>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #emptyCal><span class="text-muted" style="font-size: 11px;">{{ 'timetable.emptyCell' | translate }}</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card animate-in py-2 px-3 mb-4" *ngIf="entries.length">
        <button
          type="button"
          class="btn btn-link p-0 text-start w-100 erp-collapse-toggle"
          (click)="showSlotList = !showSlotList"
          [attr.aria-expanded]="showSlotList"
        >
          <span class="me-2"><i class="bi" [ngClass]="showSlotList ? 'bi-chevron-down' : 'bi-chevron-right'"></i></span>
          <strong>{{ 'timetable.flatListTitle' | translate }}</strong>
          <span class="text-muted small ms-2">{{ 'timetable.flatListHint' | translate }}</span>
        </button>
        <div *ngIf="showSlotList" class="mt-3">
          <table class="erp-table mb-0">
            <thead>
              <tr>
                <th>{{ 'timetable.thDay' | translate }}</th>
                <th>{{ 'timetable.thPeriod' | translate }}</th>
                <th>{{ 'timetable.thSubject' | translate }}</th>
                <th>{{ 'timetable.thTeacher' | translate }}</th>
                <th>{{ 'timetable.thTime' | translate }}</th>
                <th>{{ 'timetable.thRoom' | translate }}</th>
                <th *ngIf="canMutateTimetable">{{ 'timetable.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of entries">
                <td>{{ weekdayLabel(entry.day) }}</td>
                <td>{{ entry.period }}</td>
                <td>{{ entry.subjectName }}</td>
                <td>{{ entry.teacherName }}</td>
                <td>{{ entry.startTime }} - {{ entry.endTime }}</td>
                <td>{{ entry.room }}</td>
                <td *ngIf="canMutateTimetable">
                  <div class="d-flex gap-1" *ngIf="!isCoverRow(entry)">
                    <button type="button" class="btn-icon" (click)="openEditModal(entry)"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-icon" (click)="deleteEntry(entry.id)"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
                  </div>
                  <span *ngIf="isCoverRow(entry)" class="text-muted small">{{ 'timetable.coverRowLabel' | translate }}</span>
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
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelDate' | translate }}</label>
            <app-erp-date-picker
              [(ngModel)]="coverDate"
              (ngModelChange)="reloadCoversAdmin()"
              placeholderI18nKey="operations.covers.phCoverDate"
            />
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.classId" (change)="coverForm.sectionId = null">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name | schoolClassName }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelSection' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.sectionId">
              <option [ngValue]="null">{{ 'operations.covers.allSections' | translate }}</option>
              <option *ngFor="let s of coverSections" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelPeriod' | translate }}</label>
            <input
              type="number"
              min="1"
              max="12"
              class="erp-input"
              [(ngModel)]="coverForm.periodNumber"
              erpI18nPh="operations.covers.phPeriod"
              [title]="'operations.covers.periodTitle' | translate"
            />
          </div>
          <div class="col-md-4">
            <label class="erp-label">{{ 'operations.covers.labelCoveringTeacher' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.coveringTeacherId">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let te of teachers" [ngValue]="te.id">{{ te.firstName }} {{ te.lastName }}</option>
            </select>
          </div>
        </div>
        <div class="erp-form-group mb-3">
          <label class="erp-label">{{ 'operations.covers.labelReason' | translate }}</label>
          <input type="text" class="erp-input" [(ngModel)]="coverForm.reason" erpI18nPh="operations.covers.phReason" />
        </div>
        <button type="button" class="btn-primary-erp btn-sm me-2" (click)="submitCover()">{{ 'operations.covers.addCover' | translate }}</button>
        <button type="button" class="btn-outline-erp btn-sm" (click)="reloadCoversAdmin()">{{ 'operations.covers.refreshList' | translate }}</button>
        <table class="erp-table mt-3 mb-0">
          <thead>
            <tr>
              <th>{{ 'operations.covers.thDate' | translate }}</th>
              <th>{{ 'operations.covers.thClass' | translate }}</th>
              <th>{{ 'operations.covers.thSection' | translate }}</th>
              <th>{{ 'operations.covers.thCovering' | translate }}</th>
              <th>{{ 'operations.covers.thStatus' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of coversAdmin">
              <td>{{ c.coverDate }}</td>
              <td>{{ c.classId }}</td>
              <td>{{ c.sectionId || ('transport.dash' | translate) }}</td>
              <td>{{ c.coveringTeacherId }}</td>
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
              <label class="erp-label">{{ 'timetable.labelSubject' | translate }}</label>
              <input class="erp-input" [(ngModel)]="entryForm.subjectName" />
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
                  <option [ngValue]="null">{{ 'timetable.sectionWholeClass' | translate }}</option>
                  <option *ngFor="let sec of entryFormSections" [ngValue]="sec.id">{{ sec.name }}</option>
                </select>
              </div>
            </ng-container>
            <div class="col-md-6">
              <label class="erp-label">{{ 'timetable.labelStart' | translate }}</label>
              <input class="erp-input" type="time" [(ngModel)]="entryForm.startTime" />
            </div>
            <div class="col-md-6">
              <label class="erp-label">{{ 'timetable.labelEnd' | translate }}</label>
              <input class="erp-input" type="time" [(ngModel)]="entryForm.endTime" />
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
  showSlotList = false;
  showModal = false;
  editingEntryId: number | null = null;
  dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  entryForm: TimetableEntryForm = this.defaultEntryForm();
  teacherViewDate = new Date().toISOString().split('T')[0];

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

  get entryFormSections(): { id: number; name: string }[] {
    const cid = this.entryForm.classId ?? undefined;
    const c = cid != null ? this.classes.find(x => x.id === cid) : undefined;
    return c ? c.sections.map(s => ({ id: s.id, name: s.name })) : [];
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    const r = (this.auth.getRole() ?? '').toLowerCase();
    this.isAdmin = r === 'admin' || r === 'super_admin';
    this.isParent = r === 'parent';
    this.canMutateTimetable = r === 'admin';
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
    if (this.isParent) {
      this.loadParentTimetableContext();
    } else {
      this.refreshTimetable();
    }
    if (this.isAdmin && this.timetableSection === 'covers') {
      this.bootstrapCoversAdmin();
    }
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
    this.operations.listAttendanceCoversAdmin(this.coverDate).subscribe(rows => (this.coversAdmin = rows || []));
  }

  submitCover(): void {
    if (this.coverForm.classId == null || this.coverForm.coveringTeacherId == null) {
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
        coveringTeacherId: this.coverForm.coveringTeacherId!,
        reason: this.coverForm.reason,
        periodNumber: period,
        replaceCoverAssignmentId,
      })
      .subscribe({
        next: () => this.reloadCoversAdmin(),
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
                  this.translate.instant('operations.covers.conflictDetailClass', { id: String(c.classId ?? this.coverForm.classId) }),
                ],
                variant: 'warning',
                confirmLabel: this.translate.instant('operations.covers.conflictConfirmReplace'),
                cancelLabel: this.translate.instant('operations.covers.conflictKeep'),
              })
              .pipe(filter(Boolean), take(1))
              .subscribe(() => this.createCoverWithOptionalReplace(c.existingCoverAssignmentId));
            return;
          }
          console.error(e);
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
      .subscribe(() => this.operations.cancelAttendanceCover(c.id).subscribe(() => this.reloadCoversAdmin()));
  }

  get isTeacherViewer(): boolean {
    return (this.auth.getRole() ?? '').toLowerCase() === 'teacher';
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
        byClass.set(cid, { name: ch.className?.trim() || `Class ${cid}`, sections: new Map() });
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
    this.teacherService.getTeachers().subscribe(teachers => {
      this.teachers = teachers;
      if (this.scheduleScope === 'teacher' && this.selectedTeacherId == null && this.isTeacherViewer) {
        const me = this.auth.getCurrentUser()?.id;
        const row = teachers.find(t => t.userId === me);
        if (row) {
          this.selectedTeacherId = row.id;
        }
      }
      this.academicService.getClasses().subscribe(classes => {
        this.classes = classes;
        const sel = this.classes.find(c => c.id === this.selectedClassId);
        this.sections = sel ? sel.sections.map(s => ({ id: s.id, name: s.name })) : [];
        if (this.scheduleScope === 'class') {
          this.loadTimetable();
        } else if (this.selectedTeacherId != null) {
          this.loadTeacherTimetable();
        }
      });
    });
  }

  setScheduleScope(scope: 'class' | 'teacher'): void {
    this.scheduleScope = scope;
    this.entries = [];
    this.grid = null;
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

  private loadTeacherTimetable(): void {
    if (this.selectedTeacherId == null) {
      return;
    }
    this.timetableService.getByTeacher(this.selectedTeacherId, this.teacherViewDate).subscribe(entries => {
      this.entries = entries;
      this.grid = this.timetableService.toGridFromEntries(entries);
    });
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
      this.parentService.getChildTimetableEntries(this.selectedChildId).subscribe(entries => (this.entries = entries));
      this.parentService.getChildTimetableGrid(this.selectedChildId).subscribe(grid => (this.grid = grid));
      return;
    }
    if (this.selectedClassId == null) return;
    if (this.sections.length > 0 && this.selectedSectionId == null) return;
    const sectionArg = this.sections.length > 0 ? this.selectedSectionId! : undefined;
    this.timetableService.getByClassAndSection(this.selectedClassId, sectionArg).subscribe(entries => (this.entries = entries));
    this.timetableService.getGrid(this.selectedClassId, sectionArg).subscribe(grid => (this.grid = grid));
  }

  getEntry(day: string, period: number): TimetableEntry | undefined {
    const nd = this.normalizeDay(day);
    return this.entries.find(entry => this.normalizeDay(entry.day) === nd && entry.period === period);
  }

  openCreateModal(): void {
    if (!this.canMutateTimetable) {
      return;
    }
    this.editingEntryId = null;
    this.entryForm = this.defaultEntryForm();
    if (this.scheduleScope === 'teacher') {
      this.entryForm.teacherId = this.selectedTeacherId ?? undefined;
      this.syncTeacherName();
      this.entryForm.classId = this.classes[0]?.id ?? null;
      this.entryForm.sectionId = this.entryFormSections[0]?.id ?? null;
    }
    this.showModal = true;
  }

  openEditModal(entry: TimetableEntry): void {
    if (!this.canMutateTimetable || this.isCoverRow(entry)) {
      return;
    }
    this.editingEntryId = entry.id;
    this.entryForm = { ...entry };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.entryForm = this.defaultEntryForm();
    this.editingEntryId = null;
  }

  syncTeacherName(): void {
    const tid = this.entryForm.teacherId ?? undefined;
    const teacher = tid != null ? this.teachers.find(item => item.id === tid) : undefined;
    this.entryForm.teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : '';
  }

  saveEntry(): void {
    this.persistTimetableSlot(undefined);
  }

  private persistTimetableSlot(replaceTimetableEntryId?: number): void {
    if (!this.canMutateTimetable) {
      return;
    }
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
    const teacherId = this.entryForm.teacherId ?? 0;
    const payload: TimetableEntry = {
      id: this.editingEntryId ?? 0,
      classId,
      sectionId,
      day: this.entryForm.day || 'Monday',
      period: Number(this.entryForm.period || 1),
      startTime: this.entryForm.startTime || '',
      endTime: this.entryForm.endTime || '',
      subjectName: this.entryForm.subjectName || '',
      teacherId,
      teacherName: this.entryForm.teacherName || '',
      room: this.entryForm.room || '',
      tenantId: '',
    };
    const request$ =
      this.editingEntryId != null
        ? this.timetableService.updateEntry(this.editingEntryId, payload, replaceTimetableEntryId)
        : this.timetableService.addEntry(payload, replaceTimetableEntryId);
    request$.subscribe({
      next: () => {
        this.closeModal();
        if (this.scheduleScope === 'class') {
          this.loadTimetable();
        } else {
          this.loadTeacherTimetable();
        }
      },
      error: (e: unknown) => {
        if (e instanceof TimetableConflictError) {
          this.promptTimetableConflictReplace(e);
          return;
        }
        console.error(e);
      },
    });
  }

  private promptTimetableConflictReplace(err: TimetableConflictError): void {
    const p = err.conflict;
    const isClass = p.conflictType === 'CLASS_PERIOD_OCCUPIED';
    this.confirmDialog
      .confirm({
        title: this.translate.instant(isClass ? 'timetable.conflictClassTitle' : 'timetable.conflictTeacherTitle'),
        message: this.translate.instant(isClass ? 'timetable.conflictClassMessage' : 'timetable.conflictTeacherMessage', {
          subject: p.subjectName ?? '—',
          teacher: p.teacherName ?? '—',
          clazz: String(p.classId ?? '—'),
          section: String(p.sectionId ?? '—'),
          day: p.day,
          period: String(p.period),
        }),
        details: [
          this.translate.instant('timetable.conflictDetailPeriod', { day: p.day, period: p.period }),
          ...(isClass
            ? []
            : [
                this.translate.instant('timetable.conflictDetailOtherClass', {
                  clazz: String(p.conflictingClassId ?? p.classId ?? '—'),
                  section: String(p.conflictingSectionId ?? '—'),
                }),
              ]),
        ],
        variant: 'warning',
        confirmLabel: this.translate.instant('timetable.conflictReplace'),
        cancelLabel: this.translate.instant('timetable.conflictKeep'),
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => this.persistTimetableSlot(p.existingEntryId));
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
          if (this.scheduleScope === 'class') {
            this.loadTimetable();
          } else {
            this.loadTeacherTimetable();
          }
        });
      });
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
