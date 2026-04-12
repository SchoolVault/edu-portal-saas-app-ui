import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { ExamService } from '../../core/services/exam.service';
import { ParentService } from '../../core/services/parent.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { examAppliesToStudent } from '../../core/utils/exam-scope';
import { forkJoin } from 'rxjs';
import {
  AcademicYear,
  Exam,
  ExamClassScope,
  ExamScheduleSlot,
  MarkRecord,
  MarksEntryScopeRow,
  SchoolClass,
  Student
} from '../../core/models/models';
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
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="role !== 'parent'">
            Exam cycles, <strong>class / section scope</strong>, dated <strong>timetable</strong> per subject, and mark entry.
            {{ canEditSchedule ? 'Teachers and admins build timetables; only admins create new exam cycles.' : 'View published schedules and results.' }}
          </p>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="role === 'parent'">
            Choose a child, then pick a <strong>completed</strong> or <strong>ongoing</strong> exam to view <strong>Timetable</strong> and <strong>Results</strong> (when published). <strong>Upcoming</strong> exams are listed but stay closed until the cycle starts.
          </p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshExams()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button *ngIf="canCreateExam" type="button" class="btn-primary-erp btn-sm" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i> Create exam
          </button>
        </div>
      </div>

      <div class="erp-card mb-3 animate-in animate-in-delay-1" *ngIf="role === 'parent'">
        <div class="row g-3 align-items-end">
          <div class="col-md-8">
            <label class="erp-label">Child</label>
            <select
              class="erp-select"
              [(ngModel)]="selectedParentChildId"
              (change)="onParentChildChangeForExams()"
              [disabled]="!parentChildren.length"
            >
              <option [ngValue]="null" *ngIf="parentChildren.length > 1">Select a child…</option>
              <option *ngFor="let c of parentChildren" [ngValue]="c.id">
                {{ c.firstName }} {{ c.lastName }} — {{ c.className || ('Class ' + c.classId) }}
              </option>
            </select>
          </div>
          <p class="text-muted small col-12 mb-0">
            Only exams that apply to the <strong>selected child’s class and section</strong> appear below. List source: <code class="small">GET /parent/exams</code>; per-exam timetable and marks: <code class="small">…/exams/:examId/schedule</code> and <code class="small">…/marks</code>.
          </p>
          <p *ngIf="!parentChildren.length" class="text-warning small col-12 mb-0">No students are linked to your account.</p>
        </div>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1" *ngIf="role !== 'parent' || selectedParentChildId != null">
        <div class="col-md-6 col-lg-3" *ngFor="let exam of examGridList">
          <div
            class="erp-card exam-card-pick h-100"
            [class.exam-card-pick--disabled]="role === 'parent' && !parentExamIsOpenable(exam)"
            [class.exam-card-active]="selectedExam?.id === exam.id"
            (click)="onExamCardClick(exam)"
          >
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

      <div *ngIf="role === 'parent' && parentChildren.length && selectedParentChildId == null" class="erp-card mb-4 animate-in text-muted small">
        Select a child above to see their exams.
      </div>

      <div *ngIf="role === 'parent' && selectedParentChildId != null && !examGridList.length" class="erp-card mb-4 animate-in empty-state">
        <h3>No exams for this child</h3>
        <p class="small mb-0 text-muted">When the school schedules assessments for this class or section, they will appear here.</p>
      </div>

      <div *ngIf="selectedExam" class="erp-card animate-in animate-in-delay-2 mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h3 class="erp-card-title mb-1">{{ selectedExam.name }}</h3>
            <p class="text-muted small mb-0">{{ scopeSummary(selectedExam) }}</p>
          </div>
          <div class="erp-tabs" style="margin: 0;" *ngIf="role === 'parent'">
            <button type="button" class="erp-tab" [class.active]="parentDetailTab === 'timetable'" (click)="parentDetailTab = 'timetable'">Timetable</button>
            <button
              type="button"
              class="erp-tab"
              [class.active]="parentDetailTab === 'results'"
              [disabled]="!selectedExam.resultsPublished"
              [title]="!selectedExam.resultsPublished ? 'School has not published results for this exam yet.' : ''"
              (click)="selectedExam.resultsPublished && (parentDetailTab = 'results')"
            >
              Results
            </button>
          </div>
          <div class="erp-tabs" style="margin: 0;" *ngIf="canEnterMarks">
            <button type="button" class="erp-tab" [class.active]="detailTab === 'marks'" (click)="detailTab = 'marks'">Marks</button>
            <button type="button" class="erp-tab" [class.active]="detailTab === 'timetable'" (click)="onTimetableTab()">Timetable</button>
          </div>
        </div>

        <ng-container *ngIf="role === 'parent' && selectedExam && parentDetailTab === 'results'">
          <p *ngIf="!selectedExam.resultsPublished" class="text-muted small">Results are not published yet.</p>
          <table class="erp-table" *ngIf="selectedExam.resultsPublished && marks.length">
            <thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th></tr></thead>
            <tbody>
              <tr *ngFor="let mark of marks">
                <td><strong>{{ mark.subjectName }}</strong></td>
                <td>{{ mark.marksObtained }}</td>
                <td>{{ mark.maxMarks }}</td>
                <td>{{ ((mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100).toFixed(1) }}%</td>
                <td><span class="badge-erp" [ngClass]="getGradeBadge(mark.grade)">{{ mark.grade }}</span></td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="selectedExam.resultsPublished && !marks.length" class="text-muted small mb-0">No mark rows for your child in this exam yet.</p>
        </ng-container>

        <ng-container *ngIf="detailTab === 'marks' && canEnterMarks">
          <div class="row g-3 align-items-end mb-3">
            <div class="col-md-4">
              <label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassOrSectionChange()">
                <option [ngValue]="null">Select class</option>
                <option *ngFor="let cls of marksClassOptions" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4" *ngIf="sectionsForMarksEntry.length">
              <label class="erp-label">Section</label>
              <select class="erp-select" [(ngModel)]="marksSectionId" (change)="onClassOrSectionChange()">
                <option [ngValue]="null">All sections in class</option>
                <option *ngFor="let sec of sectionsForMarksEntry" [ngValue]="sec.id">{{ sec.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">Subject</label>
              <select *ngIf="teacherMarksScopeActive && subjectSelectOptions.length" class="erp-select" [(ngModel)]="marksSubject">
                <option value="">Select subject</option>
                <option *ngFor="let s of subjectSelectOptions" [ngValue]="s">{{ s }}</option>
              </select>
              <input *ngIf="!teacherMarksScopeActive || !subjectSelectOptions.length" class="erp-input" [(ngModel)]="marksSubject" placeholder="e.g. Mathematics">
            </div>
            <div class="col-md-4">
              <label class="erp-label">Max marks</label>
              <input class="erp-input" type="number" [(ngModel)]="maxMarks">
            </div>
          </div>
          <p *ngIf="sectionHint" class="small text-muted mb-2">{{ sectionHint }}</p>
          <div *ngIf="teacherMarksScopeActive && marksScopeRows.length" class="erp-alert info small mb-3" style="padding: 10px 12px;">
            <strong>Your mark-entry scope</strong> (from subject assignments):
            <span *ngFor="let r of marksScopeRows; let last = last" class="ms-1">
              {{ className(r.classId) }}<ng-container *ngIf="r.sectionId != null"> · sec {{ sectionName(r.classId, r.sectionId) }}</ng-container> · {{ r.subjectName }}<span *ngIf="!last">;</span>
            </span>
          </div>
          <p *ngIf="marksScopeError" class="small text-warning mb-2">{{ marksScopeError }}</p>

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

        <ng-container *ngIf="role === 'parent' && parentDetailTab === 'timetable'">
          <p class="text-muted small mb-3">Published papers for this exam (read-only).</p>
          <div class="table-responsive mb-3" *ngIf="scheduleDraft.length">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Date</th><th>Start</th><th>End</th><th>Subject</th><th>Class</th><th>Section</th><th>Room</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of scheduleDraft">
                  <td>{{ row.examDate }}</td>
                  <td>{{ formatSlotTime(row.startTime) }}</td>
                  <td>{{ formatSlotTime(row.endTime) }}</td>
                  <td><strong>{{ row.subjectName }}</strong></td>
                  <td>{{ className(row.classId) }}</td>
                  <td>{{ row.sectionId != null ? sectionName(row.classId, row.sectionId) : 'All' }}</td>
                  <td>{{ row.room?.trim() ? row.room : '—' }}</td>
                  <td>{{ row.notes?.trim() ? row.notes : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="scheduleUiMessage && scheduleDraft.length === 0" class="small mb-2" [class.text-danger]="scheduleUiError">{{ scheduleUiMessage }}</p>
          <p *ngIf="!scheduleDraft.length" class="text-muted small mb-0">No timetable published for this exam yet.</p>
        </ng-container>

        <ng-container *ngIf="role !== 'parent' && detailTab === 'timetable'">
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
      .exam-card-pick { transition: border-color 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
      .exam-card-pick--disabled { cursor: not-allowed; opacity: 0.62; pointer-events: none; }
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
  marksScopeRows: MarksEntryScopeRow[] = [];
  marksScopeError = '';
  parentChildren: Student[] = [];
  selectedParentChildId: number | null = null;
  parentDetailTab: 'timetable' | 'results' = 'timetable';

  constructor(
    private examService: ExamService,
    private academicService: AcademicService,
    private studentService: StudentService,
    private parentService: ParentService,
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

  /** Teacher with at least one scoped class/subject from API */
  get teacherMarksScopeActive(): boolean {
    return this.role === 'teacher' && this.marksScopeRows.length > 0;
  }

  /** Staff: all exams. Parent: exams whose scope includes the selected child’s class/section. */
  get examGridList(): Exam[] {
    if (this.role !== 'parent') {
      return this.exams;
    }
    return this.parentFilteredExams;
  }

  get parentFilteredExams(): Exam[] {
    if (this.selectedParentChildId == null) {
      return [];
    }
    const st = this.parentChildren.find(c => c.id === this.selectedParentChildId);
    if (!st) {
      return [];
    }
    return this.exams.filter(e => examAppliesToStudent(e, st));
  }

  parentExamIsOpenable(exam: Exam): boolean {
    return (exam.status ?? '').toLowerCase() !== 'upcoming';
  }

  onExamCardClick(exam: Exam): void {
    if (this.role === 'parent' && !this.parentExamIsOpenable(exam)) {
      return;
    }
    this.selectExam(exam);
  }

  get marksClassOptions(): SchoolClass[] {
    if (!this.teacherMarksScopeActive) {
      return this.selectedExamClasses;
    }
    const allow = new Set(this.marksScopeRows.map(r => r.classId));
    return this.selectedExamClasses.filter(c => allow.has(c.id));
  }

  get sectionsForMarksEntry(): SectionLite[] {
    if (!this.teacherMarksScopeActive || this.selectedClassId == null) {
      return this.sectionsForSelectedClass;
    }
    const scoped = this.marksScopeRows.filter(r => r.classId === this.selectedClassId);
    const explicitSecs = scoped.map(r => r.sectionId).filter((id): id is number => id != null);
    if (!explicitSecs.length) {
      return this.sectionsForSelectedClass;
    }
    const want = new Set(explicitSecs);
    return this.sectionsForSelectedClass.filter(s => want.has(s.id));
  }

  get subjectSelectOptions(): string[] {
    const rows = this.marksScopeFiltered;
    const set = new Set(rows.map(r => r.subjectName?.trim()).filter((s): s is string => !!s));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  get marksScopeFiltered(): MarksEntryScopeRow[] {
    if (!this.selectedExam || this.selectedClassId == null) {
      return [];
    }
    return this.marksScopeRows.filter(r => {
      if (r.classId !== this.selectedClassId) {
        return false;
      }
      if (r.sectionId == null) {
        return true;
      }
      return this.marksSectionId == null || r.sectionId === this.marksSectionId;
    });
  }

  ngOnInit(): void {
    if (this.role === 'parent') {
      this.detailTab = 'timetable';
      forkJoin({
        children: this.parentService.getChildren(),
        exams: this.examService.getParentPortalExams()
      }).subscribe(({ children, exams }) => {
        this.parentChildren = children ?? [];
        this.classes = this.buildSyntheticClassesFromChildren(this.parentChildren);
        this.selectedParentChildId =
          this.parentChildren.length === 1 ? (this.parentChildren[0]?.id ?? null) : null;
        this.exams = exams;
        this.clearParentSelectionIfExamInvisible();
      });
      return;
    }
    this.loadReferenceData();
    this.loadExams();
  }

  onParentChildChangeForExams(): void {
    if (this.role === 'parent' && this.selectedParentChildId == null) {
      this.selectedExam = null;
      this.scheduleDraft = [];
      this.marks = [];
      return;
    }
    this.clearParentSelectionIfExamInvisible();
    const ex = this.selectedExam;
    if (ex && this.role === 'parent') {
      this.selectExam(ex);
    }
  }

  private clearParentSelectionIfExamInvisible(): void {
    if (this.role !== 'parent' || !this.selectedExam) {
      return;
    }
    const visible = new Set(this.parentFilteredExams.map(e => e.id));
    if (!visible.has(this.selectedExam.id)) {
      this.selectedExam = null;
      this.scheduleDraft = [];
      this.marks = [];
    }
  }

  private buildSyntheticClassesFromChildren(children: Student[]): SchoolClass[] {
    const byClass = new Map<
      number,
      { name: string; sections: Map<number, { id: number; name: string; classId: number; capacity: number; studentCount: number }> }
    >();
    const tenantId = children[0]?.tenantId ?? '';
    for (const ch of children) {
      const cid = ch.classId;
      if (!byClass.has(cid)) {
        byClass.set(cid, { name: ch.className?.trim() || `Class ${cid}`, sections: new Map() });
      }
      if (ch.sectionId > 0) {
        byClass.get(cid)!.sections.set(ch.sectionId, {
          id: ch.sectionId,
          name: ch.sectionName?.trim() || `Section`,
          classId: cid,
          capacity: 0,
          studentCount: 0
        });
      }
    }
    return [...byClass.entries()]
      .map(([id, v]) => ({
        id,
        name: v.name,
        grade: 0,
        sections: [...v.sections.values()],
        academicYearId: 0,
        tenantId
      }))
      .sort((a, b) => a.id - b.id);
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
    this.marksScopeRows = [];
    this.marksScopeError = '';
    this.scheduleUiMessage = '';
    this.scheduleUiError = false;
    this.detailTab = this.canEnterMarks ? 'marks' : 'timetable';
    if (this.role === 'parent') {
      this.parentDetailTab = 'timetable';
      const sid = this.selectedParentChildId;
      if (sid == null) {
        this.marks = [];
        this.scheduleDraft = (exam.scheduleSlots ?? []).map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        return;
      }
      this.parentService.getChildExamMarks(sid, exam.id).subscribe(m => (this.marks = m));
      this.parentService.getChildExamSchedule(sid, exam.id).subscribe({
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
          this.scheduleUiMessage =
            'Could not load this exam’s timetable from the server; showing any rows bundled with the exam list.';
          this.scheduleUiError = true;
        }
      });
      return;
    }
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
    if (this.canEnterMarks) {
      this.loadMarksEntryStudents();
    }
    if (this.canEnterMarks && this.role === 'teacher') {
      this.examService.getMarksEntryScope(exam.id).subscribe({
        next: rows => {
          this.marksScopeRows = rows ?? [];
          this.applyMarksScopeDefaults();
        },
        error: () => {
          this.marksScopeRows = [];
          this.marksScopeError =
            'Could not load your marks-entry scope from the server. You may still try to save; the API will reject unauthorized subjects.';
        }
      });
    }
  }

  className(classId: number | undefined): string {
    if (classId == null) {
      return '—';
    }
    return this.classes.find(c => c.id === classId)?.name ?? 'Class ' + classId;
  }

  /** HH:MM for API values like "09:00:00". */
  formatSlotTime(t: string | undefined): string {
    if (!t?.trim()) {
      return '—';
    }
    const parts = t.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
  }

  sectionName(classId: number | undefined, sectionId: number): string {
    if (classId == null) {
      return String(sectionId);
    }
    const cls = this.classes.find(c => c.id === classId);
    return cls?.sections?.find(s => s.id === sectionId)?.name ?? String(sectionId);
  }

  private applyMarksScopeDefaults(): void {
    if (!this.teacherMarksScopeActive || !this.selectedExam) {
      return;
    }
    const allow = new Set(this.marksScopeRows.map(r => r.classId));
    if (this.selectedClassId != null && !allow.has(this.selectedClassId)) {
      const pick = this.selectedExamClasses.find(c => allow.has(c.id));
      this.selectedClassId = pick?.id ?? this.selectedClassId;
    }
    if (this.selectedClassId == null) {
      const first = this.marksClassOptions[0];
      this.selectedClassId = first?.id ?? null;
    }
    this.onClassOrSectionChange();
  }

  onTimetableTab(): void {
    this.detailTab = 'timetable';
    if (this.role === 'parent') {
      this.parentDetailTab = 'timetable';
    }
    if (!this.selectedExam) return;
    const ex = this.selectedExam;
    if (this.role === 'parent') {
      const sid = this.selectedParentChildId;
      if (sid == null) {
        return;
      }
      this.parentService.getChildExamSchedule(sid, ex.id).subscribe({
        next: slots => {
          const list = slots.length ? slots : (ex.scheduleSlots ?? []);
          this.scheduleDraft = list.map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        },
        error: () => {
          this.scheduleDraft = (ex.scheduleSlots ?? []).map(s => ({ ...s, sectionId: s.sectionId ?? null }));
        }
      });
      return;
    }
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
    if (!grade?.trim()) return 'badge-neutral';
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
    if (this.role === 'parent') {
      forkJoin({
        children: this.parentService.getChildren(),
        exams: this.examService.getParentPortalExams()
      }).subscribe(({ children, exams }) => {
        this.parentChildren = children ?? [];
        this.classes = this.buildSyntheticClassesFromChildren(this.parentChildren);
        if (
          this.selectedParentChildId != null &&
          !this.parentChildren.some(c => c.id === this.selectedParentChildId)
        ) {
          this.selectedParentChildId =
            this.parentChildren.length === 1 ? (this.parentChildren[0]?.id ?? null) : null;
        }
        this.exams = exams;
        this.clearParentSelectionIfExamInvisible();
        if (this.selectedExam) {
          const sid = this.selectedExam.id;
          const next = exams.find(e => e.id === sid);
          if (next) {
            this.selectExam(next);
          }
        }
      });
      return;
    }
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
