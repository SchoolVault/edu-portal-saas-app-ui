import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttendanceService } from '../../core/services/attendance.service';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
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

@Component({
  selector: 'app-attendance',
  standalone: true,
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
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'attendance.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'attendance.pageLead' | translate }}</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAttendance()">
          <i class="bi bi-arrow-clockwise"></i> {{ 'attendance.refresh' | translate }}
        </button>
      </div>

      <div class="erp-card mb-3 animate-in" *ngIf="isTeacher && myCovers.length > 0">
        <h4 class="erp-card-title mb-2" style="font-size: 15px;">
          {{ 'attendance.coverAssignmentsTitle' | translate: { date: selectedDate } }}
        </h4>
        <p class="text-muted small mb-2">{{ 'attendance.coverAssignmentsLead' | translate }}</p>
        <ul class="mb-0 ps-3 small">
          <li *ngFor="let c of myCovers">
            {{ 'attendance.coverClassId' | translate: { classId: c.classId } }}
            <span *ngIf="c.sectionId"> — {{ 'attendance.coverSection' | translate: { sectionId: c.sectionId } }}</span>
            <span *ngIf="c.reason">({{ c.reason }})</span>
          </li>
        </ul>
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
          <div class="col-md-3 d-flex flex-column gap-2">
            <button
              *ngIf="adminPastAuditView && !adminPastEditing"
              type="button"
              class="btn-outline-erp"
              style="width: 100%;"
              [disabled]="!records.length"
              (click)="adminPastEditing = true"
              data-testid="edit-past-attendance-btn"
            >
              {{ 'attendance.editPast' | translate }}
            </button>
            <button
              class="btn-primary-erp"
              style="width: 100%;"
              (click)="saveAttendance()"
              [disabled]="!records.length || saving || saveDisabled"
              data-testid="save-attendance-btn"
            >
              <span class="spinner" *ngIf="saving"></span>
              <ng-container *ngIf="saving">{{ 'attendance.saveSaving' | translate }}</ng-container>
              <ng-container *ngIf="!saving && saveDisabled">{{ 'attendance.saveViewOnly' | translate }}</ng-container>
              <ng-container *ngIf="!saving && !saveDisabled">{{ 'attendance.saveCta' | translate }}</ng-container>
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
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-6 col-lg-4">
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
        <p *ngIf="records.length && !attFilteredTotal" class="text-muted small mb-2">{{ 'attendance.noSearchMatches' | translate }}</p>
        <table class="erp-table" *ngIf="attFilteredTotal > 0">
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

  classes: SchoolClass[] = [];
  sections: { id: number; name: string }[] = [];
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;
  selectedDate = new Date().toISOString().split('T')[0];
  records: AttendanceRecord[] = [];
  attStudentSearch = '';
  attPageIndex = 0;
  attPageSize = DEFAULT_ERP_PAGE_SIZE;
  attPagedRecords: AttendanceRecord[] = [];
  attFilteredTotal = 0;
  saving = false;
  saveError = '';
  myCovers: AttendanceCoverRow[] = [];

  get isAdmin(): boolean {
    const r = this.auth.getNormalizedRole();
    return r === 'admin' || r === 'super_admin';
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
    private cdr: ChangeDetectorRef
  ) {}

  private linkedTeacherId: number | null = null;
  teacherRosterResolved = false;
  adminPastEditing = false;

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    this.loadClassesMerged();
    if (this.isTeacher || this.isAdmin) {
      const me = this.auth.getCurrentUser();
      this.teacherService.getTeachers().subscribe({
        next: list => {
          const row = (list || []).find(t => t.userId === me?.id);
          this.linkedTeacherId = row?.id ?? null;
          this.teacherRosterResolved = true;
        },
        error: () => {
          this.teacherRosterResolved = true;
        },
      });
    } else {
      this.teacherRosterResolved = true;
    }
    if (this.isTeacher) {
      this.loadMyCovers();
    }
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
          },
          error: () => {
            this.classes = c;
            this.cdr.markForCheck();
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
    return false;
  }

  get saveDisabled(): boolean {
    return this.teacherPastLocked || (this.adminPastAuditView && !this.adminPastEditing);
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
    if (this.selectedClassId == null) return;
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) return;
    const sectionId =
      cls.sections.length === 0
        ? 0
        : this.selectedSectionId != null && this.selectedSectionId !== 0
          ? this.selectedSectionId
          : null;
    if (sectionId == null) return;
    const classId = this.selectedClassId;
    this.studentService.getStudentsByClassAndSection(classId, sectionId).subscribe(sectionStudents => {
      this.attendanceService.getAttendanceByClassAndDate(classId, sectionId, this.selectedDate).subscribe(existing => {
        const me = this.auth.getCurrentUser();
        const markedBy = me?.id ?? 0;
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
    if (cls?.classTeacherId == null || this.linkedTeacherId == null) {
      return false;
    }
    return cls.classTeacherId === this.linkedTeacherId;
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

  private confirmDetailLines(cls: SchoolClass | undefined, useSectionWord: boolean): string[] {
    const sid = this.effectiveSectionIdForCover();
    return [
      this.translate.instant('attendance.confirmDetail.date', { date: this.selectedDate }),
      cls ? this.translate.instant('attendance.confirmDetail.class', { name: cls.name }) : '',
      sid != null
        ? this.translate.instant(useSectionWord ? 'attendance.confirmDetail.section' : 'attendance.confirmDetail.sectionId', {
            id: sid,
          })
        : '',
    ].filter((x): x is string => !!x);
  }

  saveAttendance(): void {
    if (this.saveDisabled || this.saving) return;
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
            details: this.confirmDetailLines(cls, false),
            variant: 'warning',
            confirmLabel: this.translate.instant('attendance.confirm.confirmSubmit'),
            cancelLabel: this.translate.instant('attendance.confirm.goBack'),
          })
          .pipe(filter(Boolean))
          .subscribe(() => this.finishSaveAfterGuards());
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
      const homeroom = cls?.classTeacherName?.trim() || this.translate.instant('attendance.confirm.notAssigned');
      const asHomeroom = this.isClassTeacherForCurrentClass();
      this.confirmDialog
        .confirm({
          title: this.translate.instant('attendance.confirm.adminTitle'),
          message: asHomeroom
            ? this.translate.instant('attendance.confirm.adminMessageHomeroom', { name: homeroom })
            : this.translate.instant('attendance.confirm.adminMessageNotHomeroom', { name: homeroom }),
          details: this.confirmDetailLines(cls, false),
          variant: 'warning',
          confirmLabel: this.translate.instant('attendance.confirm.confirmSubmit'),
          cancelLabel: this.translate.instant('attendance.confirm.goBack'),
        })
        .pipe(filter(Boolean))
        .subscribe(() => this.finishSaveAfterGuards());
      return;
    }
    this.finishSaveAfterGuards();
  }

  private finishSaveAfterGuards(): void {
    if (this.adminPastAuditView && this.adminPastEditing) {
      const cls = this.classes.find(c => c.id === this.selectedClassId);
      this.confirmDialog
        .confirm({
          title: this.translate.instant('attendance.confirm.pastTitle'),
          message: this.translate.instant('attendance.confirm.pastMessage'),
          details: [
            ...this.confirmDetailLines(cls, true),
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

