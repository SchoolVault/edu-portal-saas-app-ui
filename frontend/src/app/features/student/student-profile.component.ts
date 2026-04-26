import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Student, StudentGuardianMapping, AttendanceStats } from '../../core/models/models';
import { StudentGuardianPanelComponent } from './student-guardian-panel/student-guardian-panel.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StudentGuardianPanelComponent, SchoolClassNamePipe],
  styles: [
    `
      .student-profile-page {
        color: var(--clr-text);
      }
      .student-profile-page .erp-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 82%, var(--clr-primary) 18%);
        border-radius: 14px;
        box-shadow: 0 8px 22px color-mix(in srgb, var(--clr-primary) 8%, transparent);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--clr-surface) 97%, var(--clr-primary) 3%) 0%,
          var(--clr-surface) 100%
        );
      }
      .student-profile-title {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: color-mix(in srgb, var(--clr-text) 92%, var(--clr-primary));
      }
      .student-profile-card--identity {
        padding: 28px;
      }
      .student-profile-section-title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: color-mix(in srgb, var(--clr-text) 88%, var(--clr-primary) 12%);
      }
      .student-kpi-strip {
        padding: 16px;
        background: color-mix(in srgb, var(--clr-surface) 94%, var(--clr-primary) 6%);
        border-radius: var(--radius-lg);
        border: 1px solid color-mix(in srgb, var(--clr-border) 72%, var(--clr-primary) 28%);
        margin-bottom: 16px;
      }
      @media (max-width: 576px) {
        .student-profile-card--identity {
          padding: 20px;
        }
        .student-profile-title {
          font-size: 21px;
        }
      }
    `,
  ],
  template: `
    <div class="student-profile-page animate-in" data-testid="student-profile-page" *ngIf="student">
      <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button class="btn-icon" (click)="router.navigate(['/app/students'])" data-testid="back-btn"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <div class="flex-grow-1">
          <h2 class="student-profile-title">{{ 'students.profile.title' | translate }}</h2>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadAll()" data-testid="profile-refresh-btn">
            <i class="bi bi-arrow-clockwise"></i> {{ 'students.profile.refresh' | translate }}
          </button>
          <a *ngIf="isSchoolAdmin" [routerLink]="['/app/students', student.id, 'edit']" class="btn-primary-erp btn-sm" data-testid="edit-profile-btn">
            <i class="bi bi-pencil"></i> {{ 'students.profile.edit' | translate }}
          </a>
          <button *ngIf="isSchoolAdmin && student.status === 'active'" type="button" class="btn-outline-erp btn-sm" [disabled]="lifecycleBusy" (click)="markInactive()" data-testid="mark-inactive-btn">
            {{ 'students.profile.markInactive' | translate }}
          </button>
          <button *ngIf="isSchoolAdmin && student.status === 'inactive'" type="button" class="btn-outline-erp btn-sm" [disabled]="lifecycleBusy" (click)="reactivate()" data-testid="reactivate-student-btn">
            {{ 'students.profile.reactivate' | translate }}
          </button>
          <button *ngIf="isSchoolAdmin" type="button" class="btn-outline-erp btn-sm" style="border-color: var(--clr-danger); color: var(--clr-danger);" [disabled]="lifecycleBusy" (click)="softDeleteFromSchool()" data-testid="remove-directory-btn">
            {{ 'students.profile.removeDirectory' | translate }}
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="erp-card student-profile-card--identity text-center">
            <img *ngIf="studentPortraitUrl" [src]="studentPortraitUrl" alt="" class="mx-auto mb-3 d-block rounded-circle" style="width: 80px; height: 80px; object-fit: cover; border: 2px solid var(--clr-border);" />
            <div *ngIf="!studentPortraitUrl" class="profile-avatar mx-auto mb-3" style="width: 80px; height: 80px; font-size: 28px;"
                 [style.background]="student.gender === 'female' ? '#C05C3D' : '#1B3A30'">
              {{ student.firstName[0] }}{{ student.lastName[0] }}
            </div>
            <h3 style="font-size: 20px; font-weight: 700;">{{ student.firstName }} {{ student.lastName }}</h3>
            <p class="text-muted" style="font-size: 13px;">{{ student.admissionNumber }}</p>
            <span class="badge-erp badge-success">{{ statusLabel(student.status) }}</span>
            <hr style="border-color: var(--clr-border); margin: 20px 0;">
            <div style="text-align: left;">
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.email' | translate }}</span><strong>{{ student.email }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.phone' | translate }}</span><strong>{{ student.phone }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.dob' | translate }}</span><strong>{{ student.dateOfBirth }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.form.bloodGroup' | translate }}</span><strong>{{ student.bloodGroup }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.gender' | translate }}</span><strong>{{ genderLabel(student.gender) }}</strong></div>
              <div><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.address' | translate }}</span><strong>{{ student.address }}</strong></div>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="erp-card mb-4">
            <h4 class="student-profile-section-title mb-3">{{ 'students.profile.academicInfo' | translate }}</h4>
            <div class="row g-3">
              <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.class' | translate }}</span><strong>{{ student.className | schoolClassName }}</strong></div>
              <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.section' | translate }}</span><strong>{{ student.sectionName }}</strong></div>
              <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.rollNumber' | translate }}</span><strong>{{ student.rollNumber }}</strong></div>
              <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.admissionDate' | translate }}</span><strong>{{ student.admissionDate }}</strong></div>
            </div>
            <hr style="border-color: var(--clr-border); margin: 20px 0;" />
            <app-student-guardian-panel
              [guardians]="guardianMappings"
              [loading]="guardiansLoading"
              [fallbackParentName]="student.parentName || null"
            />
          </div>
          <div class="erp-card">
            <h4 class="student-profile-section-title mb-2">{{ 'students.profile.attendanceOverviewTitle' | translate }}</h4>
            <p class="text-muted small mb-3" style="line-height: 1.5;">{{ 'students.profile.directoryScopeNote' | translate }}</p>
            <div class="student-kpi-strip">
              <div class="row text-center">
                <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-success);">{{ attendanceStats.present }}</div><div style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.attPresent' | translate }}</div></div>
                <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-danger);">{{ attendanceStats.absent }}</div><div style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.attAbsent' | translate }}</div></div>
                <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-warning);">{{ attendanceStats.late }}</div><div style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.attLate' | translate }}</div></div>
                <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-primary);">{{ attendanceStats.attendancePercentage }}%</div><div style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.attRate' | translate }}</div></div>
              </div>
            </div>
            <p style="font-size: 13px; color: var(--clr-text-muted);">{{ 'students.profile.attNote' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  student: Student | null = null;
  lifecycleBusy = false;
  guardianMappings: StudentGuardianMapping[] = [];
  guardiansLoading = false;
  attendanceStats = { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 0 } as AttendanceStats;
  private langSub?: Subscription;

  constructor(
    private studentService: StudentService,
    private attendanceService: AttendanceService,
    private auth: AuthService,
    private uiAccess: UiAccessService,
    private route: ActivatedRoute,
    public router: Router,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  statusLabel(status: string): string {
    const key = 'students.enums.status.' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  genderLabel(g: string | undefined): string {
    if (!g) return '';
    const key = 'students.enums.gender.' + g;
    const t = this.translate.instant(key);
    return t !== key ? t : g;
  }

  /** Student master writes — {@code STUDENT_MASTER_WRITE} / delegated registrar. */
  get isSchoolAdmin(): boolean {
    return this.uiAccess.hasStudentMasterWriteAccess();
  }

  get studentPortraitUrl(): string | null {
    if (!this.student) return null;
    return this.auth.getDirectoryStudentAvatarDataUrl(this.student.id) || this.student.avatar || null;
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
    this.langSub.add(this.translate.onTranslationChange.subscribe(() => this.cdr.markForCheck()));
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw != null ? Number(raw) : NaN;
    if (Number.isFinite(id)) {
      this.studentService.getStudentById(id).subscribe(s => {
        if (s) {
          this.student = s;
          this.loadAttendance(id);
          this.loadGuardians(id);
        }
      });
    }
  }

  reloadAll(): void {
    const sid = this.student?.id;
    const raw = this.route.snapshot.paramMap.get('id');
    const id = sid ?? (raw != null ? Number(raw) : NaN);
    if (!Number.isFinite(id)) {
      return;
    }
    this.studentService.getStudentById(id).subscribe(s => {
      if (s) {
        this.student = s;
        this.loadAttendance(id);
        this.loadGuardians(id);
      }
    });
  }

  private loadGuardians(studentId: number): void {
    this.guardiansLoading = true;
    this.studentService.getGuardianMappings(studentId).subscribe({
      next: rows => {
        this.guardianMappings = rows;
        this.guardiansLoading = false;
      },
      error: () => {
        this.guardianMappings = [];
        this.guardiansLoading = false;
      },
    });
  }

  private loadAttendance(studentId: number): void {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    this.attendanceService.getStudentAttendanceStats(studentId, from, to).subscribe(stats => {
      this.attendanceStats = stats;
    });
  }

  markInactive(): void {
    if (!this.student) {
      return;
    }
    const s = this.student;
    this.confirmDialog
      .confirm({
        title: this.translate.instant('students.profile.confirmInactive.title'),
        message: this.translate.instant('students.profile.confirmInactive.message', {
          name: `${s.firstName} ${s.lastName}`,
        }),
        details: [
          this.translate.instant('students.profile.confirmInactive.detailAdmission', { no: s.admissionNumber }),
          this.translate.instant('students.profile.confirmInactive.detailClass', {
            class: `${formatSchoolClassName(s.className, this.translate) || s.className} ${s.sectionName || ''}`.trim(),
          }),
        ],
        variant: 'warning',
        confirmLabel: this.translate.instant('students.profile.confirmInactive.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.lifecycleBusy = true;
        this.studentService.updateStudent(s.id, { ...s, status: 'inactive' }).subscribe({
          next: next => {
            this.student = next;
            this.lifecycleBusy = false;
          },
          error: () => {
            this.lifecycleBusy = false;
          },
        });
      });
  }

  reactivate(): void {
    if (!this.student) {
      return;
    }
    this.lifecycleBusy = true;
    this.studentService.updateStudent(this.student.id, { ...this.student, status: 'active' }).subscribe({
      next: s => {
        this.student = s;
        this.lifecycleBusy = false;
      },
      error: () => {
        this.lifecycleBusy = false;
      },
    });
  }

  softDeleteFromSchool(): void {
    if (!this.student) {
      return;
    }
    const s = this.student;
    this.confirmDialog
      .confirm({
        title: this.translate.instant('students.profile.confirmRemove.title'),
        message: this.translate.instant('students.profile.confirmRemove.message', {
          name: `${s.firstName} ${s.lastName}`,
        }),
        details: [
          this.translate.instant('students.profile.confirmRemove.detailAdmission', { no: s.admissionNumber }),
          this.translate.instant('students.profile.confirmRemove.detailSoft'),
        ],
        variant: 'danger',
        confirmLabel: this.translate.instant('students.profile.confirmRemove.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.lifecycleBusy = true;
        this.studentService.deleteStudent(s.id).subscribe({
          next: () => {
            this.lifecycleBusy = false;
            this.router.navigate(['/app/students']);
          },
          error: () => {
            this.lifecycleBusy = false;
          },
        });
      });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }
}
