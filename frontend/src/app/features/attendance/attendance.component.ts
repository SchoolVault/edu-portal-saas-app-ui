import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent],
  template: `
    <div data-testid="attendance-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Attendance</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Mark and manage daily attendance</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAttendance()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>

      <div class="erp-card mb-3 animate-in" *ngIf="isTeacher && myCovers.length > 0">
        <h4 class="erp-card-title mb-2" style="font-size: 15px;">Your cover assignments ({{ selectedDate }})</h4>
        <p class="text-muted small mb-2">You may mark attendance for these classes when covering for colleagues.</p>
        <ul class="mb-0 ps-3 small">
          <li *ngFor="let c of myCovers">Class ID {{ c.classId }}<span *ngIf="c.sectionId"> — section {{ c.sectionId }}</span> <span *ngIf="c.reason">({{ c.reason }})</span></li>
        </ul>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()" data-testid="attendance-class-select">
              <option [ngValue]="null">Select Class</option>
              <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">Section</label>
            <select
              class="erp-select"
              [(ngModel)]="selectedSectionId"
              (change)="onSectionChange()"
              data-testid="attendance-section-select"
              [disabled]="sectionSelectDisabled"
            >
              <option [ngValue]="null">Select Section</option>
              <option *ngFor="let sec of sections" [ngValue]="sec.id">{{ sec.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">Date</label>
            <app-erp-date-picker
              [(ngModel)]="selectedDate"
              (ngModelChange)="onDateChange()"
              dataTestId="attendance-date"
              placeholder="Session date"
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
              Edit attendance
            </button>
            <button
              class="btn-primary-erp"
              style="width: 100%;"
              (click)="saveAttendance()"
              [disabled]="!records.length || saving || saveDisabled"
              data-testid="save-attendance-btn"
            >
              <span class="spinner" *ngIf="saving"></span>
              {{ saveButtonLabel }}
            </button>
          </div>
        </div>
        <div *ngIf="teacherPastLocked" class="alert alert-info py-2 px-3 small mb-0 mt-3" style="border-radius: var(--radius-md);">
          <i class="bi bi-info-circle me-1"></i>
          This date is in the past. You can review records; only administrators can change past attendance.
        </div>
        <div *ngIf="adminPastAuditView && !adminPastEditing" class="alert alert-info py-2 px-3 small mb-0 mt-3" style="border-radius: var(--radius-md);">
          <i class="bi bi-info-circle me-1"></i>
          Past session — view only. Click <strong>Edit attendance</strong> to change records (audit). You will confirm before saving.
        </div>
        <div *ngIf="saveError" class="alert alert-danger py-2 small mb-0 mt-2">{{ saveError }}</div>
        <p *ngIf="isAdmin && !adminPastAuditView" class="text-muted small mb-0 mt-3" style="line-height: 1.5;">
          <i class="bi bi-shield-check me-1"></i>
          Administrators can submit attendance when needed; you will be asked to confirm before changes are saved (same rules apply with the live API).
        </p>
      </div>

      <div class="erp-card animate-in animate-in-delay-2" *ngIf="records.length > 0">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="erp-card-title">Mark Attendance ({{ records.length }} students)</h4>
          <div class="d-flex gap-3" style="font-size: 13px;">
            <span style="color: var(--clr-success);"><i class="bi bi-check-circle-fill me-1"></i> Present: {{ countByStatus('present') }}</span>
            <span style="color: var(--clr-danger);"><i class="bi bi-x-circle-fill me-1"></i> Absent: {{ countByStatus('absent') }}</span>
            <span style="color: var(--clr-warning);"><i class="bi bi-clock-fill me-1"></i> Late: {{ countByStatus('late') }}</span>
          </div>
        </div>
        <table class="erp-table">
          <thead><tr><th>#</th><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let rec of records; let i = index" [attr.data-testid]="'attendance-row-' + rec.studentId">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ rec.studentName }}</strong></td>
              <td>
                <div class="d-flex gap-2" [class.opacity-50]="cellsLocked" [style.pointer-events]="cellsLocked ? 'none' : 'auto'">
                  <div class="attendance-cell" [class.present]="rec.status === 'present'" (click)="rec.status = 'present'" title="Present">
                    <i class="bi bi-check-lg"></i>
                  </div>
                  <div class="attendance-cell" [class.absent]="rec.status === 'absent'" (click)="rec.status = 'absent'" title="Absent">
                    <i class="bi bi-x-lg"></i>
                  </div>
                  <div class="attendance-cell" [class.late]="rec.status === 'late'" (click)="rec.status = 'late'" title="Late">
                    <i class="bi bi-clock"></i>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!records.length && selectedClassId != null" class="erp-card animate-in">
        <div class="empty-state">
          <i class="bi bi-calendar-check"></i>
          <h3>Select a class and section</h3>
          <p>Choose a class, section, and date to start marking attendance</p>
        </div>
      </div>
    </div>
  `
})
export class AttendanceComponent implements OnInit {
  classes: SchoolClass[] = [];
  sections: { id: number; name: string }[] = [];
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;
  selectedDate = new Date().toISOString().split('T')[0];
  records: AttendanceRecord[] = [];
  saving = false;
  saveError = '';
  myCovers: AttendanceCoverRow[] = [];

  /** Derived from auth on each read so role is never stale if the session hydrates after navigation. */
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
    private confirmDialog: ConfirmDialogService
  ) {}

  /** Teacher record id linked to the signed-in user (for class-teacher checks). */
  private linkedTeacherId: number | null = null;
  /** False until teacher roster fetch completes (avoids skipping the homeroom warning on fast save). */
  teacherRosterResolved = false;
  /** Admin-only: after opening a past date, edits are blocked until user explicitly enables edit mode. */
  adminPastEditing = false;

  ngOnInit(): void {
    this.academicService.getClasses().subscribe(c => (this.classes = c));
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
    this.academicService.getClasses().subscribe(c => (this.classes = c));
    if (this.isTeacher) {
      this.loadMyCovers();
    }
    this.loadAttendance();
  }

  get isPastSession(): boolean {
    return this.isPastDate(this.selectedDate);
  }

  /** Teachers cannot edit past dates; admins use audit flow instead. */
  get teacherPastLocked(): boolean {
    return this.isTeacher && this.isPastSession;
  }

  /** Admin viewing a historical session date (read-only until edit mode). */
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

  get saveButtonLabel(): string {
    if (this.saving) return 'Saving...';
    if (this.saveDisabled) return 'View only';
    return 'Save attendance';
  }

  /** No real sections: roster uses section id 0; dropdown is disabled. */
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

  private effectiveSectionIdForCover(): number | null {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (!cls) return null;
    if (cls.sections.length === 0) return 0;
    return this.selectedSectionId != null && this.selectedSectionId !== 0 ? this.selectedSectionId : null;
  }

  saveAttendance(): void {
    if (this.saveDisabled || this.saving) return;
    const role = this.auth.getNormalizedRole();
    if (!this.isTeacher && !this.isAdmin) {
      this.saveError = 'Only administrators and teachers can mark class attendance.';
      return;
    }
    if (role === 'teacher') {
      if (!this.teacherRosterResolved) {
        this.saveError = 'Loading your teacher profile… please wait a moment and try again.';
        return;
      }
      if (!this.isClassTeacherForCurrentClass()) {
        const covering = this.hasActiveCoverForSelection();
        const cls = this.classes.find(c => c.id === this.selectedClassId);
        this.confirmDialog
          .confirm({
            title: covering ? 'Submit attendance as substitute?' : 'You are not the class teacher',
            message: covering
              ? 'You have an active cover assignment for this class and date. Submit attendance for this session?'
              : this.linkedTeacherId
                ? 'Attendance is usually recorded by the class teacher. If they are absent or unavailable, you may still submit.'
                : 'Your account is not linked to a teacher profile in the directory, or you are not the homeroom teacher for this class. Submit anyway only if you are authorised.',
            details: [
              `Date: ${this.selectedDate}`,
              cls ? `Class: ${cls.name}` : undefined,
              this.effectiveSectionIdForCover() != null ? `Section id: ${this.effectiveSectionIdForCover()}` : undefined,
            ].filter((x): x is string => !!x),
            variant: 'warning',
            confirmLabel: 'Yes, submit attendance',
            cancelLabel: 'Go back',
          })
          .pipe(filter(Boolean))
          .subscribe(() => this.finishSaveAfterGuards());
        return;
      }
    }
    if (this.isAdmin) {
      if (!this.teacherRosterResolved) {
        this.saveError = 'Loading directory… please wait a moment and try again.';
        return;
      }
      this.saveError = '';
      const cls = this.classes.find(c => c.id === this.selectedClassId);
      const homeroom = cls?.classTeacherName?.trim() || 'Not assigned';
      const asHomeroom = this.isClassTeacherForCurrentClass();
      this.confirmDialog
        .confirm({
          title: 'Submit attendance as administrator',
          message: asHomeroom
            ? `You are signed in as an administrator. You are also recorded as the homeroom teacher for this class (${homeroom}). Confirm submission for this session?`
            : `You are not the class teacher for this group. Daily attendance is normally recorded by the homeroom teacher (${homeroom}). Continue only if you are authorised to submit on their behalf.`,
          details: [
            `Date: ${this.selectedDate}`,
            cls ? `Class: ${cls.name}` : undefined,
            this.effectiveSectionIdForCover() != null ? `Section id: ${this.effectiveSectionIdForCover()}` : undefined,
          ].filter((x): x is string => !!x),
          variant: 'warning',
          confirmLabel: 'Yes, submit attendance',
          cancelLabel: 'Go back',
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
          title: 'Update past attendance?',
          message:
            'You are changing historical attendance for this class and date. Use this only for verified corrections; changes are written to the server.',
          details: [
            `Date: ${this.selectedDate}`,
            cls ? `Class: ${cls.name}` : undefined,
            this.effectiveSectionIdForCover() != null ? `Section: ${this.effectiveSectionIdForCover()}` : undefined,
            `Rows: ${this.records.length}`,
          ].filter((x): x is string => !!x),
          variant: 'warning',
          confirmLabel: 'Yes, save changes',
          cancelLabel: 'Cancel',
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
        this.saveError = e?.message || 'Could not save attendance.';
      },
    });
  }

  countByStatus(status: string): number {
    return this.records.filter(r => r.status === status).length;
  }
}
