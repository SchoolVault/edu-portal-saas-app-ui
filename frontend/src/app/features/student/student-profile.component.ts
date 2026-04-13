import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { ExamService } from '../../core/services/exam.service';
import { FeeService } from '../../core/services/fee.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { filter } from 'rxjs/operators';
import { Student, MarkRecord, FeePayment, AttendanceStats } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div data-testid="student-profile-page" class="animate-in" *ngIf="student">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-icon" (click)="router.navigate(['/app/students'])" data-testid="back-btn"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <div class="flex-grow-1">
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'students.profile.title' | translate }}</h2>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadAll()" data-testid="profile-refresh-btn">
            <i class="bi bi-arrow-clockwise"></i> {{ 'students.profile.refresh' | translate }}
          </button>
          <a *ngIf="isAdmin" [routerLink]="['/app/students', student.id, 'edit']" class="btn-primary-erp btn-sm" data-testid="edit-profile-btn">
            <i class="bi bi-pencil"></i> {{ 'students.profile.edit' | translate }}
          </a>
          <button *ngIf="isAdmin && student.status === 'active'" type="button" class="btn-outline-erp btn-sm" [disabled]="lifecycleBusy" (click)="markInactive()" data-testid="mark-inactive-btn">
            {{ 'students.profile.markInactive' | translate }}
          </button>
          <button *ngIf="isAdmin && student.status === 'inactive'" type="button" class="btn-outline-erp btn-sm" [disabled]="lifecycleBusy" (click)="reactivate()" data-testid="reactivate-student-btn">
            {{ 'students.profile.reactivate' | translate }}
          </button>
          <button *ngIf="isAdmin" type="button" class="btn-outline-erp btn-sm" style="border-color: var(--clr-danger); color: var(--clr-danger);" [disabled]="lifecycleBusy" (click)="softDeleteFromSchool()" data-testid="remove-directory-btn">
            {{ 'students.profile.removeDirectory' | translate }}
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="erp-card text-center" style="padding: 32px;">
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
            <h4 class="erp-card-title mb-3">{{ 'students.profile.academicInfo' | translate }}</h4>
            <div class="row g-3">
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.class' | translate }}</span><strong>{{ student.className }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.section' | translate }}</span><strong>{{ student.sectionName }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.rollNumber' | translate }}</span><strong>{{ student.rollNumber }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.admissionDate' | translate }}</span><strong>{{ student.admissionDate }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'students.profile.parentGuardian' | translate }}</span><strong>{{ student.parentName }}</strong></div>
            </div>
          </div>
          <div class="erp-card">
            <div class="erp-tabs">
              <button class="erp-tab" [class.active]="activeTab === 'marks'" (click)="activeTab = 'marks'" data-testid="tab-marks">{{ 'students.profile.tabMarks' | translate }}</button>
              <button class="erp-tab" [class.active]="activeTab === 'fees'" (click)="activeTab = 'fees'" data-testid="tab-fees">{{ 'students.profile.tabFees' | translate }}</button>
              <button class="erp-tab" [class.active]="activeTab === 'attendance'" (click)="activeTab = 'attendance'" data-testid="tab-attendance">{{ 'students.profile.tabAttendance' | translate }}</button>
            </div>

            <div *ngIf="activeTab === 'marks'">
              <div *ngIf="marks.length > 0">
                <table class="erp-table" data-testid="student-marks-table">
                  <thead><tr><th>{{ 'students.profile.thExam' | translate }}</th><th>{{ 'students.profile.thSubject' | translate }}</th><th>{{ 'students.profile.thMarks' | translate }}</th><th>{{ 'students.profile.thMax' | translate }}</th><th>{{ 'students.profile.thPct' | translate }}</th><th>{{ 'students.profile.thGrade' | translate }}</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let m of marks">
                      <td>{{ getExamName(m.examId) }}</td>
                      <td><strong>{{ m.subjectName }}</strong></td>
                      <td>{{ m.marksObtained }}</td>
                      <td>{{ m.maxMarks }}</td>
                      <td>{{ ((m.marksObtained / m.maxMarks) * 100).toFixed(1) }}%</td>
                      <td><span class="badge-erp" [ngClass]="m.grade.startsWith('A') ? 'badge-success' : m.grade.startsWith('B') ? 'badge-info' : 'badge-warning'">{{ m.grade }}</span></td>
                    </tr>
                  </tbody>
                </table>
                <div style="padding: 16px; background: var(--clr-bg); border-radius: var(--radius-lg); margin-top: 12px;">
                  <div class="row">
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summaryTotalMarks' | translate }}</span><br><strong>{{ totalMarks }}/{{ totalMax }}</strong></div>
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summaryOverallPct' | translate }}</span><br><strong>{{ overallPercentage }}%</strong></div>
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summarySubjects' | translate }}</span><br><strong>{{ marks.length }}</strong></div>
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summaryOverallGrade' | translate }}</span><br><strong style="color: var(--clr-success);">{{ overallGrade }}</strong></div>
                  </div>
                </div>
              </div>
              <div *ngIf="marks.length === 0" class="empty-state"><i class="bi bi-journal-text"></i><h3>{{ 'students.profile.emptyMarksTitle' | translate }}</h3><p>{{ 'students.profile.emptyMarksLead' | translate }}</p></div>
            </div>

            <div *ngIf="activeTab === 'fees'">
              <div *ngIf="fees.length > 0">
                <table class="erp-table" data-testid="student-fees-table">
                  <thead><tr><th>{{ 'students.profile.feeDescription' | translate }}</th><th>{{ 'students.profile.thAmount' | translate }}</th><th>{{ 'students.profile.thPaid' | translate }}</th><th>{{ 'students.profile.thPending' | translate }}</th><th>{{ 'students.profile.thDueDate' | translate }}</th><th>{{ 'students.profile.thStatus' | translate }}</th><th>{{ 'students.profile.thReceipt' | translate }}</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let f of fees">
                      <td><strong>{{ 'students.profile.feeDescription' | translate }}</strong></td>
                      <td>&#36;{{ f.amount | number }}</td>
                      <td style="color: var(--clr-success);">&#36;{{ f.paidAmount | number }}</td>
                      <td [style.color]="f.dueAmount > 0 ? 'var(--clr-danger)' : 'var(--clr-success)'">&#36;{{ f.dueAmount | number }}</td>
                      <td>{{ f.dueDate }}</td>
                      <td><span class="badge-erp" [ngClass]="{'badge-success': f.status === 'paid', 'badge-warning': f.status === 'partial', 'badge-danger': f.status === 'overdue', 'badge-neutral': f.status === 'unpaid'}">{{ feeStatusLabel(f.status) }}</span></td>
                      <td>{{ f.receiptNumber || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
                <div style="padding: 16px; background: var(--clr-bg); border-radius: var(--radius-lg); margin-top: 12px;">
                  <div class="row">
                    <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summaryTotalFee' | translate }}</span><br><strong>&#36;{{ totalFee | number }}</strong></div>
                    <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summaryTotalPaid' | translate }}</span><br><strong style="color: var(--clr-success);">&#36;{{ totalPaid | number }}</strong></div>
                    <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'students.profile.summaryTotalPending' | translate }}</span><br><strong style="color: var(--clr-danger);">&#36;{{ totalPending | number }}</strong></div>
                  </div>
                </div>
              </div>
              <div *ngIf="fees.length === 0" class="empty-state"><i class="bi bi-credit-card"></i><h3>{{ 'students.profile.emptyFeesTitle' | translate }}</h3><p>{{ 'students.profile.emptyFeesLead' | translate }}</p></div>
            </div>

            <div *ngIf="activeTab === 'attendance'">
              <div style="padding: 16px; background: var(--clr-bg); border-radius: var(--radius-lg); margin-bottom: 16px;">
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
    </div>
  `
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
  lifecycleBusy = false;
  activeTab = 'marks';
  marks: MarkRecord[] = [];
  fees: FeePayment[] = [];
  totalMarks = 0;
  totalMax = 0;
  overallPercentage = '0';
  overallGrade = '-';
  totalFee = 0;
  totalPaid = 0;
  totalPending = 0;
  attendanceStats = { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 0 } as AttendanceStats;

  constructor(
    private studentService: StudentService,
    private examService: ExamService,
    private feeService: FeeService,
    private attendanceService: AttendanceService,
    private auth: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService
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

  feeStatusLabel(s: string): string {
    const key = 'students.enums.feeStatus.' + s;
    const t = this.translate.instant(key);
    return t !== key ? t : s;
  }

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  get studentPortraitUrl(): string | null {
    if (!this.student) return null;
    return this.auth.getDirectoryStudentAvatarDataUrl(this.student.id) || this.student.avatar || null;
  }

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw != null ? Number(raw) : NaN;
    if (Number.isFinite(id)) {
      this.studentService.getStudentById(id).subscribe(s => {
        if (s) {
          this.student = s;
          this.loadMarks(id);
          this.loadFees(id);
          this.loadAttendance(id);
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
        this.loadMarks(id);
        this.loadFees(id);
        this.loadAttendance(id);
      }
    });
  }

  private loadMarks(studentId: number): void {
    this.examService.getMarksByStudent(studentId).subscribe(marks => {
      this.marks = marks;
      this.totalMarks = marks.reduce((sum, m) => sum + m.marksObtained, 0);
      this.totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
      this.overallPercentage = this.totalMax > 0 ? ((this.totalMarks / this.totalMax) * 100).toFixed(1) : '0';
      const pct = parseFloat(this.overallPercentage);
      this.overallGrade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';
    });
  }

  private loadFees(studentId: number): void {
    this.feeService.getStudentPayments(studentId).subscribe(payments => {
      this.fees = payments;
      this.totalFee = this.fees.reduce((sum, f) => sum + f.amount, 0);
      this.totalPaid = this.fees.reduce((sum, f) => sum + f.paidAmount, 0);
      this.totalPending = this.fees.reduce((sum, f) => sum + f.dueAmount, 0);
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

  getExamName(examId: number): string {
    const key = 'students.profile.exam' + examId;
    const t = this.translate.instant(key);
    if (t !== key) {
      return t;
    }
    return this.translate.instant('students.profile.examFallback', { id: examId });
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
            class: `${s.className} ${s.sectionName || ''}`.trim(),
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
}
