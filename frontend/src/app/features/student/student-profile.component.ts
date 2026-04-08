import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/models';

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
        <a [routerLink]="['/app/students', student.id, 'edit']" class="btn-primary-erp btn-sm" data-testid="edit-profile-btn">
          <i class="bi bi-pencil"></i> Edit
        </a>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="erp-card text-center" style="padding: 32px;">
            <div class="profile-avatar mx-auto mb-3" style="width: 80px; height: 80px; font-size: 28px;"
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
              <div class="col-md-4"><span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Gender</span><strong style="text-transform: capitalize;">{{ student.gender }}</strong></div>
            </div>
          </div>
          <div class="erp-card">
            <div class="erp-tabs">
              <button class="erp-tab" [class.active]="activeTab === 'attendance'" (click)="activeTab = 'attendance'">Attendance</button>
              <button class="erp-tab" [class.active]="activeTab === 'marks'" (click)="activeTab = 'marks'">Exam Results</button>
              <button class="erp-tab" [class.active]="activeTab === 'fees'" (click)="activeTab = 'fees'">Fee History</button>
            </div>
            <div *ngIf="activeTab === 'attendance'" class="empty-state">
              <i class="bi bi-calendar-check"></i>
              <h3>Attendance Records</h3>
              <p>Attendance data will appear here once integrated with backend.</p>
            </div>
            <div *ngIf="activeTab === 'marks'" class="empty-state">
              <i class="bi bi-journal-text"></i>
              <h3>Exam Results</h3>
              <p>Exam results will appear here once integrated with backend.</p>
            </div>
            <div *ngIf="activeTab === 'fees'" class="empty-state">
              <i class="bi bi-credit-card"></i>
              <h3>Fee History</h3>
              <p>Fee payment history will appear here once integrated with backend.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
  activeTab = 'attendance';

  constructor(
    private studentService: StudentService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.studentService.getStudentById(id).subscribe(s => { if (s) this.student = s; });
    }
  }
}
