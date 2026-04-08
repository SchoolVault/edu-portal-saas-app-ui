import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../core/services/exam.service';
import { Exam, MarkRecord } from '../../core/models/models';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="exams-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Examinations</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage exams, marks, and report cards</p>
        </div>
        <button class="btn-primary-erp btn-sm" (click)="showCreateModal = true" data-testid="create-exam-btn">
          <i class="bi bi-plus-lg"></i> Create Exam
        </button>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-md-6 col-lg-3" *ngFor="let exam of exams">
          <div class="erp-card" style="cursor: pointer;" (click)="selectExam(exam)" [attr.data-testid]="'exam-card-' + exam.id"
               [style.border-color]="selectedExam?.id === exam.id ? 'var(--clr-accent)' : ''">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h4 style="font-size: 15px; font-weight: 700;">{{ exam.name }}</h4>
              <span class="badge-erp" [ngClass]="{'badge-success': exam.status === 'completed', 'badge-warning': exam.status === 'ongoing', 'badge-info': exam.status === 'upcoming'}">
                {{ exam.status }}
              </span>
            </div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">
              <div><i class="bi bi-calendar3 me-1"></i>{{ exam.startDate }} - {{ exam.endDate }}</div>
              <div><i class="bi bi-book me-1"></i>{{ exam.classIds.length }} classes</div>
            </div>
          </div>
        </div>
      </div>

      <div class="erp-card animate-in animate-in-delay-2" *ngIf="selectedExam && marks.length > 0">
        <div class="erp-card-header">
          <h3 class="erp-card-title">{{ selectedExam.name }} - Results</h3>
        </div>
        <table class="erp-table" data-testid="marks-table">
          <thead>
            <tr><th>Student</th><th>Subject</th><th>Marks</th><th>Max Marks</th><th>Percentage</th><th>Grade</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of marks">
              <td><strong>{{ m.studentName }}</strong></td>
              <td>{{ m.subjectName }}</td>
              <td>{{ m.marksObtained }}</td>
              <td>{{ m.maxMarks }}</td>
              <td>{{ ((m.marksObtained / m.maxMarks) * 100).toFixed(1) }}%</td>
              <td><span class="badge-erp" [ngClass]="getGradeBadge(m.grade)">{{ m.grade }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>Create New Exam</h3>
          <button class="btn-icon" (click)="showCreateModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="erp-form-group"><label class="erp-label">Exam Name</label><input type="text" class="erp-input" [(ngModel)]="newExam.name" data-testid="exam-name-input"></div>
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Start Date</label><input type="date" class="erp-input" [(ngModel)]="newExam.startDate"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">End Date</label><input type="date" class="erp-input" [(ngModel)]="newExam.endDate"></div></div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="showCreateModal = false">Cancel</button>
          <button class="btn-primary-erp" (click)="createExam()" data-testid="submit-exam-btn">Create Exam</button>
        </div>
      </div>
    </div>
  `
})
export class ExamsComponent implements OnInit {
  exams: Exam[] = [];
  marks: MarkRecord[] = [];
  selectedExam: Exam | null = null;
  showCreateModal = false;
  showMarksEntry = false;
  newExam = { name: '', startDate: '', endDate: '' };
  marksEntryStudents: any[] = [];
  marksSubject = '';
  marksSaving = false;

  constructor(private examService: ExamService) {}

  ngOnInit(): void { this.examService.getExams().subscribe(e => this.exams = e); }

  selectExam(exam: Exam): void {
    this.selectedExam = exam;
    this.showMarksEntry = false;
    this.examService.getMarksByExam(exam.id).subscribe(m => this.marks = m);
  }

  openMarksEntry(): void {
    this.showMarksEntry = true;
    this.marksSubject = 'Mathematics';
    this.marksEntryStudents = [
      { id: 's4', name: 'Sofia Martinez', marks: '', maxMarks: 100 },
      { id: 's12', name: 'Emma Chen', marks: '', maxMarks: 100 },
      { id: 's13', name: 'Aiden Murphy', marks: '', maxMarks: 100 },
      { id: 's14', name: 'Mia Rodriguez', marks: '', maxMarks: 100 },
      { id: 's15', name: 'Lucas Kim', marks: '', maxMarks: 100 },
      { id: 's16', name: 'Harper Lewis', marks: '', maxMarks: 100 },
      { id: 's8', name: 'Isabella Garcia', marks: '', maxMarks: 100 },
    ];
  }

  saveMarks(): void {
    if (!this.selectedExam) return;
    this.marksSaving = true;
    setTimeout(() => {
      this.marksEntryStudents.forEach(s => {
        if (s.marks !== '' && s.marks !== null) {
          const pct = (s.marks / 100) * 100;
          const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';
          const mark: MarkRecord = { id: 'mnew' + Date.now() + s.id, examId: this.selectedExam!.id, studentId: s.id, studentName: s.name, subjectName: this.marksSubject, marksObtained: s.marks, maxMarks: 100, grade, classId: 'c8', tenantId: 't1' };
          this.marks.push(mark);
        }
      });
      this.marksSaving = false;
      this.showMarksEntry = false;
    }, 1000);
  }

  createExam(): void {
    if (!this.newExam.name) return;
    const exam: Exam = {
      id: 'e' + Date.now(),
      name: this.newExam.name,
      academicYearId: 'ay1',
      startDate: this.newExam.startDate,
      endDate: this.newExam.endDate,
      classIds: ['c5', 'c6', 'c7', 'c8'],
      status: 'upcoming',
      tenantId: 't1'
    };
    this.examService.addExam(exam).subscribe(e => {
      this.exams.push(e);
      this.showCreateModal = false;
      this.newExam = { name: '', startDate: '', endDate: '' };
    });
  }

  getGradeBadge(grade: string): string {
    if (grade.startsWith('A')) return 'badge-success';
    if (grade.startsWith('B')) return 'badge-info';
    if (grade.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  getAutoGrade(marks: number): string {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    return 'D';
  }
}
