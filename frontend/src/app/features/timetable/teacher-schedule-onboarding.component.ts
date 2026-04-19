import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import {
  ApplyTeacherScheduleOnboardingRequest,
  SchoolClass,
  Teacher,
  TimetableEntry,
} from '../../core/models/models';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

type DayApi = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

interface DraftSlot {
  /** Stable client id for *ngFor */
  key: string;
  existingEntryId?: number;
  day: DayApi;
  period: number;
  classId: number | null;
  sectionId: number | null;
  subjectName: string;
  room: string;
}

@Component({
  selector: 'app-teacher-schedule-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ErpI18nPhDirective],
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
    `,
  ],
  template: `
    <div data-testid="teacher-schedule-onboarding" class="animate-in">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 class="timetable-page-title" style="font-size: 24px; font-weight: 800;">{{ 'timetableOnboarding.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'timetableOnboarding.pageLead' | translate }}</p>
        </div>
        <a routerLink="/app/timetable" class="btn-outline-erp btn-sm" style="text-decoration: none;">{{ 'timetableOnboarding.backTimetable' | translate }}</a>
      </div>

      <div class="onb-hero mb-4">
        <p class="mb-2 small" style="color: var(--clr-text-secondary);">{{ 'timetableOnboarding.hero' | translate }}</p>
        <div class="d-flex flex-wrap gap-2">
          <a routerLink="/app/academic" class="btn-outline-erp btn-xs" style="text-decoration: none;">{{ 'timetableOnboarding.linkAcademic' | translate }}</a>
          <a routerLink="/app/timetable" [queryParams]="{ section: 'covers' }" class="btn-outline-erp btn-xs" style="text-decoration: none;">{{ 'timetableOnboarding.linkCovers' | translate }}</a>
        </div>
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
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="erp-label">{{ 'timetable.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="hmClassId" (ngModelChange)="onHmClassChange()">
              <option [ngValue]="null">{{ 'timetable.selectClass' | translate }}</option>
              <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-4" *ngIf="hmClassHasSections">
            <label class="erp-label">{{ 'timetable.labelSection' | translate }}</label>
            <select class="erp-select" [(ngModel)]="hmSectionId">
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
        <div class="table-responsive">
          <table class="erp-table mb-0">
            <thead>
              <tr>
                <th>{{ 'timetable.thDay' | translate }}</th>
                <th>{{ 'timetable.thPeriod' | translate }}</th>
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
                <td style="min-width: 140px;">
                  <select class="erp-select" [(ngModel)]="r.classId" (ngModelChange)="onDraftClassChange(r)">
                    <option [ngValue]="null">{{ 'timetable.selectClass' | translate }}</option>
                    <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
                  </select>
                </td>
                <td style="min-width: 120px;">
                  <select class="erp-select" [(ngModel)]="r.sectionId" [disabled]="!draftSections(r).length">
                    <option [ngValue]="null">{{ 'timetable.sectionWholeClass' | translate }}</option>
                    <option *ngFor="let s of draftSections(r)" [ngValue]="s.id">{{ s.name }}</option>
                  </select>
                </td>
                <td><input type="text" class="erp-input" [(ngModel)]="r.subjectName" erpI18nPh="timetableOnboarding.phSubject" /></td>
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
        <p *ngIf="lastMessage" class="small mt-3 mb-0" style="color: var(--clr-success);">{{ lastMessage | translate: lastMessageParams }}</p>
        <p *ngIf="lastError" class="small mt-3 mb-0" style="color: var(--clr-danger);">{{ lastError }}</p>
      </div>
    </div>
  `,
})
export class TeacherScheduleOnboardingComponent implements OnInit {
  teachers: Teacher[] = [];
  classes: SchoolClass[] = [];
  teacherId: number | null = null;
  hmClassId: number | null = null;
  hmSectionId: number | null = null;
  draftRows: DraftSlot[] = [];
  removedEntryIds: number[] = [];
  anchorMonday = true;
  loading = false;
  saving = false;
  lastMessage = '';
  lastMessageParams: Record<string, string | number> = {};
  lastError = '';

  private readonly translate = inject(TranslateService);

  readonly dayOptions: DayApi[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  constructor(
    private academic: AcademicService,
    private teacherService: TeacherService,
    private timetable: TimetableService
  ) {}

  ngOnInit(): void {
    forkJoin({
      teachers: this.teacherService.getTeachersPage({ page: 0, size: 500 }),
      classes: this.academic.getClasses(),
    }).subscribe({
      next: ({ teachers, classes }) => {
        this.teachers = teachers.content ?? [];
        this.classes = classes;
      },
    });
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
    this.lastMessage = '';
    this.lastError = '';
    this.removedEntryIds = [];
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
      return;
    }
    for (const c of this.classes) {
      if (!c.sections?.length && c.classTeacherId === this.teacherId) {
        this.hmClassId = c.id;
        this.hmSectionId = null;
        return;
      }
      for (const s of c.sections ?? []) {
        if (s.classTeacherId === this.teacherId) {
          this.hmClassId = c.id;
          this.hmSectionId = s.id;
          return;
        }
      }
    }
    this.hmClassId = null;
    this.hmSectionId = null;
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
    return {
      key: `e-${e.id}`,
      existingEntryId: e.id,
      day: this.dayOptions.includes(day) ? day : 'MONDAY',
      period: e.period,
      classId: e.classId,
      sectionId: e.sectionId > 0 ? e.sectionId : null,
      subjectName: e.subjectName,
      room: e.room || '',
    };
  }

  addDraftRow(): void {
    this.draftRows.push({
      key: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      day: 'MONDAY',
      period: 1,
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
    if (!this.teacherId || !this.canSave) {
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
        classId: r.classId!,
        sectionId: r.sectionId,
        subjectName: r.subjectName.trim(),
        room: r.room?.trim() || null,
      })),
      options: { anchorMondayFirstPeriod: this.anchorMonday },
    };

    this.saving = true;
    this.lastError = '';
    this.lastMessage = '';
    this.lastMessageParams = {};
    this.timetable.applyTeacherScheduleOnboarding(body).subscribe({
      next: res => {
        this.saving = false;
        this.removedEntryIds = [];
        this.lastMessageParams = {
          created: res.createdEntryIds?.length ?? 0,
          updated: res.updatedEntryIds?.length ?? 0,
          removed: res.removedEntryIds?.length ?? 0,
        };
        this.lastMessage = 'timetableOnboarding.savedSummary';
        this.reloadFromServer();
      },
      error: err => {
        this.saving = false;
        this.lastError = err?.message || this.translate.instant('timetableOnboarding.saveFailed');
      },
    });
  }
}
