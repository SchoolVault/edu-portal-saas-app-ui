import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { ExamService } from '../../core/services/exam.service';
import { StudentService } from '../../core/services/student.service';
import { AcademicYear, Exam, MarkRecord, SchoolClass, Student } from '../../core/models/models';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="exams-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Examinations</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage exams, class scope, and real mark entry workflows</p>
        </div>
        <button class="btn-primary-erp btn-sm" (click)="showCreateModal = true">
          <i class="bi bi-plus-lg"></i> Create Exam
        </button>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-md-6 col-lg-3" *ngFor="let exam of exams">
          <div class="erp-card" style="cursor: pointer;" (click)="selectExam(exam)" [style.border-color]="selectedExam?.id === exam.id ? 'var(--clr-accent)' : ''">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h4 style="font-size: 15px; font-weight: 700;">{{ exam.name }}</h4>
              <span class="badge-erp" [ngClass]="getExamBadge(exam.status)">{{ exam.status }}</span>
            </div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">
              <div><i class="bi bi-calendar3 me-1"></i>{{ exam.startDate }} - {{ exam.endDate }}</div>
              <div><i class="bi bi-book me-1"></i>{{ exam.classIds.length || 0 }} classes</div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedExam" class="erp-card animate-in animate-in-delay-2 mb-4">
        <div class="erp-card-header">
          <h3 class="erp-card-title">{{ selectedExam.name }} - Mark Entry</h3>
        </div>
        <div class="row g-3 align-items-end mb-4">
          <div class="col-md-4">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="loadMarksEntryStudents()">
              <option value="">Select Class</option>
              <option *ngFor="let cls of selectedExamClasses" [value]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="erp-label">Subject</label>
            <input class="erp-input" [(ngModel)]="marksSubject" placeholder="e.g. Mathematics">
          </div>
          <div class="col-md-4">
            <label class="erp-label">Max Marks</label>
            <input class="erp-input" type="number" [(ngModel)]="maxMarks">
          </div>
        </div>

        <div *ngIf="marksEntryStudents.length > 0" class="mb-4">
          <table class="erp-table">
            <thead><tr><th>Student</th><th>Roll No</th><th>Marks</th><th>Grade</th></tr></thead>
            <tbody>
              <tr *ngFor="let student of marksEntryStudents">
                <td><strong>{{ student.firstName }} {{ student.lastName }}</strong></td>
                <td>{{ student.rollNumber }}</td>
                <td><input class="erp-input" type="number" min="0" [max]="maxMarks" [(ngModel)]="marksByStudent[student.id]"></td>
                <td>{{ getAutoGrade(getDraftMark(student.id), maxMarks) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="d-flex justify-content-end mt-3">
            <button class="btn-primary-erp" (click)="saveMarks()" [disabled]="!marksSubject || !selectedClassId || marksSaving">
              <span class="spinner" *ngIf="marksSaving"></span>
              {{ marksSaving ? 'Saving...' : 'Save Marks' }}
            </button>
          </div>
        </div>

        <div *ngIf="marks.length > 0">
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">Recorded Results</h4>
          <table class="erp-table">
            <thead><tr><th>Student</th><th>Subject</th><th>Marks</th><th>Max Marks</th><th>Percentage</th><th>Grade</th></tr></thead>
            <tbody>
              <tr *ngFor="let mark of marks">
                <td><strong>{{ mark.studentName }}</strong></td>
                <td>{{ mark.subjectName }}</td>
                <td>{{ mark.marksObtained }}</td>
                <td>{{ mark.maxMarks }}</td>
                <td>{{ ((mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100).toFixed(1) }}%</td>
                <td><span class="badge-erp" [ngClass]="getGradeBadge(mark.grade)">{{ mark.grade }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>Create New Exam</h3>
          <button class="btn-icon" (click)="showCreateModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="erp-form-group"><label class="erp-label">Exam Name</label><input type="text" class="erp-input" [(ngModel)]="newExam.name"></div>
          <div class="erp-form-group">
            <label class="erp-label">Academic Year</label>
            <select class="erp-select" [(ngModel)]="newExam.academicYearId">
              <option value="">Select Academic Year</option>
              <option *ngFor="let year of academicYears" [value]="year.id">{{ year.name }}</option>
            </select>
          </div>
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Start Date</label><input type="date" class="erp-input" [(ngModel)]="newExam.startDate"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">End Date</label><input type="date" class="erp-input" [(ngModel)]="newExam.endDate"></div></div>
          </div>
          <div class="erp-form-group">
            <label class="erp-label">Classes</label>
            <div class="d-flex flex-wrap gap-2">
              <label *ngFor="let cls of classes" style="display: flex; align-items: center; gap: 8px; background: var(--clr-bg); padding: 8px 12px; border-radius: var(--radius-md);">
                <input type="checkbox" [checked]="newExam.classIds.includes(cls.id)" (change)="toggleClassSelection(cls.id)">
                <span>{{ cls.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="showCreateModal = false">Cancel</button>
          <button class="btn-primary-erp" (click)="createExam()">Create Exam</button>
        </div>
      </div>
    </div>
  `
})
export class ExamsComponent implements OnInit {
  Math = Math;
  exams: Exam[] = [];
  marks: MarkRecord[] = [];
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  selectedExam: Exam | null = null;
  selectedClassId = '';
  showCreateModal = false;
  marksSubject = '';
  maxMarks = 100;
  marksSaving = false;
  marksEntryStudents: Student[] = [];
  marksByStudent: Record<string, number | null> = {};
  newExam = { name: '', academicYearId: '', startDate: '', endDate: '', classIds: [] as string[] };

  constructor(
    private examService: ExamService,
    private academicService: AcademicService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadExams();
  }

  get selectedExamClasses(): SchoolClass[] {
    if (!this.selectedExam) {
      return [];
    }
    return this.classes.filter(cls => this.selectedExam?.classIds.includes(cls.id));
  }

  selectExam(exam: Exam): void {
    this.selectedExam = exam;
    this.selectedClassId = exam.classIds[0] ?? '';
    this.marksSubject = '';
    this.marksByStudent = {};
    this.examService.getMarksByExam(exam.id).subscribe(marks => this.marks = marks);
    this.loadMarksEntryStudents();
  }

  loadMarksEntryStudents(): void {
    if (!this.selectedClassId) {
      this.marksEntryStudents = [];
      return;
    }
    this.studentService.getStudentsByClass(this.selectedClassId).subscribe(students => {
      this.marksEntryStudents = students;
      this.marksByStudent = {};
    });
  }

  toggleClassSelection(classId: string): void {
    if (this.newExam.classIds.includes(classId)) {
      this.newExam.classIds = this.newExam.classIds.filter(id => id !== classId);
      return;
    }
    this.newExam.classIds = [...this.newExam.classIds, classId];
  }

  saveMarks(): void {
    if (!this.selectedExam || !this.selectedClassId || !this.marksSubject) {
      return;
    }
    const payload = this.marksEntryStudents
      .filter(student => this.marksByStudent[student.id] !== null && this.marksByStudent[student.id] !== undefined)
      .map(student => {
        const obtained = Number(this.marksByStudent[student.id]);
        return {
          id: '',
          examId: this.selectedExam!.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          subjectName: this.marksSubject,
          marksObtained: obtained,
          maxMarks: Number(this.maxMarks),
          grade: this.getAutoGrade(obtained, this.maxMarks),
          classId: this.selectedClassId,
          tenantId: ''
        } as MarkRecord;
      });
    if (!payload.length) {
      return;
    }
    this.marksSaving = true;
    this.examService.saveMarks(this.selectedExam.id, payload).subscribe({
      next: savedMarks => {
        this.marksSaving = false;
        this.marks = [...this.marks.filter(mark => !(mark.subjectName === this.marksSubject && mark.classId === this.selectedClassId)), ...savedMarks];
        this.marksByStudent = {};
      },
      error: () => {
        this.marksSaving = false;
      }
    });
  }

  createExam(): void {
    if (!this.newExam.name || !this.newExam.academicYearId || !this.newExam.classIds.length) {
      return;
    }
    const exam: Exam = {
      id: '',
      name: this.newExam.name,
      academicYearId: this.newExam.academicYearId,
      startDate: this.newExam.startDate,
      endDate: this.newExam.endDate,
      classIds: this.newExam.classIds,
      status: 'upcoming',
      tenantId: ''
    };
    this.examService.addExam(exam).subscribe(createdExam => {
      this.exams = [createdExam, ...this.exams];
      this.showCreateModal = false;
      this.newExam = { name: '', academicYearId: '', startDate: '', endDate: '', classIds: [] };
    });
  }

  getExamBadge(status: string): string {
    if (status === 'completed') return 'badge-success';
    if (status === 'ongoing') return 'badge-warning';
    return 'badge-info';
  }

  getGradeBadge(grade: string): string {
    if (grade.startsWith('A')) return 'badge-success';
    if (grade.startsWith('B')) return 'badge-info';
    if (grade.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  getAutoGrade(marks: number, maxMarks: number): string {
    const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'D';
  }

  getDraftMark(studentId: string): number {
    return Number(this.marksByStudent[studentId] ?? 0);
  }

  private loadReferenceData(): void {
    this.academicService.getAcademicYears().subscribe(years => this.academicYears = years);
    this.academicService.getClasses().subscribe(classes => this.classes = classes);
  }

  private loadExams(): void {
    this.examService.getExams().subscribe(exams => this.exams = exams);
  }
}
