import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { ExamService } from '../../core/services/exam.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { AcademicYear, Exam, ExamClassScope, ExamScheduleSlot, MarkRecord, SchoolClass, Student } from '../../core/models/models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';

type ExamDetailTab = 'marks' | 'timetable';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent],
  template: `
    <div data-testid="exams-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Examinations</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            Exam cycles, <strong>class / section scope</strong>, dated <strong>timetable</strong> per subject, and mark entry.
            {{ canEditSchedule ? 'Teachers and admins build timetables; only admins create new exam cycles.' : 'View published schedules and results.' }}
          </p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshExams()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button *ngIf="canCreateExam" type="button" class="btn-primary-erp btn-sm" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i> Create exam
          </button>
        </div>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-md-6 col-lg-3" *ngFor="let exam of exams">
          <div class="erp-card exam-card-pick h-100" style="cursor: pointer;" (click)="selectExam(exam)" [class.exam-card-active]="selectedExam?.id === exam.id">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h4 style="font-size: 15px; font-weight: 700;">{{ exam.name }}</h4>
              <span class="badge-erp" [ngClass]="getExamBadge(exam.status)">{{ exam.status }}</span>
            </div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">
              <div><i class="bi bi-calendar3 me-1"></i>{{ exam.startDate }} → {{ exam.endDate }}</div>
              <div class="mt-1"><i class="bi bi-people me-1"></i>{{ scopeSummary(exam) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedExam" class="erp-card animate-in animate-in-delay-2 mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h3 class="erp-card-title mb-1">{{ selectedExam.name }}</h3>
            <p class="text-muted small mb-0">{{ scopeSummary(selectedExam) }}</p>
          </div>
          <div class="erp-tabs" style="margin: 0;">
            <button type="button" class="erp-tab" *ngIf="canEnterMarks" [class.active]="detailTab === 'marks'" (click)="detailTab = 'marks'">Marks</button>
            <button type="button" class="erp-tab" [class.active]="detailTab === 'timetable'" (click)="onTimetableTab()">Timetable</button>
          </div>
        </div>

        <ng-container *ngIf="detailTab === 'marks' && canEnterMarks">
          <div class="row g-3 align-items-end mb-3">
            <div class="col-md-4">
              <label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassOrSectionChange()">
                <option [ngValue]="null">Select class</option>
                <option *ngFor="let cls of selectedExamClasses" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4" *ngIf="sectionsForSelectedClass.length">
              <label class="erp-label">Section</label>
              <select class="erp-select" [(ngModel)]="marksSectionId" (change)="onClassOrSectionChange()">
                <option [ngValue]="null">All sections in class</option>
                <option *ngFor="let sec of sectionsForSelectedClass" [ngValue]="sec.id">{{ sec.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">Subject</label>
              <input class="erp-input" [(ngModel)]="marksSubject" placeholder="e.g. Mathematics">
            </div>
            <div class="col-md-4">
              <label class="erp-label">Max marks</label>
              <input class="erp-input" type="number" [(ngModel)]="maxMarks">
            </div>
          </div>
          <p *ngIf="sectionHint" class="small text-muted mb-2">{{ sectionHint }}</p>

          <div *ngIf="marksEntryStudents.length > 0" class="mb-4">
            <table class="erp-table">
              <thead><tr><th>Student</th><th>Roll</th><th>Marks</th><th>Grade</th></tr></thead>
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
              <button type="button" class="btn-primary-erp" (click)="saveMarks()" [disabled]="!marksSubject || selectedClassId == null || marksSaving">
                {{ marksSaving ? 'Saving…' : 'Save marks' }}
              </button>
            </div>
          </div>

          <div *ngIf="marks.length > 0">
            <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">Recorded results</h4>
            <table class="erp-table">
              <thead><tr><th>Student</th><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th></tr></thead>
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
        </ng-container>

        <ng-container *ngIf="detailTab === 'timetable'">
          <p class="text-muted small mb-3">
            Each row is one paper: date, time window, class (and optional section), room and notes.
          </p>
          <div class="table-responsive mb-3" *ngIf="scheduleDraft.length || canEditSchedule">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Date</th><th>Start</th><th>End</th><th>Subject</th><th>Class</th><th>Section</th><th>Room</th><th>Notes</th>
                  <th *ngIf="canEditSchedule"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of scheduleDraft; let i = index">
                  <td><app-erp-date-picker [(ngModel)]="row.examDate" [ngModelOptions]="{standalone: true}" [disabled]="!canEditSchedule" placeholder="Exam date" /></td>
                  <td><input type="time" class="erp-input" [(ngModel)]="row.startTime" [disabled]="!canEditSchedule"></td>
                  <td><input type="time" class="erp-input" [(ngModel)]="row.endTime" [disabled]="!canEditSchedule"></td>
                  <td><input class="erp-input" [(ngModel)]="row.subjectName" [disabled]="!canEditSchedule"></td>
                  <td>
                    <select class="erp-select" [(ngModel)]="row.classId" (change)="onScheduleRowClass(row)" [disabled]="!canEditSchedule">
                      <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
                    </select>
                  </td>
                  <td>
                    <select class="erp-select" [(ngModel)]="row.sectionId" [disabled]="!canEditSchedule">
                      <option [ngValue]="null">All sections</option>
                      <option *ngFor="let s of sectionsForClass(row.classId)" [ngValue]="s.id">{{ s.name }}</option>
                    </select>
                  </td>
                  <td><input class="erp-input" [(ngModel)]="row.room" [disabled]="!canEditSchedule"></td>
                  <td><input class="erp-input" [(ngModel)]="row.notes" [disabled]="!canEditSchedule"></td>
                  <td *ngIf="canEditSchedule">
                    <button type="button" class="btn-icon" (click)="removeScheduleRow(i)" title="Remove"><i class="bi bi-x-lg"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-flex gap-2 flex-wrap" *ngIf="canEditSchedule">
            <button type="button" class="btn-outline-erp btn-sm" (click)="addScheduleRow()"><i class="bi bi-plus-lg"></i> Add slot</button>
            <button type="button" class="btn-primary-erp btn-sm" (click)="saveSchedule()" [disabled]="scheduleSaving">Save timetable</button>
          </div>
          <p *ngIf="scheduleUiMessage" class="small mt-2 mb-0" [class.text-danger]="scheduleUiError" [class.text-success]="!scheduleUiError">{{ scheduleUiMessage }}</p>
          <p *ngIf="!scheduleDraft.length && !canEditSchedule" class="text-muted small">No timetable published for this exam yet.</p>
        </ng-container>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal-content-erp modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>Create exam</h3>
          <button type="button" class="btn-icon" (click)="showCreateModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="erp-form-group"><label class="erp-label">Exam name</label><input type="text" class="erp-input" [(ngModel)]="newExam.name"></div>
          <div class="erp-form-group">
            <label class="erp-label">Academic year</label>
            <select class="erp-select" [(ngModel)]="newExam.academicYearId">
              <option [ngValue]="null">Select year</option>
              <option *ngFor="let year of academicYears" [ngValue]="year.id">{{ year.name }}</option>
            </select>
          </div>
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Start</label><app-erp-date-picker [(ngModel)]="newExam.startDate" placeholder="Start" /></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">End</label><app-erp-date-picker [(ngModel)]="newExam.endDate" placeholder="End" /></div></div>
          </div>
          <div class="erp-form-group">
            <label class="erp-label">Classes &amp; sections</label>
            <p class="small text-muted">Pick classes included in this exam. For each class, choose <strong>All sections</strong> or one section (classes without sections stay “All”).</p>
            <div *ngFor="let cls of classes" class="mb-2 p-2 rounded-3" style="border: 1px solid var(--clr-border-light); background: var(--clr-surface-muted);">
              <label class="d-flex align-items-center gap-2 mb-2">
                <input type="checkbox" [checked]="newExam.classIds.includes(cls.id)" (change)="toggleClassSelection(cls.id)">
                <span style="font-weight: 700;">{{ cls.name }}</span>
              </label>
              <div *ngIf="newExam.classIds.includes(cls.id)" class="ps-4">
                <label class="erp-label small">Audience</label>
                <select class="erp-select" [(ngModel)]="sectionChoiceByClass[cls.id]">
                  <option [ngValue]="null">All sections (whole class)</option>
                  <option *ngFor="let sec of cls.sections" [ngValue]="sec.id">Section {{ sec.name }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="showCreateModal = false">Cancel</button>
          <button type="button" class="btn-primary-erp" (click)="createExam()">Create</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .exam-card-pick { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
      .exam-card-active { border-color: var(--clr-accent) !important; box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-accent) 35%, transparent); }
    `
  ]
})
export class ExamsComponent implements OnInit {
  Math = Math;
  exams: Exam[] = [];
  marks: MarkRecord[] = [];
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  selectedExam: Exam | null = null;
  selectedClassId: number | null = null;
  marksSectionId: number | null = null;
  showCreateModal = false;
  detailTab: ExamDetailTab = 'marks';
  marksSubject = '';
  maxMarks = 100;
  marksSaving = false;
  scheduleSaving = false;
  scheduleUiMessage = '';
  scheduleUiError = false;
  marksEntryStudents: Student[] = [];
  marksByStudent: Record<number, number | null> = {};
  newExam = {
    name: '',
    academicYearId: null as number | null,
    startDate: '',
    endDate: '',
    classIds: [] as number[]
  };
  sectionChoiceByClass: Record<number, number | null> = {};
  scheduleDraft: ExamScheduleSlot[] = [];

  constructor(
    private examService: ExamService,
    private academicService: AcademicService,
    private studentService: StudentService,
    private auth: AuthService
  ) {}

  get role(): string {
    return (this.auth.getRole() || '').toLowerCase();
  }

  get canCreateExam(): boolean {
    return this.role === 'admin' || this.role === 'super_admin';
  }

  get canEnterMarks(): boolean {
    return this.role === 'admin' || this.role === 'teacher' || this.role === 'super_admin';
  }

  get canEditSchedule(): boolean {
    return this.role === 'admin' || this.role === 'teacher' || this.role === 'super_admin';
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadExams();
    if (this.role === 'parent') {
      this.detailTab = 'timetable';
    }
  }

  scopeSummary(exam: Exam): string {
    const scopes = exam.classScopes?.length
      ? exam.classScopes
      : (exam.classIds ?? []).map(cid => ({ classId: cid, sectionId: null as number | null }));
    if (!scopes.length) return 'No classes';
    const parts = scopes.map(s => {
      const cls = this.classes.find(c => c.id === s.classId);
      const apiName = 'className' in s ? s.className : undefined;
      const name = cls?.name || apiName || 'Class';
      if (s.sectionId == null) return `${name} · all sections`;
      const sec = cls?.sections?.find(x => x.id === s.sectionId);
      const secApi = 'sectionName' in s ? s.sectionName : undefined;
      return `${name} · ${sec?.name || secApi || 'section'}`;
    });
    return parts.slice(0, 3).join(' · ') + (parts.length > 3 ? ` +${parts.length - 3}` : '');
  }

  get selectedExamClasses(): SchoolClass[] {
    if (!this.selectedExam) return [];
    const ids = new Set(this.selectedExam.classIds ?? []);
    return this.classes.filter(cls => ids.has(cls.id));
  }

  get sectionsForSelectedClass(): SectionLite[] {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  sectionsForClass(classId: number): SectionLite[] {
    const cls = this.classes.find(c => c.id === classId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  get sectionHint(): string {
    if (!this.selectedExam || this.selectedClassId == null) return '';
    const scoped = this.selectedExam.classScopes?.filter(s => s.classId === this.selectedClassId) ?? [];
    if (!scoped.length) return '';
    const onlySections = scoped.map(s => s.sectionId).filter((x): x is number => x != null);
    if (!onlySections.length) return '';
    if (onlySections.length === 1 && this.marksSectionId == null) {
      return 'This exam targets one section for this class — pick that section above for mark entry.';
    }
    return '';
  }

  openCreateModal(): void {
    this.newExam = { name: '', academicYearId: null, startDate: '', endDate: '', classIds: [] };
    this.sectionChoiceByClass = {};
    this.showCreateModal = true;
  }

  selectExam(exam: Exam): void {
    this.selectedExam = exam;
    this.selectedClassId = exam.classIds[0] ?? null;
    this.marksSectionId = null;
    this.marksSubject = '';
    this.marksByStudent = {};
    this.scheduleUiMessage = '';
    this.scheduleUiError = false;
    this.detailTab = this.canEnterMarks ? 'marks' : 'timetable';
    this.examService.getMarksByExam(exam.id).subscribe(m => (this.marks = m));
    this.examService.getSchedule(exam.id).subscribe({
      next: slots => {
        const list = slots.length ? slots : (exam.scheduleSlots ?? []);
        this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        if (this.selectedExam && this.selectedExam.id === exam.id) {
          this.selectedExam.scheduleSlots = [...list];
        }
      },
      error: () => {
        const list = exam.scheduleSlots ?? [];
        this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        this.scheduleUiMessage = 'Could not load timetable from the server; showing any rows bundled with the exam list.';
        this.scheduleUiError = true;
      }
    });
    this.loadMarksEntryStudents();
  }

  onTimetableTab(): void {
    this.detailTab = 'timetable';
    if (!this.selectedExam) return;
    const ex = this.selectedExam;
    this.examService.getSchedule(ex.id).subscribe({
      next: slots => {
        const list = slots.length ? slots : (ex.scheduleSlots ?? []);
        this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
      },
      error: () => {
        this.scheduleDraft = (ex.scheduleSlots ?? []).map(s => ({ ...s, sectionId: s.sectionId ?? null }));
      }
    });
  }

  onClassOrSectionChange(): void {
    this.loadMarksEntryStudents();
  }

  loadMarksEntryStudents(): void {
    if (this.selectedClassId == null) {
      this.marksEntryStudents = [];
      return;
    }
    const req$ =
      this.marksSectionId != null
        ? this.studentService.getStudentsByClassAndSection(this.selectedClassId, this.marksSectionId)
        : this.studentService.getStudentsByClass(this.selectedClassId);
    req$.subscribe(students => {
      this.marksEntryStudents = students;
      this.marksByStudent = {};
    });
  }

  onScheduleRowClass(row: ExamScheduleSlot): void {
    row.sectionId = null;
  }

  addScheduleRow(): void {
    const cid = this.selectedExam?.classIds[0] ?? this.classes[0]?.id;
    if (cid == null) return;
    const defaultDate = this.selectedExam?.startDate?.trim() || new Date().toISOString().slice(0, 10);
    this.scheduleDraft.push({
      examId: this.selectedExam?.id,
      classId: cid,
      sectionId: null,
      subjectName: '',
      examDate: defaultDate,
      startTime: '09:00',
      endTime: '12:00',
      room: '',
      notes: ''
    });
  }

  removeScheduleRow(i: number): void {
    this.scheduleDraft.splice(i, 1);
  }

  saveSchedule(): void {
    if (!this.selectedExam) return;
    this.scheduleUiMessage = '';
    this.scheduleUiError = false;
    if (this.scheduleDraft.length > 0) {
      for (let i = 0; i < this.scheduleDraft.length; i++) {
        const r = this.scheduleDraft[i];
        const n = i + 1;
        if (r.classId == null) {
          this.scheduleUiMessage = `Row ${n}: select a class.`;
          this.scheduleUiError = true;
          return;
        }
        if (!r.subjectName?.trim()) {
          this.scheduleUiMessage = `Row ${n}: enter a subject.`;
          this.scheduleUiError = true;
          return;
        }
        if (!r.examDate?.trim()) {
          this.scheduleUiMessage = `Row ${n}: pick a date.`;
          this.scheduleUiError = true;
          return;
        }
        if (!r.startTime?.trim() || !r.endTime?.trim()) {
          this.scheduleUiMessage = `Row ${n}: set start and end times.`;
          this.scheduleUiError = true;
          return;
        }
      }
    }
    this.scheduleSaving = true;
    const payload = this.scheduleDraft.map(({ classId, sectionId, subjectName, examDate, startTime, endTime, room, notes }) => ({
      classId: classId as number,
      sectionId: sectionId ?? null,
      subjectName,
      examDate,
      startTime,
      endTime,
      room,
      notes
    }));
    this.examService.replaceSchedule(this.selectedExam.id, payload).subscribe({
      next: rows => {
        this.scheduleDraft = rows.map(r => ({ ...r, sectionId: r.sectionId ?? null }));
        this.selectedExam!.scheduleSlots = [...rows];
        this.scheduleSaving = false;
        this.scheduleUiMessage = 'Timetable saved.';
        this.scheduleUiError = false;
      },
      error: (err: unknown) => {
        this.scheduleSaving = false;
        const http = err as { error?: { message?: string }; message?: string };
        const msg =
          err instanceof Error
            ? err.message
            : (http?.error?.message ?? http?.message ?? 'Save failed');
        this.scheduleUiMessage =
          msg + (String(msg).toLowerCase().includes('network') ? '' : ' — use admin or teacher role; ensure the API is running if not using mocks.');
        this.scheduleUiError = true;
      }
    });
  }

  toggleClassSelection(classId: number): void {
    if (this.newExam.classIds.includes(classId)) {
      this.newExam.classIds = this.newExam.classIds.filter(id => id !== classId);
      delete this.sectionChoiceByClass[classId];
      return;
    }
    this.newExam.classIds = [...this.newExam.classIds, classId];
    this.sectionChoiceByClass[classId] = null;
  }

  createExam(): void {
    if (!this.newExam.name?.trim() || this.newExam.academicYearId == null || !this.newExam.classIds.length) return;
    const classScopes: ExamClassScope[] = this.newExam.classIds.map(cid => ({
      classId: cid,
      sectionId: this.sectionChoiceByClass[cid] ?? null
    }));
    const exam: Exam = {
      id: 0,
      name: this.newExam.name.trim(),
      academicYearId: this.newExam.academicYearId,
      startDate: this.newExam.startDate,
      endDate: this.newExam.endDate,
      classIds: [...this.newExam.classIds],
      classScopes,
      status: 'upcoming',
      tenantId: ''
    };
    this.examService.addExam(exam, classScopes).subscribe(createdExam => {
      this.exams = [createdExam, ...this.exams];
      this.showCreateModal = false;
      this.selectExam(createdExam);
    });
  }

  saveMarks(): void {
    if (!this.selectedExam || this.selectedClassId == null || !this.marksSubject) return;
    const classId = this.selectedClassId;
    const payload = this.marksEntryStudents
      .filter(student => this.marksByStudent[student.id] !== null && this.marksByStudent[student.id] !== undefined)
      .map(student => {
        const obtained = Number(this.marksByStudent[student.id]);
        return {
          id: 0,
          examId: this.selectedExam!.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          subjectName: this.marksSubject,
          marksObtained: obtained,
          maxMarks: Number(this.maxMarks),
          grade: this.getAutoGrade(obtained, this.maxMarks),
          classId,
          tenantId: ''
        } as MarkRecord;
      });
    if (!payload.length) return;
    this.marksSaving = true;
    this.examService.saveMarks(this.selectedExam.id, payload).subscribe({
      next: savedMarks => {
        this.marksSaving = false;
        this.marks = [...this.marks.filter(m => !(m.subjectName === this.marksSubject && m.classId === classId)), ...savedMarks];
        this.marksByStudent = {};
      },
      error: () => {
        this.marksSaving = false;
      }
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

  getDraftMark(studentId: number): number {
    return Number(this.marksByStudent[studentId] ?? 0);
  }

  refreshExams(): void {
    this.academicService.getAcademicYears().subscribe(years => (this.academicYears = years));
    this.academicService.getClasses().subscribe(classes => (this.classes = classes));
    this.examService.getExams().subscribe(exams => {
      this.exams = exams;
      if (this.selectedExam) {
        const sid = this.selectedExam.id;
        const next = exams.find(e => e.id === sid);
        if (next) this.selectExam(next);
      }
    });
  }

  private loadReferenceData(): void {
    this.academicService.getAcademicYears().subscribe(years => (this.academicYears = years));
    this.academicService.getClasses().subscribe(classes => (this.classes = classes));
  }

  private loadExams(): void {
    this.examService.getExams().subscribe(exams => (this.exams = exams));
  }
}

type SectionLite = { id: number; name: string };
