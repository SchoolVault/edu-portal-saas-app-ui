import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { ExamService } from '../../core/services/exam.service';
import { FeeService } from '../../core/services/fee.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { Student, MarkRecord, FeePayment, AttendanceStats } from '../../core/models/models';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div data-testid="student-profile-page" class="animate-in" *ngIf="student">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-icon" (click)="router.navigate(['/app/students'])" data-testid="back-btn"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <div class="flex-grow-1">
          <h2 style="font-size: 24px; font-weight: 800;">Student Profile</h2>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadAll()" data-testid="profile-refresh-btn">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <a *ngIf="isAdmin" [routerLink]="['/app/students', student.id, 'edit']" class="btn-primary-erp btn-sm" data-testid="edit-profile-btn">
            <i class="bi bi-pencil"></i> Edit
          </a>
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
            <span class="badge-erp badge-success">{{ student.status }}</span>
            <hr style="border-color: var(--clr-border); margin: 20px 0;">
            <div style="text-align: left;">
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Email</span><strong>{{ student.email }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Phone</span><strong>{{ student.phone }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Date of Birth</span><strong>{{ student.dateOfBirth }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Blood Group</span><strong>{{ student.bloodGroup }}</strong></div>
              <div class="mb-3"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Gender</span><strong style="text-transform: capitalize;">{{ student.gender }}</strong></div>
              <div><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Address</span><strong>{{ student.address }}</strong></div>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="erp-card mb-4">
            <h4 class="erp-card-title mb-3">Academic Information</h4>
            <div class="row g-3">
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Class</span><strong>{{ student.className }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Section</span><strong>{{ student.sectionName }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Roll Number</span><strong>{{ student.rollNumber }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Admission Date</span><strong>{{ student.admissionDate }}</strong></div>
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Parent/Guardian</span><strong>{{ student.parentName }}</strong></div>
            </div>
          </div>
          <div class="erp-card">
            <div class="erp-tabs">
              <button class="erp-tab" [class.active]="activeTab === 'marks'" (click)="activeTab = 'marks'" data-testid="tab-marks">Exam Results</button>
              <button class="erp-tab" [class.active]="activeTab === 'fees'" (click)="activeTab = 'fees'" data-testid="tab-fees">Fee History</button>
              <button class="erp-tab" [class.active]="activeTab === 'attendance'" (click)="activeTab = 'attendance'" data-testid="tab-attendance">Attendance</button>
            </div>

            <div *ngIf="activeTab === 'marks'">
              <div *ngIf="marks.length > 0">
                <table class="erp-table" data-testid="student-marks-table">
                  <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Max</th><th>Percentage</th><th>Grade</th></tr></thead>
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
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">Total Marks</span><br><strong>{{ totalMarks }}/{{ totalMax }}</strong></div>
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">Overall %</span><br><strong>{{ overallPercentage }}%</strong></div>
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">Subjects</span><br><strong>{{ marks.length }}</strong></div>
                    <div class="col-md-3"><span style="font-size: 12px; color: var(--clr-text-muted);">Overall Grade</span><br><strong style="color: var(--clr-success);">{{ overallGrade }}</strong></div>
                  </div>
                </div>
              </div>
              <div *ngIf="marks.length === 0" class="empty-state"><i class="bi bi-journal-text"></i><h3>No Results</h3><p>No exam results found for this student</p></div>
            </div>

            <div *ngIf="activeTab === 'fees'">
              <div *ngIf="fees.length > 0">
                <table class="erp-table" data-testid="student-fees-table">
                  <thead><tr><th>Description</th><th>Amount</th><th>Paid</th><th>Pending</th><th>Due Date</th><th>Status</th><th>Receipt</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let f of fees">
                      <td><strong>Fee Payment</strong></td>
                      <td>&#36;{{ f.amount | number }}</td>
                      <td style="color: var(--clr-success);">&#36;{{ f.paidAmount | number }}</td>
                      <td [style.color]="f.dueAmount > 0 ? 'var(--clr-danger)' : 'var(--clr-success)'">&#36;{{ f.dueAmount | number }}</td>
                      <td>{{ f.dueDate }}</td>
                      <td><span class="badge-erp" [ngClass]="{'badge-success': f.status === 'paid', 'badge-warning': f.status === 'partial', 'badge-danger': f.status === 'overdue', 'badge-neutral': f.status === 'unpaid'}">{{ f.status }}</span></td>
                      <td>{{ f.receiptNumber || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
                <div style="padding: 16px; background: var(--clr-bg); border-radius: var(--radius-lg); margin-top: 12px;">
                  <div class="row">
                    <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted);">Total Fee</span><br><strong>&#36;{{ totalFee | number }}</strong></div>
                    <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted);">Total Paid</span><br><strong style="color: var(--clr-success);">&#36;{{ totalPaid | number }}</strong></div>
                    <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted);">Total Pending</span><br><strong style="color: var(--clr-danger);">&#36;{{ totalPending | number }}</strong></div>
                  </div>
                </div>
              </div>
              <div *ngIf="fees.length === 0" class="empty-state"><i class="bi bi-credit-card"></i><h3>No Fee Records</h3><p>No fee payment records found</p></div>
            </div>

            <div *ngIf="activeTab === 'attendance'">
              <div style="padding: 16px; background: var(--clr-bg); border-radius: var(--radius-lg); margin-bottom: 16px;">
                <div class="row text-center">
                  <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-success);">{{ attendanceStats.present }}</div><div style="font-size: 12px; color: var(--clr-text-muted);">Days Present</div></div>
                  <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-danger);">{{ attendanceStats.absent }}</div><div style="font-size: 12px; color: var(--clr-text-muted);">Days Absent</div></div>
                  <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-warning);">{{ attendanceStats.late }}</div><div style="font-size: 12px; color: var(--clr-text-muted);">Days Late</div></div>
                  <div class="col-md-3"><div style="font-size: 28px; font-weight: 800; color: var(--clr-primary);">{{ attendanceStats.attendancePercentage }}%</div><div style="font-size: 12px; color: var(--clr-text-muted);">Attendance Rate</div></div>
                </div>
              </div>
              <p style="font-size: 13px; color: var(--clr-text-muted);">Attendance summary shown for the current month.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
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
    public router: Router
  ) {}

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  get studentPortraitUrl(): string | null {
    if (!this.student) return null;
    return this.auth.getDirectoryStudentAvatarDataUrl(this.student.id) || this.student.avatar || null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
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
    const id = this.student?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) {
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

  private loadMarks(studentId: string): void {
    this.examService.getMarksByStudent(studentId).subscribe(marks => {
      this.marks = marks;
      this.totalMarks = marks.reduce((sum, m) => sum + m.marksObtained, 0);
      this.totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
      this.overallPercentage = this.totalMax > 0 ? ((this.totalMarks / this.totalMax) * 100).toFixed(1) : '0';
      const pct = parseFloat(this.overallPercentage);
      this.overallGrade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';
    });
  }

  private loadFees(studentId: string): void {
    this.feeService.getStudentPayments(studentId).subscribe(payments => {
      this.fees = payments;
      this.totalFee = this.fees.reduce((sum, f) => sum + f.amount, 0);
      this.totalPaid = this.fees.reduce((sum, f) => sum + f.paidAmount, 0);
      this.totalPending = this.fees.reduce((sum, f) => sum + f.dueAmount, 0);
    });
  }

  private loadAttendance(studentId: string): void {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    this.attendanceService.getStudentAttendanceStats(studentId, from, to).subscribe(stats => {
      this.attendanceStats = stats;
    });
  }

  getExamName(examId: string): string {
    const map: Record<string, string> = { e1: 'Unit Test 1', e2: 'Midterm', e3: 'Unit Test 2', e4: 'Final Exam' };
    return map[examId] || examId;
  }
}
