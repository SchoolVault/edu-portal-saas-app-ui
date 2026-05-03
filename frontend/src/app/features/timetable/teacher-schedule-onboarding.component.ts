import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import { TimetableConflictError } from '../../core/errors/timetable-conflict.error';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  ApplyTeacherScheduleOnboardingRequest,
  SchoolClass,
  Teacher,
  TeacherScheduleValidationIssue,
  TimetableEntry,
  ValidateTeacherScheduleOnboardingResponse,
  type TimetableConflictPayload,
} from '../../core/models/models';
import { formatSchoolClassDisplayName } from '../../core/i18n/school-class-display';
import {
  buildTimetableConflictDialogStrings,
  createTimetableConflictHumanLabels,
} from '../../core/timetable/timetable-conflict-dialog.builder';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { RouterModule } from '@angular/router';

type DayApi = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

interface DraftSlot {
  /** Stable client id for *ngFor */
  key: string;
  existingEntryId?: number;
  /** When server returns 409, retry once after removing this timetable row id (duplicate-safe). */
  replaceTimetableEntryId?: number;
  day: DayApi;
  period: number;
  startTime: string;
  endTime: string;
  classId: number | null;
  sectionId: number | null;
  subjectName: string;
  room: string;
}

@Component({
  selector: 'app-teacher-schedule-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule, TranslateModule, ErpI18nPhDirective],
  styles: [
    `
      .onb-hero {
        border-radius: var(--radius-lg);
        border: 1px solid var(--clr-border-light);
        background: color-mix(in srgb, var(--clr-primary) 5%, var(--clr-surface));
        padding: 16px 18px;
      }
      .onb-slot-row:nth-child(even) {
        background: color-mix(in srgb, var(--clr-surface-muted) 55%, transparent);
      }
      .onb-time-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .onb-time-part {
        min-width: 68px;
        font-variant-numeric: tabular-nums;
      }
      .onb-time-sep {
        color: var(--clr-text-muted);
        font-weight: 700;
      }
      .onb-success-toast {
        position: fixed;
        left: 50%;
        top: 18px;
        transform: translateX(-50%);
        z-index: 12000;
        width: min(520px, calc(100vw - 24px));
        border-radius: var(--radius-lg);
        border: 1px solid color-mix(in srgb, var(--clr-success) 35%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-success) 8%, var(--clr-surface));
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }
      .onb-success-toast-body {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        align-items: start;
        padding: 12px 14px 10px;
      }
      .onb-success-icon {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--clr-success) 20%, var(--clr-surface));
        color: var(--clr-success);
        font-size: 14px;
      }
      .onb-success-title {
        margin: 1px 0 2px;
        font-size: 13px;
        font-weight: 800;
        color: var(--clr-success);
      }
      .onb-success-message {
        margin: 0;
        font-size: 12.5px;
        color: var(--clr-text-secondary);
      }
      .onb-success-close {
        border: 0;
        background: transparent;
        color: var(--clr-text-muted);
        font-size: 16px;
        line-height: 1;
        padding: 0;
        margin-top: 2px;
      }
      .onb-success-progress {
        height: 3px;
        background: color-mix(in srgb, var(--clr-success) 70%, #ffffff);
        animation: onbSuccessShrink 5s linear forwards;
        transform-origin: left;
      }
      @keyframes onbSuccessShrink {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
    `,
  ],
  template: `
    <aside *ngIf="showSuccessToast" class="onb-success-toast animate-in" role="status" aria-live="polite">
      <div class="onb-success-toast-body">
        <span class="onb-success-icon"><i class="bi bi-check2-circle"></i></span>
        <div>
          <p class="onb-success-title">{{ 'timetableOnboarding.successToastTitle' | translate }}</p>
          <p class="onb-success-message">{{ 'timetableOnboarding.savedSummary' | translate: successToastParams }}</p>
        </div>
        <button
          type="button"
          class="onb-success-close"
          (click)="dismissSuccessToast()"
          [attr.aria-label]="'timetableOnboarding.successToastClose' | translate">×</button>
      </div>
      <div class="onb-success-progress"></div>
    </aside>

    <div data-testid="teacher-schedule-onboarding" class="animate-in">
      <div class="erp-tabs mb-3">
        <a class="erp-tab" routerLink="/app/timetable">{{ 'timetable.tab.schedule' | translate }}</a>
        <a class="erp-tab" [routerLink]="['/app/timetable']" [queryParams]="{ section: 'covers' }">{{
          'timetable.tab.coversAdmin' | translate
        }}</a>
        <span class="erp-tab active">{{ 'timetable.tab.assign' | translate }}</span>
      </div>
      <div class="mb-3">
        <div>
          <h2 class="timetable-page-title" style="font-size: 24px; font-weight: 800;">{{ 'timetableOnboarding.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'timetableOnboarding.pageLead' | translate }}</p>
        </div>
      </div>

      <div class="onb-hero mb-4">
        <p class="mb-2 small" style="color: var(--clr-text-secondary);">{{ 'timetableOnboarding.hero' | translate }}</p>
      </div>

      <div class="erp-card mb-3">
        <h4 class="erp-card-title mb-2">{{ 'timetableOnboarding.step1' | translate }}</h4>
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="erp-label">{{ 'timetable.labelTeacher' | translate }}</label>
            <select class="erp-select" [(ngModel)]="teacherId" (ngModelChange)="onTeacherChange()">
              <option [ngValue]="null">{{ 'timetable.selectTeacher' | translate }}</option>
              <option *ngFor="let t of teachers" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
            </select>
          </div>
          <div class="col-md-6">
            <button type="button" class="btn-outline-erp btn-sm" [disabled]="!teacherId || loading" (click)="reloadFromServer()">
              {{ 'timetableOnboarding.reload' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div class="erp-card mb-3" *ngIf="teacherId">
        <h4 class="erp-card-title mb-2">{{ 'timetableOnboarding.step2' | translate }}</h4>
        <p class="small text-muted mb-3">{{ 'timetableOnboarding.homeroomHelp' | translate }}</p>
        <p *ngIf="catalogHomeroomLocked" class="small mb-2" style="color: var(--clr-text-secondary);">
          {{ 'timetableOnboarding.homeroomLockedHint' | translate }}
        </p>
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="erp-label">{{ 'timetable.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="hmClassId" (ngModelChange)="onHmClassChange()" [disabled]="catalogHomeroomLocked">
              <option [ngValue]="null">{{ 'timetable.selectClass' | translate }}</option>
              <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-4" *ngIf="hmClassHasSections">
            <label class="erp-label">{{ 'timetable.labelSection' | translate }}</label>
            <select class="erp-select" [(ngModel)]="hmSectionId" [disabled]="catalogHomeroomLocked">
              <option [ngValue]="null">{{ 'timetable.selectSection' | translate }}</option>
              <option *ngFor="let s of hmSections" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="erp-card mb-3" *ngIf="teacherId">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h4 class="erp-card-title mb-0">{{ 'timetableOnboarding.step3' | translate }}</h4>
          <button type="button" class="btn-outline-erp btn-sm" (click)="addDraftRow()">{{ 'timetableOnboarding.addRow' | translate }}</button>
        </div>
        <p class="small text-muted mb-3">{{ 'timetableOnboarding.slotsHelp' | translate }}</p>
        <div class="erp-table-scroll">
          <table class="erp-table mb-0">
            <thead>
              <tr>
                <th>{{ 'timetable.thDay' | translate }}</th>
                <th>{{ 'timetable.thPeriod' | translate }}</th>
                <th>{{ 'timetable.labelStart' | translate }}</th>
                <th>{{ 'timetable.labelEnd' | translate }}</th>
                <th>{{ 'timetable.labelClass' | translate }}</th>
                <th>{{ 'timetable.labelSection' | translate }}</th>
                <th>{{ 'timetable.thSubject' | translate }}</th>
                <th>{{ 'timetable.thRoom' | translate }}</th>
                <th>{{ 'timetable.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of draftRows; trackBy: trackRow" class="onb-slot-row">
                <td style="min-width: 140px;">
                  <select class="erp-select" [(ngModel)]="r.day">
                    <option *ngFor="let d of dayOptions" [ngValue]="d">{{ 'timetable.days.' + dayI18nKey(d) | translate }}</option>
                  </select>
                </td>
                <td style="min-width: 88px;">
                  <input type="number" class="erp-input" min="1" max="12" [(ngModel)]="r.period" />
                </td>
                <td style="min-width: 100px;">
                  <div class="onb-time-wrap">
                    <select
                      class="erp-select onb-time-part"
                      [ngModel]="getTimePart(r.startTime, 'hour')"
                      (ngModelChange)="setTimePart(r, 'start', 'hour', $event)">
                      <option *ngFor="let h of hourOptions" [ngValue]="h">{{ h }}</option>
                    </select>
                    <select
                      class="erp-select onb-time-part"
                      [ngModel]="getTimePart(r.startTime, 'minute')"
                      (ngModelChange)="setTimePart(r, 'start', 'minute', $event)">
                      <option *ngFor="let m of minuteOptions" [ngValue]="m">{{ m }}</option>
                    </select>
                  </div>
                </td>
                <td style="min-width: 100px;">
                  <div class="onb-time-wrap">
                    <select
                      class="erp-select onb-time-part"
                      [ngModel]="getTimePart(r.endTime, 'hour')"
                      (ngModelChange)="setTimePart(r, 'end', 'hour', $event)">
                      <option *ngFor="let h of hourOptions" [ngValue]="h">{{ h }}</option>
                    </select>
                    <select
                      class="erp-select onb-time-part"
                      [ngModel]="getTimePart(r.endTime, 'minute')"
                      (ngModelChange)="setTimePart(r, 'end', 'minute', $event)">
                      <option *ngFor="let m of minuteOptions" [ngValue]="m">{{ m }}</option>
                    </select>
                  </div>
                </td>
                <td style="min-width: 140px;">
                  <select class="erp-select" [(ngModel)]="r.classId" (ngModelChange)="onDraftClassChange(r)">
                    <option [ngValue]="null">{{ 'timetable.selectClass' | translate }}</option>
                    <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
                  </select>
                </td>
                <td style="min-width: 120px;">
                  <select class="erp-select" [(ngModel)]="r.sectionId" [disabled]="!draftSections(r).length">
                    <option *ngIf="draftSections(r).length === 0" [ngValue]="null">{{ 'timetable.sectionWholeClass' | translate }}</option>
                    <option *ngFor="let s of draftSections(r)" [ngValue]="s.id">{{ s.name }}</option>
                  </select>
                </td>
                <td style="min-width: 160px;">
                  <select
                    *ngIf="subjectCatalogNames.length"
                    class="erp-select mb-1"
                    [(ngModel)]="r.subjectName"
                    [name]="'onbSubjSel' + r.key"
                  >
                    <option [ngValue]="''">{{ 'timetable.selectSubject' | translate }}</option>
                    <option *ngFor="let n of subjectCatalogNames" [ngValue]="n">{{ n }}</option>
                  </select>
                  <p *ngIf="!subjectCatalogNames.length" class="small mb-0" style="color: var(--clr-warning);">
                    {{ 'timetable.subjectCatalogEmpty' | translate }}
                    <a routerLink="/app/academic" fragment="erp-subject-catalog" class="text-nowrap">{{ 'timetable.manageSubjectCatalog' | translate }}</a>
                  </p>
                </td>
                <td><input type="text" class="erp-input" [(ngModel)]="r.room" erpI18nPh="timetableOnboarding.phRoom" /></td>
                <td>
                  <button type="button" class="btn-outline-erp btn-xs" (click)="removeRow(r)">{{ 'timetable.deleteShort' | translate }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="teacherId">
        <label class="d-flex align-items-center gap-2 mb-3">
          <input type="checkbox" [(ngModel)]="anchorMonday" />
          <span>{{ 'timetableOnboarding.optAnchor' | translate }}</span>
        </label>
        <button type="button" class="btn-primary-erp" [disabled]="saving || !canSave" (click)="save()">
          <span class="spinner" *ngIf="saving"></span>
          {{ saving ? ('timetableOnboarding.saving' | translate) : ('timetableOnboarding.save' | translate) }}
        </button>
        <p *ngIf="lastError" class="small mt-3 mb-0" style="color: var(--clr-danger);" [attr.data-testid]="'timetable-onb-error'">{{ lastError }}</p>
      </div>

    </div>
  `,
})
export class TeacherScheduleOnboardingComponent implements OnInit, OnDestroy {
  teachers: Teacher[] = [];
  classes: SchoolClass[] = [];
  /** Sorted unique subject names from {@link AcademicService#getSubjectCatalog} for slot picklists. */
  subjectCatalogNames: string[] = [];
  /** True when homeroom was resolved from an existing class-teacher assignment — fields stay fixed to avoid accidental edits. */
  catalogHomeroomLocked = false;
  teacherId: number | null = null;
  hmClassId: number | null = null;
  hmSectionId: number | null = null;
  draftRows: DraftSlot[] = [];
  removedEntryIds: number[] = [];
  anchorMonday = true;
  loading = false;
  saving = false;
  lastError = '';
  showSuccessToast = false;
  successToastParams: Record<string, string | number> = {};
  private successToastTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly translate = inject(TranslateService);

  readonly dayOptions: DayApi[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  readonly hourOptions: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minuteOptions: string[] = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  constructor(
    private academic: AcademicService,
    private teacherService: TeacherService,
    private timetable: TimetableService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    forkJoin({
      teachers: this.teacherService.getTeachersPage({ page: 0, size: 500 }),
      classes: this.academic.getClasses(),
      catalog: this.academic.getSubjectCatalog(),
    }).subscribe({
      next: ({ teachers, classes, catalog }) => {
        this.teachers = teachers.content ?? [];
        this.classes = classes;
        this.subjectCatalogNames = [...new Set(catalog.map(s => (s.name ?? '').trim()).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b)
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.clearSuccessToastTimer();
  }

  get hmClass(): SchoolClass | undefined {
    return this.classes.find(c => c.id === this.hmClassId);
  }

  get hmClassHasSections(): boolean {
    return (this.hmClass?.sections?.length ?? 0) > 0;
  }

  get hmSections() {
    return this.hmClass?.sections ?? [];
  }

  get canSave(): boolean {
    if (!this.teacherId) {
      return false;
    }
    return this.draftRows.every(
      r => r.classId != null && r.period >= 1 && (r.subjectName || '').trim().length > 0
    );
  }

  dayI18nKey(d: DayApi): string {
    const m: Record<DayApi, string> = {
      MONDAY: 'monday',
      TUESDAY: 'tuesday',
      WEDNESDAY: 'wednesday',
      THURSDAY: 'thursday',
      FRIDAY: 'friday',
      SATURDAY: 'saturday',
    };
    return m[d];
  }

  trackRow(_: number, r: DraftSlot): string {
    return r.key;
  }

  onTeacherChange(): void {
    this.lastError = '';
    this.dismissSuccessToast();
    this.removedEntryIds = [];
    this.catalogHomeroomLocked = false;
    this.hmClassId = null;
    this.hmSectionId = null;
    if (!this.teacherId) {
      this.draftRows = [];
      return;
    }
    this.prefillHomeroomFromCatalog();
    this.reloadFromServer();
  }

  onHmClassChange(): void {
    const c = this.hmClass;
    if (!c?.sections?.length) {
      this.hmSectionId = null;
    } else if (this.hmSectionId != null && !c.sections.some(s => s.id === this.hmSectionId)) {
      this.hmSectionId = c.sections[0]?.id ?? null;
    }
  }

  prefillHomeroomFromCatalog(): void {
    if (!this.teacherId) {
      this.catalogHomeroomLocked = false;
      return;
    }
    for (const c of this.classes) {
      if (!c.sections?.length && c.classTeacherId === this.teacherId) {
        this.hmClassId = c.id;
        this.hmSectionId = null;
        this.catalogHomeroomLocked = true;
        return;
      }
      for (const s of c.sections ?? []) {
        if (s.classTeacherId === this.teacherId) {
          this.hmClassId = c.id;
          this.hmSectionId = s.id;
          this.catalogHomeroomLocked = true;
          return;
        }
      }
    }
    this.hmClassId = null;
    this.hmSectionId = null;
    this.catalogHomeroomLocked = false;
  }

  reloadFromServer(): void {
    if (!this.teacherId) {
      return;
    }
    this.loading = true;
    this.timetable.getByTeacher(this.teacherId).subscribe({
      next: rows => {
        this.loading = false;
        const base = rows.filter(
          e => !e.coverForDate && e.scheduleSource !== 'COVER' && Number(e.id) > 0
        );
        this.draftRows = base.map(e => this.entryToDraft(e));
        if (!this.draftRows.length) {
          this.addDraftRow();
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private entryToDraft(e: TimetableEntry): DraftSlot {
    const day = (e.day || 'Monday').toUpperCase() as DayApi;
    const fallback = this.periodWindowText(e.period);
    const aligned = this.resolveSubjectCatalogName(e.subjectName);
    return {
      key: `e-${e.id}`,
      existingEntryId: e.id,
      day: this.dayOptions.includes(day) ? day : 'MONDAY',
      period: e.period,
      startTime: this.toHmTime(e.startTime) || fallback.start,
      endTime: this.toHmTime(e.endTime) || fallback.end,
      classId: e.classId,
      sectionId: e.sectionId > 0 ? e.sectionId : null,
      subjectName: aligned ?? (this.subjectCatalogNames.length ? '' : (e.subjectName ?? '')),
      room: e.room || '',
    };
  }

  private resolveSubjectCatalogName(raw: string | null | undefined): string | null {
    const t = (raw ?? '').trim();
    if (!t) {
      return null;
    }
    return this.subjectCatalogNames.find(n => n.toLowerCase() === t.toLowerCase()) ?? null;
  }

  addDraftRow(): void {
    const fallback = this.periodWindowText(1);
    this.draftRows.push({
      key: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      day: 'MONDAY',
      period: 1,
      startTime: fallback.start,
      endTime: fallback.end,
      classId: this.hmClassId ?? this.classes[0]?.id ?? null,
      sectionId: this.hmSectionId,
      subjectName: '',
      room: '',
    });
  }

  draftSections(r: DraftSlot) {
    const c = this.classes.find(x => x.id === r.classId);
    return c?.sections ?? [];
  }

  onDraftClassChange(r: DraftSlot): void {
    const secs = this.draftSections(r);
    if (!secs.length) {
      r.sectionId = null;
    } else if (r.sectionId != null && !secs.some(s => s.id === r.sectionId)) {
      r.sectionId = secs[0].id;
    }
  }

  removeRow(r: DraftSlot): void {
    if (r.existingEntryId != null) {
      this.removedEntryIds.push(r.existingEntryId);
    }
    this.draftRows = this.draftRows.filter(x => x.key !== r.key);
  }

  save(): void {
    this.saveWithConfirmation(false);
  }

  private saveWithConfirmation(skipConfirmation: boolean): void {
    if (!this.teacherId || !this.canSave) {
      return;
    }
    const draftValidationError = this.validateDraftRowsBeforeSave();
    if (draftValidationError) {
      this.lastError = this.translate.instant(draftValidationError);
      return;
    }
    if (this.hmClassId != null && this.hmClassHasSections && this.hmSectionId == null) {
      this.lastError = this.translate.instant('timetableOnboarding.errSectionRequired');
      return;
    }
    const tid = this.teacherId;
    const cls = this.hmClass;
    const homeroom =
      this.hmClassId != null && cls
        ? {
            classId: this.hmClassId,
            sectionId: cls.sections?.length ? this.hmSectionId : null,
          }
        : undefined;

    const body: ApplyTeacherScheduleOnboardingRequest = {
      teacherId: tid,
      homeroom: homeroom ?? null,
      removeEntryIds: [...new Set(this.removedEntryIds)],
      slots: this.draftRows.map(r => ({
        existingEntryId: r.existingEntryId,
        day: r.day,
        period: r.period,
        startTime: r.startTime?.trim() || null,
        endTime: r.endTime?.trim() || null,
        classId: r.classId!,
        sectionId: r.sectionId,
        subjectName: this.resolveSubjectCatalogName(r.subjectName.trim()) ?? r.subjectName.trim(),
        room: r.room?.trim() || null,
        replaceTimetableEntryId: r.replaceTimetableEntryId ?? undefined,
      })),
      options: { anchorMondayFirstPeriod: this.anchorMonday },
    };
    if (!skipConfirmation) {
      this.saving = true;
      this.timetable.validateTeacherScheduleOnboarding(body).subscribe({
        next: validation => {
          this.saving = false;
          if (!validation.valid) {
            this.openValidationBlockedDialog(validation);
            return;
          }
          const summary = this.buildPendingChangeSummary(validation);
          this.confirmDialog
            .confirm({
              title: this.translate.instant('timetableOnboarding.confirmTitle'),
              message: this.translate.instant('timetableOnboarding.confirmMessage'),
              details: summary,
              confirmLabel: this.translate.instant('timetableOnboarding.confirmProceed'),
              cancelLabel: this.translate.instant('timetableOnboarding.confirmCancel'),
              variant: 'warning',
            })
            .pipe(filter(Boolean), take(1))
            .subscribe(() => this.saveWithConfirmation(true));
        },
        error: (err: unknown) => {
          this.saving = false;
          this.lastError = err instanceof Error ? err.message : this.translate.instant('timetableOnboarding.validationFailed');
        },
      });
      return;
    }

    this.saving = true;
    this.lastError = '';
    this.timetable.applyTeacherScheduleOnboarding(body).subscribe({
      next: res => {
        this.saving = false;
        this.removedEntryIds = [];
        this.draftRows.forEach(r => {
          delete r.replaceTimetableEntryId;
        });
        this.successToastParams = {
          created: res.createdEntryIds?.length ?? 0,
          updated: res.updatedEntryIds?.length ?? 0,
          removed: res.removedEntryIds?.length ?? 0,
        };
        this.presentSuccessToast();
        this.reloadFromServer();
      },
      error: (err: unknown) => {
        this.saving = false;
        if (err instanceof TimetableConflictError) {
          const row = this.findDraftRowForConflict(err.conflict);
          if (row?.replaceTimetableEntryId === err.conflict.existingEntryId) {
            this.lastError = this.translate.instant('timetableOnboarding.conflictPersistent');
            delete row.replaceTimetableEntryId;
            return;
          }
        this.lastError = '';
        this.promptOnboardingConflictReplace(err);
          return;
        }
        this.lastError = err instanceof Error ? err.message : this.translate.instant('timetableOnboarding.saveFailed');
      },
    });
  }

  dismissSuccessToast(): void {
    this.showSuccessToast = false;
    this.clearSuccessToastTimer();
  }

  private presentSuccessToast(): void {
    this.showSuccessToast = true;
    this.clearSuccessToastTimer();
    this.successToastTimer = setTimeout(() => {
      this.showSuccessToast = false;
      this.successToastTimer = null;
    }, 5000);
  }

  private clearSuccessToastTimer(): void {
    if (this.successToastTimer != null) {
      clearTimeout(this.successToastTimer);
      this.successToastTimer = null;
    }
  }

  /**
   * Mirrors backend onboarding slot window: period-1 starts at 08:00, each period is 45 minutes.
   */
  periodWindowText(period: number): { start: string; end: string } {
    const p = Number.isFinite(period) && period > 0 ? Math.floor(period) : 1;
    const startMinutes = (p - 1) * 45;
    const startHour = 8 + Math.floor(startMinutes / 60);
    const startMin = startMinutes % 60;
    const endMinutes = startMinutes + 45;
    const endHour = 8 + Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return { start: hhmm(startHour, startMin), end: hhmm(endHour, endMin) };
  }

  private toHmTime(raw: string | null | undefined): string {
    if (!raw) {
      return '';
    }
    const t = raw.trim();
    if (/^\d{2}:\d{2}$/.test(t)) {
      return t;
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) {
      return t.slice(0, 5);
    }
    return '';
  }

  private isTimeText(raw: string | null | undefined): boolean {
    return !!raw && /^\d{2}:\d{2}$/.test(raw.trim());
  }

  private timeToMinutes(raw: string | null | undefined): number | null {
    if (!this.isTimeText(raw)) {
      return null;
    }
    const [hh, mm] = raw!.split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      return null;
    }
    return hh * 60 + mm;
  }

  private isStartBeforeEnd(start: string, end: string): boolean {
    const s = this.timeToMinutes(start);
    const e = this.timeToMinutes(end);
    return s != null && e != null && s < e;
  }

  private overlapsAny(windows: Array<{ start: number; end: number }>, start: number, end: number): boolean {
    return windows.some(w => start < w.end && w.start < end);
  }

  getTimePart(value: string | null | undefined, part: 'hour' | 'minute'): string {
    if (!this.isTimeText(value)) {
      return part === 'hour' ? '08' : '00';
    }
    const [hh, mm] = value!.split(':');
    return part === 'hour' ? hh : mm;
  }

  setTimePart(row: DraftSlot, target: 'start' | 'end', part: 'hour' | 'minute', raw: string): void {
    const source = target === 'start' ? row.startTime : row.endTime;
    const hour = part === 'hour' ? raw : this.getTimePart(source, 'hour');
    const minute = part === 'minute' ? raw : this.getTimePart(source, 'minute');
    const composed = `${hour}:${minute}`;
    if (target === 'start') {
      row.startTime = composed;
      return;
    }
    row.endTime = composed;
  }

  private validateDraftRowsBeforeSave(): string | null {
    const uniqueSlotKeys = new Set<string>();
    const uniqueTeacherPeriodKeys = new Set<string>();
    if (!this.subjectCatalogNames.length) {
      return 'timetableOnboarding.errSubjectCatalogEmpty';
    }
    for (const row of this.draftRows) {
      if (row.classId == null) {
        return 'timetableOnboarding.errClassRequired';
      }
      if (!row.subjectName.trim()) {
        return 'timetableOnboarding.errSubjectRequired';
      }
      const subj = row.subjectName.trim();
      if (!this.subjectCatalogNames.some(n => n.toLowerCase() === subj.toLowerCase())) {
        return 'timetableOnboarding.errSubjectNotInCatalog';
      }
      if (row.period < 1 || row.period > 12) {
        return 'timetableOnboarding.errPeriodRange';
      }
      if (!this.isTimeText(row.startTime) || !this.isTimeText(row.endTime)) {
        return 'timetableOnboarding.errTimeRequired';
      }
      if (!this.isStartBeforeEnd(row.startTime, row.endTime)) {
        return 'timetableOnboarding.errTimeRange';
      }
      const key = `${row.day}|${row.period}|${row.classId}|${row.sectionId ?? 0}`;
      if (uniqueSlotKeys.has(key)) {
        return 'timetableOnboarding.errDuplicateSlot';
      }
      uniqueSlotKeys.add(key);
      const teacherPeriodKey = `${row.day}|${row.period}`;
      if (uniqueTeacherPeriodKeys.has(teacherPeriodKey)) {
        return 'timetableOnboarding.errTeacherDoubleBooked';
      }
      uniqueTeacherPeriodKeys.add(teacherPeriodKey);
      if (this.classHasSections(row.classId) && row.sectionId == null) {
        return 'timetableOnboarding.errSectionRequiredForRow';
      }
      const room = row.room?.trim().toLowerCase();
      if (room) {
        const roomKey = `${row.day}|${row.period}|${room}`;
        if (uniqueSlotKeys.has(`room:${roomKey}`)) {
          return 'timetableOnboarding.errRoomDoubleBooked';
        }
        uniqueSlotKeys.add(`room:${roomKey}`);
      }
    }
    return null;
  }

  private promptOnboardingConflictReplace(err: TimetableConflictError): void {
    const p = err.conflict;
    const labels = createTimetableConflictHumanLabels(this.classes, this.translate);
    const draftAtSlot = this.findDraftRowForConflict(p);
    const dlg = buildTimetableConflictDialogStrings({
      translate: this.translate,
      conflict: p,
      labels,
      pendingClassId: draftAtSlot?.classId ?? null,
      pendingSectionId: draftAtSlot?.sectionId ?? null,
    });
    this.confirmDialog
      .confirm({
        ...dlg,
        variant: 'warning',
      })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        const row = this.findDraftRowForConflict(p);
        if (row) {
          row.replaceTimetableEntryId = p.existingEntryId;
        }
        this.saveWithConfirmation(true);
      });
  }

  private findDraftRowForConflict(p: TimetableConflictPayload): DraftSlot | undefined {
    const wantDay = this.timetable.normalizeWeekdayTitle(p.day);
    return this.draftRows.find(r => {
      if (r.existingEntryId != null) {
        return false;
      }
      const d = this.timetable.normalizeWeekdayTitle(r.day);
      return d === wantDay && r.period === p.period;
    });
  }

  private classHasSections(classId: number | null): boolean {
    if (classId == null) {
      return false;
    }
    return (this.classes.find(c => c.id === classId)?.sections?.length ?? 0) > 0;
  }

  private buildPendingChangeSummary(validation?: ValidateTeacherScheduleOnboardingResponse): string[] {
    const created = validation?.slotsToCreate ?? this.draftRows.filter(r => r.existingEntryId == null).length;
    const updated = validation?.slotsToUpdate ?? this.draftRows.filter(r => r.existingEntryId != null).length;
    const removed = validation?.slotsToDelete ?? [...new Set(this.removedEntryIds)].length;
    const teacher = this.teachers.find(t => t.id === this.teacherId);
    const teacherName = validation?.teacherName || `${teacher?.firstName ?? ''} ${teacher?.lastName ?? ''}`.trim();
    const homeroomLabel = this.describeHomeroomForSummary();
    const warnings = this.buildClientWarningsForSummary(validation);
    const details = [
      this.translate.instant('timetableOnboarding.confirmTeacher', { teacher: teacherName || '—' }),
      this.translate.instant('timetableOnboarding.confirmHomeroom', { homeroom: homeroomLabel }),
      this.translate.instant('timetableOnboarding.confirmCreated', { count: created }),
      this.translate.instant('timetableOnboarding.confirmUpdated', { count: updated }),
      this.translate.instant('timetableOnboarding.confirmRemoved', { count: removed }),
    ];
    if (warnings.length) {
      details.push(this.translate.instant('timetableOnboarding.confirmWarningsHeader'));
      details.push(...warnings.map(w => `- ${w}`));
    } else {
      details.push(this.translate.instant('timetableOnboarding.confirmWarningsNone'));
    }
    return details;
  }

  private openValidationBlockedDialog(validation: ValidateTeacherScheduleOnboardingResponse): void {
    this.lastError = '';
    const issues = validation.issues ?? [];
    const max = 45;
    const shown = issues.slice(0, max);
    const teacherLabel =
      validation.teacherName?.trim() ||
      this.translate.instant('timetableOnboarding.validationBlockedTeacherFallback');
    const details: string[] = [
      this.translate.instant('timetableOnboarding.validationBlockedLead'),
      ...shown.map((i, idx) => `${idx + 1}. ${this.formatValidationIssuePlain(i)}`),
    ];
    if (issues.length > max) {
      details.push(this.translate.instant('timetableOnboarding.validationBlockedTruncated', { count: issues.length - max }));
    }
    details.push(this.translate.instant('timetableOnboarding.validationBlockedFooterTip'));
    this.confirmDialog
      .confirm({
        title: this.translate.instant('timetableOnboarding.validationBlockedTitle'),
        message: this.translate.instant('timetableOnboarding.validationBlockedMessage', {
          teacher: teacherLabel,
          count: issues.length,
        }),
        details,
        confirmLabel: this.translate.instant('timetableOnboarding.validationBlockedAcknowledge'),
        cancelLabel: '',
        variant: 'warning',
        wide: true,
      })
      .pipe(take(1))
      .subscribe(() => undefined);
  }

  private describeHomeroomForSummary(): string {
    if (this.hmClassId == null) {
      return this.translate.instant('timetableOnboarding.confirmHomeroomRemoved');
    }
    const cls = this.classes.find(c => c.id === this.hmClassId);
    if (!cls) {
      return this.translate.instant('timetableOnboarding.confirmHomeroomUnknown');
    }
    if (!cls.sections?.length) {
      return cls.name;
    }
    const sec = cls.sections.find(s => s.id === this.hmSectionId);
    return `${cls.name} - ${(sec?.name ?? '—').trim()}`;
  }

  private buildClientWarningsForSummary(validation?: ValidateTeacherScheduleOnboardingResponse): string[] {
    if (validation?.issues?.length) {
      return validation.issues.slice(0, 4).map(i => this.formatValidationIssuePlain(i));
    }
    const out: string[] = [];
    const teacherKeys = new Set<string>();
    const classKeys = new Set<string>();
    const roomKeys = new Set<string>();
    const teacherWindows = new Map<string, { start: number; end: number }[]>();
    const classWindows = new Map<string, { start: number; end: number }[]>();
    const roomWindows = new Map<string, { start: number; end: number }[]>();
    for (const row of this.draftRows) {
      const tKey = `${row.day}|${row.period}`;
      if (teacherKeys.has(tKey)) {
        out.push(this.translate.instant('timetableOnboarding.warnTeacherDoubleBooked', { day: row.day, period: row.period }));
        break;
      }
      teacherKeys.add(tKey);
      const cKey = `${row.day}|${row.period}|${row.classId ?? 0}|${row.sectionId ?? 0}`;
      if (classKeys.has(cKey)) {
        out.push(this.translate.instant('timetableOnboarding.warnClassDoubleBooked', { day: row.day, period: row.period }));
        break;
      }
      classKeys.add(cKey);
      const room = row.room?.trim().toLowerCase();
      if (room) {
        const rKey = `${row.day}|${row.period}|${room}`;
        if (roomKeys.has(rKey)) {
          out.push(this.translate.instant('timetableOnboarding.warnRoomDoubleBooked', { room: row.room.trim(), day: row.day, period: row.period }));
          break;
        }
        roomKeys.add(rKey);
      }
      if (row.classId != null && this.classHasSections(row.classId) && row.sectionId == null) {
        const cls = this.classes.find(c => c.id === row.classId);
        out.push(this.translate.instant('timetableOnboarding.warnSectionMissing', { clazz: cls?.name ?? row.classId }));
        break;
      }
      const st = this.timeToMinutes(row.startTime);
      const en = this.timeToMinutes(row.endTime);
      if (st == null || en == null || st >= en) {
        out.push(this.translate.instant('timetableOnboarding.warnTimeRangeInvalid'));
        break;
      }
      const classScope = `${row.day}|${row.classId ?? 0}|${row.sectionId ?? 0}`;
      if (this.overlapsAny(classWindows.get(classScope) ?? [], st, en)) {
        out.push(this.translate.instant('timetableOnboarding.warnClassTimeOverlap', { day: row.day }));
        break;
      }
      classWindows.set(classScope, [...(classWindows.get(classScope) ?? []), { start: st, end: en }]);
      const teacherScope = `${row.day}|teacher`;
      if (this.overlapsAny(teacherWindows.get(teacherScope) ?? [], st, en)) {
        out.push(this.translate.instant('timetableOnboarding.warnTeacherTimeOverlap', { day: row.day }));
        break;
      }
      teacherWindows.set(teacherScope, [...(teacherWindows.get(teacherScope) ?? []), { start: st, end: en }]);
      const roomForWindow = row.room?.trim().toLowerCase();
      if (roomForWindow) {
        const roomScope = `${row.day}|${roomForWindow}`;
        if (this.overlapsAny(roomWindows.get(roomScope) ?? [], st, en)) {
          out.push(this.translate.instant('timetableOnboarding.warnRoomTimeOverlap', { day: row.day, room: row.room.trim() }));
          break;
        }
        roomWindows.set(roomScope, [...(roomWindows.get(roomScope) ?? []), { start: st, end: en }]);
      }
    }
    return out;
  }

  private formatValidationIssuePlain(i: TeacherScheduleValidationIssue): string {
    const ct = (i.conflictType ?? '').toUpperCase();
    const code = (i.code ?? '').toUpperCase();
    const day = this.weekdayDisplayFromIssue(i.day);
    const period = i.period != null && i.period > 0 ? i.period : null;
    const periodLabel =
      period != null ? this.translate.instant('timetableOnboarding.issuePeriodLabel', { period }) : '—';
    const roomRaw = (i.room ?? '').trim();
    const room = roomRaw || this.translate.instant('timetableOnboarding.issueRoomUnknown');
    const otherClass = this.formatClassSectionFromIssue(i.classId, i.sectionId);
    const ref =
      i.existingEntryId != null
        ? this.translate.instant('timetableOnboarding.issueRef', { id: i.existingEntryId })
        : '';

    if (ct === 'ROOM_DOUBLE_BOOKED') {
      return (
        this.translate.instant('timetableOnboarding.issueRoomDoubleBooked', {
          day,
          period: period ?? '—',
          room: roomRaw || room,
          otherClass,
        }) + (ref ? ` ${ref}` : '')
      );
    }
    if (ct === 'TEACHER_DOUBLE_BOOKED') {
      return (
        this.translate.instant('timetableOnboarding.issueTeacherDoubleBooked', {
          day,
          period: period ?? '—',
          otherClass,
        }) + (ref ? ` ${ref}` : '')
      );
    }
    if (ct === 'CLASS_PERIOD_OCCUPIED') {
      return (
        this.translate.instant('timetableOnboarding.issueClassPeriodOccupied', {
          day,
          period: period ?? '—',
          otherClass,
        }) + (ref ? ` ${ref}` : '')
      );
    }

    if (code === 'REQUEST_ROOM_DOUBLE_BOOKED') {
      return this.translate.instant('timetableOnboarding.issueRequestRoomDoubleBooked', {
        day,
        period: periodLabel,
        room: roomRaw || room,
      });
    }
    if (code === 'REQUEST_TEACHER_DOUBLE_BOOKED') {
      return this.translate.instant('timetableOnboarding.issueRequestTeacherDoubleBooked', { day, period: periodLabel });
    }
    if (code === 'REQUEST_DUPLICATE_CLASS_SLOT') {
      return this.translate.instant('timetableOnboarding.issueRequestDuplicateSlot', { day, period: periodLabel });
    }

    const where = [day, period != null ? periodLabel : '', otherClass !== '—' ? otherClass : '', roomRaw].filter(Boolean).join(' · ');
    const base = (i.message || i.code || this.translate.instant('timetableOnboarding.issueUnknown')).trim();
    return where ? `${base} (${where})` : base;
  }

  private weekdayDisplayFromIssue(raw?: string): string {
    const d = (raw ?? '').trim().toLowerCase();
    if (!d) {
      return '—';
    }
    const key = `timetable.days.${d}`;
    const tr = this.translate.instant(key);
    return tr !== key ? tr : raw!.charAt(0) + raw!.slice(1).toLowerCase();
  }

  private formatClassSectionFromIssue(classId?: number, sectionId?: number | null): string {
    if (classId == null) {
      return '—';
    }
    const cls = this.classes.find(c => c.id === classId);
    const cname = formatSchoolClassDisplayName(classId, cls?.name?.trim(), this.translate);
    if (!cls?.sections?.length) {
      return cname;
    }
    if (sectionId == null) {
      return cname;
    }
    const sec = cls.sections.find(s => s.id === sectionId);
    return sec ? `${cname} - ${sec.name}` : cname;
  }
}
