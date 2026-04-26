import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AttendanceService } from '../../core/services/attendance.service';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { filter } from 'rxjs/operators';
import { OperationsService } from '../../core/services/operations.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { SchoolClass, Student, AttendanceRecord } from '../../core/models/models';
import { AttendanceCoverRow } from '../../core/models/operations.models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { mergeClassesForAttendanceCatalog } from '../../core/utils/parent-dashboard-metrics';
import { localIsoDateString } from '../../core/utils/local-date';

@Component({
  selector: 'app-attendance',
  standalone: true,
  styles: [
    `
      @media (max-width: 768px) {
        .attendance-actions-col {
          width: 100%;
        }
      }
      .attendance-actions-col .btn-outline-erp,
      .attendance-actions-col .btn-primary-erp {
        width: 100%;
      }
    `,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ErpDatePickerComponent,
    ErpPaginationComponent,
    TranslateModule,
    ErpI18nPhDirective,
    ErpI18nTextDirective,
  ],
  template: `
    <div data-testid="attendance-page">
      <div class="erp-filter-toolbar mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'attendance.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'attendance.pageLead' | translate }}</p>
        </div>
        <div class="erp-filter-toolbar__actions">
          <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="refreshAttendance()">
            <i class="bi bi-arrow-clockwise"></i> {{ 'attendance.refresh' | translate }}
          </button>
        </div>
      </div>

      <div class="erp-card mb-3 animate-in attendance-teacher-scope" *ngIf="isTeacher && teacherHomeroomHint">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <span class="badge-erp badge-info text-uppercase" style="font-size: 10px;">{{ 'attendance.scopeBadge' | translate }}</span>
          <span class="small mb-0" style="font-weight: 600; color: var(--clr-text);">{{ teacherHomeroomHint }}</span>
        </div>
        <p class="text-muted small mb-0 mt-1">{{ 'attendance.scopeLead' | translate }}</p>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="erp-label">{{ 'attendance.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()" data-testid="attendance-class-select">
              <option [ngValue]="null">{{ 'attendance.selectClass' | translate }}</option>
              <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">{{ 'attendance.labelSection' | translate }}</label>
            <select
              class="erp-select"
              [(ngModel)]="selectedSectionId"
              (change)="onSectionChange()"
              data-testid="attendance-section-select"
              [disabled]="sectionSelectDisabled"
            >
              <option [ngValue]="null">{{ 'attendance.selectSection' | translate }}</option>
              <option *ngFor="let sec of sections" [ngValue]="sec.id">
                {{ sec.id === 0 ? ('attendance.wholeClass' | translate) : sec.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">{{ 'attendance.labelDate' | translate }}</label>
            <app-erp-date-picker
              [(ngModel)]="selectedDate"
              (ngModelChange)="onDateChange()"
              dataTestId="attendance-date"
              placeholderI18nKey="attendance.datePlaceholder"
            />
          </div>
          <div class="col-md-3 d-flex flex-column gap-2 attendance-actions-col">
            <button
              *ngIf="adminPastAuditView && !adminPastEditing"
              type="button"
              class="btn-outline-erp"
              [disabled]="!records.length"
              (click)="adminPastEditing = true"
              data-testid="edit-past-attendance-btn"
            >
              {{ 'attendance.editPast' | translate }}
            </button>
            <button
              class="btn-primary-erp"
              (click)="saveAttendance()"
              [disabled]="!records.length || saving || saveDisabled"
              data-testid="save-attendance-btn"
            >
              <span class="spinner" *ngIf="saving"></span>
              <ng-container *ngIf="saving">{{ 'attendance.saveSaving' | translate }}</ng-container>
              <ng-container *ngIf="!saving">{{ attendanceSaveLabelKey | translate }}</ng-container>
            </button>
          </div>
        </div>
        <div *ngIf="teacherPastLocked" class="alert alert-info py-2 px-3 small mb-0 mt-3" style="border-radius: var(--radius-md);">
          <i class="bi bi-info-circle me-1"></i>
          {{ 'attendance.alertTeacherPast' | translate }}
        </div>
        <div *ngIf="adminPastAuditView && !adminPastEditing" class="alert alert-info py-2 px-3 small mb-0 mt-3" style="border-radius: var(--radius-md);">
          <i class="bi bi-info-circle me-1"></i>
          {{ 'attendance.alertAdminPastBefore' | translate }}<strong>{{ 'attendance.editPast' | translate }}</strong
          >{{ 'attendance.alertAdminPastAfter' | translate }}
        </div>
        <div *ngIf="saveError" class="alert alert-danger py-2 small mb-0 mt-2">{{ saveError }}</div>
        <p *ngIf="isAdmin && !adminPastAuditView" class="text-muted small mb-0 mt-3" style="line-height: 1.5;">
          <i class="bi bi-shield-check me-1"></i>
          {{ 'attendance.hintAdminConfirm' | translate }}
        </p>
      </div>

      <div class="erp-card animate-in animate-in-delay-2" *ngIf="records.length > 0">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h4 class="erp-card-title mb-0">{{ 'attendance.markTitle' | translate: { count: records.length } }}</h4>
          <div class="d-flex gap-3" style="font-size: 13px;">
            <span style="color: var(--clr-success);"
              ><i class="bi bi-check-circle-fill me-1"></i> {{ 'attendance.countPresent' | translate: { count: countByStatus('present') } }}</span
            >
            <span style="color: var(--clr-danger);"
              ><i class="bi bi-x-circle-fill me-1"></i> {{ 'attendance.countAbsent' | translate: { count: countByStatus('absent') } }}</span
            >
            <span style="color: var(--clr-warning);"
              ><i class="bi bi-clock-fill me-1"></i> {{ 'attendance.countLate' | translate: { count: countByStatus('late') } }}</span
            >
          </div>
        </div>
        <div class="erp-filter-toolbar mb-3">
          <div class="erp-filter-toolbar__search">
            <div>
              <label class="erp-label small mb-1" erpI18nText="attendance.searchStudent"></label>
              <input
                type="search"
                class="erp-input"
                erpI18nPh="attendance.searchStudentPh"
                [(ngModel)]="attStudentSearch"
                (ngModelChange)="onAttSearchChange()"
              />
            </div>
          </div>
        </div>
        <p *ngIf="records.length && !attFilteredTotal" class="text-muted small mb-2">{{ 'attendance.noSearchMatches' | translate }}</p>
        <div class="erp-table-scroll" *ngIf="attFilteredTotal > 0">
        <table class="erp-table">
          <thead>
            <tr>
              <th>{{ 'attendance.thNum' | translate }}</th>
              <th>{{ 'attendance.thStudent' | translate }}</th>
              <th>{{ 'attendance.thStatus' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rec of attPagedRecords; let i = index" [attr.data-testid]="'attendance-row-' + rec.studentId">
              <td>{{ attPageIndex * attPageSize + i + 1 }}</td>
              <td><strong>{{ rec.studentName }}</strong></td>
              <td>
                <div class="d-flex gap-2" [class.opacity-50]="cellsLocked" [style.pointer-events]="cellsLocked ? 'none' : 'auto'">
                  <div class="attendance-cell" [class.present]="rec.status === 'present'" (click)="rec.status = 'present'" [title]="'attendance.titlePresent' | translate">
                    <i class="bi bi-check-lg"></i>
                  </div>
                  <div class="attendance-cell" [class.absent]="rec.status === 'absent'" (click)="rec.status = 'absent'" [title]="'attendance.titleAbsent' | translate">
                    <i class="bi bi-x-lg"></i>
                  </div>
                  <div class="attendance-cell" [class.late]="rec.status === 'late'" (click)="rec.status = 'late'" [title]="'attendance.titleLate' | translate">
                    <i class="bi bi-clock"></i>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <app-erp-pagination
          *ngIf="attFilteredTotal > attPageSize"
          [totalElements]="attFilteredTotal"
          [pageIndex]="attPageIndex"
          [pageSize]="attPageSize"
          (pageIndexChange)="onAttPageIndexChange($event)"
          (pageSizeChange)="onAttPageSizeChange($event)"
        />
      </div>

      <div *ngIf="!records.length && selectedClassId != null" class="erp-card animate-in">
        <div class="empty-state">
          <i class="bi bi-calendar-check"></i>
          <h3>{{ 'attendance.emptyTitle' | translate }}</h3>
          <p>{{ 'attendance.emptyLead' | translate }}</p>
        </div>
      </div>
    </div>
  `,
})
export class AttendanceComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly uiAccess = inject(UiAccessService);

  classes: SchoolClass[] = [];
  sections: { id: number; name: string }[] = [];
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;
  selectedDate = localIsoDateString();
  records: AttendanceRecord[] = [];
  attStudentSearch = '';
  attPageIndex = 0;
  attPageSize = DEFAULT_ERP_PAGE_SIZE;
  attPagedRecords: AttendanceRecord[] = [];
  attFilteredTotal = 0;
  saving = false;
  saveError = '';
  /** Active covers for the selected date (not listed in UI; used for substitute save confirmation). */
  myCovers: AttendanceCoverRow[] = [];
  /** True when API returned a mark for every student in the selected roster (session considered final for teachers). */
  attendanceSessionComplete = false;
  /** Avoid re-applying homeroom defaults on every refresh. */
  private homeroomScopeApplied = false;

  get isAdmin(): boolean {
    return this.uiAccess.hasAcademicDeskAdminAccess();
  }

  get isTeacher(): boolean {
    return this.auth.getNormalizedRole() === 'teacher';
  }

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private academicService: AcademicService,
    private teacherService: TeacherService,
    private auth: AuthService,
    private operationsService: OperationsService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  private showAttendanceValidation(message: string): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('attendance.pageTitle'),
        message,
        variant: 'warning',
        confirmLabel: this.translate.instant('attendance.confirm.cancel'),
        cancelLabel: '',
      })
      .subscribe();
  }

  private validateAttendanceRecordConsistency(): string | null {
    if (!this.records.length) {
      return this.translate.instant('attendance.emptyLead');
    }
    const first = this.records[0];
    const classId = Number(first.classId);
    const sectionId = Number(first.sectionId);
    const date = String(first.date || '');
    if (!classId || !date) {
      return this.translate.instant('attendance.errors.saveFailed');
    }
    const seenStudentIds = new Set<number>();
    for (const row of this.records) {
      const studentId = Number(row.studentId);
      if (!studentId || seenStudentIds.has(studentId)) {
        return this.translate.instant('attendance.errors.saveFailed');
      }
      seenStudentIds.add(studentId);
      if (Number(row.classId) !== classId || Number(row.sectionId) !== sectionId || String(row.date || '') !== date) {
        return this.translate.instant('attendance.errors.saveFailed');
      }
    }
    return null;
  }

  private linkedTeacherId: number | null = null;
  teacherRosterResolved = false;
  adminPastEditing = false;

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const qd = this.route.snapshot.queryParamMap.get('date');
      if (qd && /^\d{4}-\d{2}-\d{2}$/.test(qd)) {
        this.selectedDate = qd;
      }
      if (this.isTeacher) {
        this.homeroomScopeApplied = false;
        this.maybeApplyTeacherHomeroomScope();
      }
      this.cdr.markForCheck();
    });

    this.loadClassesMerged();
    if (this.isTeacher || this.isAdmin) {
      const me = this.auth.getCurrentUser();
      this.teacherService.getTeachers().subscribe({
        next: list => {
          const row = (list || []).find(t => t.userId === me?.id);
          this.linkedTeacherId = row?.id ?? null;
          this.teacherRosterResolved = true;
          this.maybeApplyTeacherHomeroomScope();
        },
        error: () => {
          this.teacherRosterResolved = true;
          this.maybeApplyTeacherHomeroomScope();
        },
      });
    } else {
      this.teacherRosterResolved = true;
    }
    if (this.isTeacher) {
      this.loadMyCovers();
    }
    this.operationsService.attendanceCoverMutations$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(mutation => {
      if (!this.selectedDate || mutation.coverDate !== this.selectedDate) {
        return;
      }
      if (this.isTeacher) {
        this.loadMyCovers();
      }
      if (this.selectedClassId != null) {
        this.loadAttendance();
      }
    });
  }

  /** Short label for homeroom scope banner (e.g. "Class 8 · Section A"). */
  get teacherHomeroomHint(): string {
    if (!this.isTeacher || this.linkedTeacherId == null || this.selectedClassId == null) {
      return '';
    }
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) {
      return '';
    }
    if (!cls.sections?.length) {
      return this.translate.instant('attendance.scopeHomeroomLine', { class: cls.name, section: '—' });
    }
    const sec = cls.sections.find(s => s.id === this.selectedSectionId);
    const sn = sec?.name?.trim() || '—';
    return this.translate.instant('attendance.scopeHomeroomLine', { class: cls.name, section: sn });
  }

  /** i18n key for primary save button label (non-saving state). */
  get attendanceSaveLabelKey(): string {
    if (this.teacherPastLocked) {
      return 'attendance.saveViewOnly';
    }
    if (this.isTeacher && this.attendanceSessionComplete && this.records.length > 0) {
      return 'attendance.saveAlreadyMarked';
    }
    if (this.adminPastAuditView && !this.adminPastEditing) {
      return 'attendance.saveViewOnly';
    }
    if (this.saveDisabled && this.records.length > 0) {
      return 'attendance.saveViewOnly';
    }
    return 'attendance.saveCta';
  }

  /**
   * Preselect class/section for class teachers (or from ?classId=&sectionId=) so they land on their roster.
   */
  private maybeApplyTeacherHomeroomScope(): void {
    if (!this.isTeacher || !this.teacherRosterResolved || this.homeroomScopeApplied || !this.classes.length) {
      return;
    }
    const q = this.route.snapshot.queryParamMap;
    const qc = q.get('classId');
    const qs = q.get('sectionId');
    if (qc && /^\d+$/.test(qc)) {
      const cid = Number(qc);
      const cls = this.classes.find(c => c.id === cid);
      if (cls) {
        this.selectedClassId = cid;
        if (cls.sections.length === 0) {
          this.sections = [{ id: 0, name: 'Whole class' }];
          this.selectedSectionId = 0;
        } else {
          this.sections = cls.sections.map(s => ({ id: s.id, name: s.name }));
          if (qs && /^\d+$/.test(qs)) {
            const sid = Number(qs);
            this.selectedSectionId = cls.sections.some(s => s.id === sid) ? sid : cls.sections[0].id;
          } else {
            this.selectedSectionId = cls.sections[0].id;
          }
        }
        this.homeroomScopeApplied = true;
        this.loadAttendance();
        return;
      }
    }
    if (this.linkedTeacherId == null) {
      this.homeroomScopeApplied = true;
      return;
    }
    const fromCatalog = this.findHomeroomClassSectionForTeacher(this.linkedTeacherId);
    const fromProfile = this.auth.getProfileSummarySnapshot()?.classTeacherOf?.[0];
    const hm =
      fromCatalog ??
      (fromProfile?.classId != null
        ? {
            classId: fromProfile.classId,
            sectionId: fromProfile.sectionId != null ? fromProfile.sectionId : null,
          }
        : null);
    if (!hm) {
      this.homeroomScopeApplied = true;
      return;
    }
    const cls = this.classes.find(c => c.id === hm.classId);
    if (!cls) {
      this.homeroomScopeApplied = true;
      return;
    }
    this.selectedClassId = cls.id;
    if (cls.sections.length === 0) {
      this.sections = [{ id: 0, name: 'Whole class' }];
      this.selectedSectionId = 0;
    } else {
      this.sections = cls.sections.map(s => ({ id: s.id, name: s.name }));
      const want = hm.sectionId != null ? cls.sections.find(s => s.id === hm.sectionId) : undefined;
      this.selectedSectionId = want?.id ?? cls.sections[0].id;
    }
    this.homeroomScopeApplied = true;
    this.loadAttendance();
  }

  /** Resolves homeroom from section-level (or whole-class) class teacher — not {@link SchoolClass.classTeacherId} alone. */
  private findHomeroomClassSectionForTeacher(teacherRecordId: number): { classId: number; sectionId: number | null } | null {
    for (const c of this.classes) {
      if (!c.sections?.length) {
        if (c.classTeacherId === teacherRecordId) {
          return { classId: c.id, sectionId: null };
        }
      } else {
        for (const s of c.sections) {
          if (s.classTeacherId === teacherRecordId) {
            return { classId: c.id, sectionId: s.id };
          }
        }
      }
    }
    return null;
  }

  onDateChange(): void {
    this.adminPastEditing = false;
    if (this.isTeacher) {
      this.loadMyCovers();
    }
    this.loadAttendance();
  }

  private loadMyCovers(): void {
    this.operationsService.listAttendanceCovers(this.selectedDate).subscribe({
      next: list => (this.myCovers = (list || []).filter(c => c.status === 'ACTIVE')),
      error: () => (this.myCovers = []),
    });
  }

  refreshAttendance(): void {
    this.loadClassesMerged();
    if (this.isTeacher) {
      this.loadMyCovers();
    }
    this.loadAttendance();
  }

  /**
   * Ensures every class/section that has enrolled students appears in the picker (parent and admin stay aligned).
   */
  private loadClassesMerged(): void {
    this.academicService.getClasses().subscribe(c => {
      if (this.isAdmin || this.isTeacher) {
        this.studentService.getStudents().subscribe({
          next: students => {
            this.classes = mergeClassesForAttendanceCatalog(c, students || []);
            this.cdr.markForCheck();
            this.maybeApplyTeacherHomeroomScope();
          },
          error: () => {
            this.classes = c;
            this.cdr.markForCheck();
            this.maybeApplyTeacherHomeroomScope();
          },
        });
      } else {
        this.classes = c;
      }
    });
  }

  get isPastSession(): boolean {
    return this.isPastDate(this.selectedDate);
  }

  get teacherPastLocked(): boolean {
    return this.isTeacher && this.isPastSession;
  }

  get adminPastAuditView(): boolean {
    return this.isAdmin && this.isPastSession;
  }

  get cellsLocked(): boolean {
    if (this.teacherPastLocked) return true;
    if (this.adminPastAuditView && !this.adminPastEditing) return true;
    if (this.isTeacher && this.attendanceSessionComplete) return true;
    return false;
  }

  get saveDisabled(): boolean {
    if (this.teacherPastLocked) return true;
    if (this.adminPastAuditView && !this.adminPastEditing) return true;
    if (this.isTeacher && this.attendanceSessionComplete) return true;
    return false;
  }

  get sectionSelectDisabled(): boolean {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    return !cls || cls.sections.length === 0;
  }

  private isPastDate(isoDate: string): boolean {
    const d = new Date(isoDate + 'T12:00:00');
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < t.getTime();
  }

  onSectionChange(): void {
    this.adminPastEditing = false;
    this.loadAttendance();
  }

  onClassChange(): void {
    this.adminPastEditing = false;
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) {
      this.sections = [];
      this.selectedSectionId = null;
      this.records = [];
      this.rebuildAttendancePaging();
      return;
    }
    if (cls.sections.length === 0) {
      this.sections = [{ id: 0, name: 'Whole class' }];
      this.selectedSectionId = 0;
    } else {
      this.sections = cls.sections.map(s => ({ id: s.id, name: s.name }));
      this.selectedSectionId = null;
    }
    this.records = [];
    this.loadAttendance();
  }

  private filterAttendanceForDisplay(): AttendanceRecord[] {
    const q = this.attStudentSearch.trim().toLowerCase();
    if (!q) {
      return this.records;
    }
    return this.records.filter(r => r.studentName.toLowerCase().includes(q));
  }

  rebuildAttendancePaging(): void {
    const filtered = this.filterAttendanceForDisplay();
    const pg = sliceToPage(filtered, this.attPageIndex, this.attPageSize);
    this.attPagedRecords = pg.content;
    this.attPageIndex = pg.page;
    this.attFilteredTotal = pg.totalElements;
  }

  onAttSearchChange(): void {
    this.attPageIndex = 0;
    this.rebuildAttendancePaging();
  }

  onAttPageIndexChange(i: number): void {
    this.attPageIndex = i;
    this.rebuildAttendancePaging();
  }

  onAttPageSizeChange(s: number): void {
    this.attPageSize = s;
    this.attPageIndex = 0;
    this.rebuildAttendancePaging();
  }

  loadAttendance(): void {
    if (this.selectedClassId == null) {
      this.attendanceSessionComplete = false;
      return;
    }
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) {
      this.attendanceSessionComplete = false;
      return;
    }
    const sectionId =
      cls.sections.length === 0
        ? 0
        : this.selectedSectionId != null && this.selectedSectionId !== 0
          ? this.selectedSectionId
          : null;
    if (sectionId == null) {
      this.attendanceSessionComplete = false;
      return;
    }
    const classId = this.selectedClassId;
    this.studentService.getStudentsByClassAndSection(classId, sectionId).subscribe(sectionStudents => {
      this.attendanceService.getAttendanceByClassAndDate(classId, sectionId, this.selectedDate).subscribe(existing => {
        const me = this.auth.getCurrentUser();
        const markedBy = me?.id ?? 0;
        const rosterIds = new Set(sectionStudents.map(s => s.id));
        const covered = (existing || []).filter(e => rosterIds.has(e.studentId)).length;
        this.attendanceSessionComplete = sectionStudents.length > 0 && covered === sectionStudents.length;
        this.records = sectionStudents.map(s => {
          const ex = existing.find(e => e.studentId === s.id);
          return (
            ex || {
              id: 800_000 + s.id,
              studentId: s.id,
              studentName: s.firstName + ' ' + s.lastName,
              classId,
              sectionId,
              date: this.selectedDate,
              status: 'present' as const,
              markedBy,
              tenantId: 't1',
            }
          );
        });
        this.attPageIndex = 0;
        this.rebuildAttendancePaging();
      });
    });
  }

  private isClassTeacherForCurrentClass(): boolean {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (cls == null || this.linkedTeacherId == null) {
      return false;
    }
    const secId =
      this.selectedSectionId != null && this.selectedSectionId !== 0 ? this.selectedSectionId : null;
    if (secId != null) {
      const sec = cls.sections?.find(s => s.id === secId);
      if (sec?.classTeacherId != null) {
        return sec.classTeacherId === this.linkedTeacherId;
      }
    }
    if (!cls.sections?.length) {
      return cls.classTeacherId === this.linkedTeacherId;
    }
    return false;
  }

  private hasActiveCoverForSelection(): boolean {
    if (this.linkedTeacherId == null || this.selectedClassId == null) {
      return false;
    }
    const sec = this.effectiveSectionIdForCover();
    if (sec == null) return false;
    return this.myCovers.some(c => {
      if (c.coverDate !== this.selectedDate) {
        return false;
      }
      if (c.classId !== this.selectedClassId) {
        return false;
      }
      if (c.coveringTeacherId !== this.linkedTeacherId) {
        return false;
      }
      if (c.sectionId == null) {
        return true;
      }
      return c.sectionId === sec;
    });
  }

  effectiveSectionIdForCover(): number | null {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) return null;
    if (cls.sections.length === 0) return 0;
    return this.selectedSectionId != null && this.selectedSectionId !== 0 ? this.selectedSectionId : null;
  }

  /** Human-readable section label (e.g. "A") for confirmations — never raw database ids. */
  private selectedSectionDisplayName(cls: SchoolClass | undefined): string {
    if (!cls?.sections?.length) {
      return this.translate.instant('attendance.wholeClass');
    }
    const sid = this.selectedSectionId != null && this.selectedSectionId !== 0 ? this.selectedSectionId : null;
    if (sid == null) {
      return '';
    }
    return cls.sections.find(s => s.id === sid)?.name?.trim() || '';
  }

  /** Homeroom teacher name for the current class/section (for admin copy). */
  private homeroomTeacherDisplayName(cls: SchoolClass | undefined): string {
    if (!cls) {
      return this.translate.instant('attendance.confirm.notAssigned');
    }
    const sid = this.selectedSectionId != null && this.selectedSectionId !== 0 ? this.selectedSectionId : null;
    if (sid != null) {
      const sec = cls.sections?.find(s => s.id === sid);
      const n = sec?.classTeacherName?.trim();
      if (n) {
        return n;
      }
    }
    return cls.classTeacherName?.trim() || this.translate.instant('attendance.confirm.notAssigned');
  }

  private buildAttendanceConfirmDetails(cls: SchoolClass | undefined): string[] {
    const lines: string[] = [
      this.translate.instant('attendance.confirmDetail.date', { date: this.selectedDate }),
      cls ? this.translate.instant('attendance.confirmDetail.class', { name: cls.name }) : '',
    ];
    const secName = this.selectedSectionDisplayName(cls);
    if (secName) {
      lines.push(this.translate.instant('attendance.confirmDetail.sectionNamed', { name: secName }));
    }
    lines.push(
      this.translate.instant(
        this.attendanceSessionComplete
          ? 'attendance.confirmDetail.statusComplete'
          : 'attendance.confirmDetail.statusIncomplete'
      )
    );
    return lines.filter((x): x is string => !!x);
  }

  saveAttendance(): void {
    if (this.saveDisabled || this.saving) return;
    if (this.selectedClassId == null) {
      this.showAttendanceValidation(this.translate.instant('attendance.selectClass'));
      return;
    }
    if (this.sectionSelectDisabled ? false : this.selectedSectionId == null) {
      this.showAttendanceValidation(this.translate.instant('attendance.selectSection'));
      return;
    }
    const invalidStatus = this.records.some(r => !['present', 'absent', 'late'].includes(String(r.status)));
    if (invalidStatus) {
      this.showAttendanceValidation(this.translate.instant('attendance.errors.saveFailed'));
      return;
    }
    const consistencyError = this.validateAttendanceRecordConsistency();
    if (consistencyError) {
      this.showAttendanceValidation(consistencyError);
      return;
    }
    const role = this.auth.getNormalizedRole();
    if (!this.isTeacher && !this.isAdmin) {
      this.saveError = this.translate.instant('attendance.errors.roleDenied');
      return;
    }
    if (role === 'teacher') {
      if (!this.teacherRosterResolved) {
        this.saveError = this.translate.instant('attendance.errors.teacherProfileLoading');
        return;
      }
      if (!this.isClassTeacherForCurrentClass()) {
        const covering = this.hasActiveCoverForSelection();
        const cls = this.classes.find(c => c.id === this.selectedClassId);
        this.confirmDialog
          .confirm({
            title: covering
              ? this.translate.instant('attendance.confirm.teacherSubstituteTitle')
              : this.translate.instant('attendance.confirm.notHomeroomTitle'),
            message: covering
              ? this.translate.instant('attendance.confirm.teacherSubstituteMessage')
              : this.linkedTeacherId
                ? this.translate.instant('attendance.confirm.notHomeroomMessageLinked')
                : this.translate.instant('attendance.confirm.notHomeroomMessageUnlinked'),
            details: this.buildAttendanceConfirmDetails(cls),
            variant: 'warning',
            confirmLabel: this.translate.instant('attendance.confirm.confirmSubmit'),
            cancelLabel: this.translate.instant('attendance.confirm.goBack'),
          })
          .pipe(filter(Boolean))
          .subscribe(() => this.maybeConfirmAlreadyMarkedThenFinish());
        return;
      }
    }
    if (this.isAdmin) {
      if (!this.teacherRosterResolved) {
        this.saveError = this.translate.instant('attendance.errors.adminDirectoryLoading');
        return;
      }
      this.saveError = '';
      const cls = this.classes.find(c => c.id === this.selectedClassId);
      const homeroom = this.homeroomTeacherDisplayName(cls);
      const asHomeroom = this.isClassTeacherForCurrentClass();
      this.confirmDialog
        .confirm({
          title: this.translate.instant('attendance.confirm.adminTitle'),
          message: asHomeroom
            ? this.translate.instant('attendance.confirm.adminMessageHomeroom', { name: homeroom })
            : this.translate.instant('attendance.confirm.adminMessageNotHomeroom', { name: homeroom }),
          details: this.buildAttendanceConfirmDetails(cls),
          variant: 'warning',
          confirmLabel: this.translate.instant('attendance.confirm.confirmSubmit'),
          cancelLabel: this.translate.instant('attendance.confirm.goBack'),
        })
        .pipe(filter(Boolean))
        .subscribe(() => this.maybeConfirmAlreadyMarkedThenFinish());
      return;
    }
    this.finishSaveAfterGuards();
  }

  /**
   * When every student already has a saved row for this date, ask once more before overwriting (admins / delegated teachers).
   */
  private maybeConfirmAlreadyMarkedThenFinish(): void {
    if (!this.attendanceSessionComplete || !this.records.length) {
      this.finishSaveAfterGuards();
      return;
    }
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    this.confirmDialog
      .confirm({
        title: this.translate.instant('attendance.confirm.alreadyMarkedTitle'),
        message: this.translate.instant('attendance.confirm.alreadyMarkedMessage'),
        details: this.buildAttendanceConfirmDetails(cls),
        variant: 'warning',
        confirmLabel: this.translate.instant('attendance.confirm.alreadyMarkedConfirm'),
        cancelLabel: this.translate.instant('attendance.confirm.goBack'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.finishSaveAfterGuards());
  }

  private finishSaveAfterGuards(): void {
    if (this.adminPastAuditView && this.adminPastEditing) {
      const cls = this.classes.find(c => c.id === this.selectedClassId);
      this.confirmDialog
        .confirm({
          title: this.translate.instant('attendance.confirm.pastTitle'),
          message: this.translate.instant('attendance.confirm.pastMessage'),
          details: [
            ...this.buildAttendanceConfirmDetails(cls),
            this.translate.instant('attendance.confirmDetail.rows', { count: this.records.length }),
          ],
          variant: 'warning',
          confirmLabel: this.translate.instant('attendance.confirm.pastSave'),
          cancelLabel: this.translate.instant('attendance.confirm.cancel'),
        })
        .pipe(filter(Boolean))
        .subscribe(() => this.persistAttendance());
      return;
    }
    this.persistAttendance();
  }

  private persistAttendance(): void {
    this.saveError = '';
    this.saving = true;
    this.attendanceService.saveAttendance(this.records).subscribe({
      next: () => {
        this.saving = false;
        this.loadAttendance();
        this.auth.fetchProfileSummary().subscribe({ error: () => void 0 });
        if (this.isTeacher && !this.isClassTeacherForCurrentClass() && this.records.length && this.selectedClassId != null) {
          const me = this.auth.getCurrentUser();
          const sec = this.records[0]?.sectionId ?? 0;
          this.operationsService
            .recordAttendanceProxyAudit({
              actorUserId: me?.id ?? 0,
              actorName: me?.name,
              classId: this.selectedClassId,
              sectionId: sec,
              sessionDate: this.selectedDate,
              studentCount: this.records.length,
              context: this.hasActiveCoverForSelection() ? 'SUBSTITUTE_COVER' : 'PROXY_MARK',
            })
            .subscribe({ error: () => void 0 });
        }
      },
      error: (e: Error) => {
        this.saving = false;
        this.saveError = e?.message || this.translate.instant('attendance.errors.saveFailed');
      },
    });
  }

  countByStatus(status: string): number {
    return this.records.filter(r => r.status === status).length;
  }
}

