import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../core/services/attendance.service';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { SchoolClass, Student, AttendanceRecord } from '../../core/models/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="attendance-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Attendance</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Mark and manage daily attendance</p>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()" data-testid="attendance-class-select">
              <option value="">Select Class</option>
              <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">Section</label>
            <select class="erp-select" [(ngModel)]="selectedSectionId" (change)="loadAttendance()" data-testid="attendance-section-select">
              <option value="">Select Section</option>
              <option *ngFor="let sec of sections" [value]="sec.id">{{ sec.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">Date</label>
            <input type="date" class="erp-input" [(ngModel)]="selectedDate" (change)="loadAttendance()" data-testid="attendance-date">
          </div>
          <div class="col-md-3">
            <button class="btn-primary-erp" style="width: 100%;" (click)="saveAttendance()" [disabled]="!records.length || saving" data-testid="save-attendance-btn">
              <span class="spinner" *ngIf="saving"></span>
              {{ saving ? 'Saving...' : 'Save Attendance' }}
            </button>
          </div>
        </div>
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
                <div class="d-flex gap-2">
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

      <div *ngIf="!records.length && selectedClassId" class="erp-card animate-in">
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
  sections: { id: string; name: string }[] = [];
  selectedClassId = '';
  selectedSectionId = '';
  selectedDate = new Date().toISOString().split('T')[0];
  records: AttendanceRecord[] = [];
  saving = false;

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private academicService: AcademicService
  ) {}

  ngOnInit(): void {
    this.academicService.getClasses().subscribe(c => this.classes = c);
  }

  onClassChange(): void {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    this.sections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    this.selectedSectionId = '';
    this.records = [];
  }

  loadAttendance(): void {
    if (!this.selectedClassId || !this.selectedSectionId) return;
    this.studentService.getStudentsByClassAndSection(this.selectedClassId, this.selectedSectionId).subscribe(sectionStudents => {
      this.attendanceService.getAttendanceByClassAndDate(this.selectedClassId, this.selectedSectionId, this.selectedDate).subscribe(existing => {
        this.records = sectionStudents.map(s => {
          const ex = existing.find(e => e.studentId === s.id);
          return ex || {
            id: 'att-' + s.id + '-' + this.selectedDate,
            studentId: s.id,
            studentName: s.firstName + ' ' + s.lastName,
            classId: this.selectedClassId,
            sectionId: this.selectedSectionId,
            date: this.selectedDate,
            status: 'present' as const,
            markedBy: 'u1',
            tenantId: 't1'
          };
        });
      });
    });
  }

  saveAttendance(): void {
    this.saving = true;
    this.attendanceService.saveAttendance(this.records).subscribe(() => { this.saving = false; });
  }

  countByStatus(status: string): number {
    return this.records.filter(r => r.status === status).length;
  }
}
