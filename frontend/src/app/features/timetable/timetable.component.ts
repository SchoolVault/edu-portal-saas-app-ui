import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import { AuthService } from '../../core/services/auth.service';
import { SchoolClass, Student, Teacher, TimetableEntry, TimetableGrid } from '../../core/models/models';
import { StudentService } from '../../core/services/student.service';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';

type TimetableEntryForm = Omit<Partial<TimetableEntry>, 'teacherId' | 'classId' | 'sectionId'> & {
  teacherId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
};

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent],
  styles: [`
    .timetable-slot-cell { background: var(--clr-bg); border-radius: var(--radius-md); padding: 8px; min-height: 72px; border: 1px solid var(--clr-border-light); }
    .btn-group-erp .active-layout { background: var(--clr-primary); color: #fff; border-color: var(--clr-primary); }
    .timetable-calendar td { vertical-align: top; }
    .timetable-calendar-week .timetable-slot-cell { background: linear-gradient(145deg, var(--clr-surface-alt), var(--clr-bg)); min-height: 88px; }
    .classic-wrap .timetable-slot-cell { box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .timetable-slot--cover { border-color: color-mix(in srgb, var(--clr-info) 35%, var(--clr-border-light)); background: color-mix(in srgb, var(--clr-info) 8%, var(--clr-bg)); }
  `],
  template: `
    <div data-testid="timetable-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Timetable</h2>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="!isParent">Manage class schedules, teachers, rooms, and period allocations</p>
          <p class="text-muted mb-0" style="font-size: 13px;" *ngIf="isParent">View your children’s class timetable (read-only).</p>
        </div>
        <div class="d-flex gap-2 flex-wrap align-items-center">
          <div class="btn-group-erp d-flex gap-1" *ngIf="isAdmin">
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="scheduleScope === 'class'" (click)="setScheduleScope('class')">By class</button>
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="scheduleScope === 'teacher'" (click)="setScheduleScope('teacher')">By teacher</button>
          </div>
          <div class="btn-group-erp d-flex gap-1">
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="layout === 'dayRows'" (click)="layout = 'dayRows'">Classic grid</button>
            <button type="button" class="btn-outline-erp btn-sm" [class.active-layout]="layout === 'periodRows'" (click)="layout = 'periodRows'">Week matrix</button>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshTimetable()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button *ngIf="canMutateTimetable" class="btn-primary-erp btn-sm" [disabled]="!canEditTimetable()" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i> Add Slot
          </button>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in" *ngIf="isParent">
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="erp-label">Child</label>
            <select class="erp-select" [(ngModel)]="selectedChildId" (change)="onParentChildChange()">
              <option [ngValue]="null">Select child</option>
              <option *ngFor="let ch of myChildren" [ngValue]="ch.id">{{ ch.firstName }} {{ ch.lastName }} — {{ ch.className }} {{ ch.sectionName }}</option>
            </select>
          </div>
          <p class="text-muted small col-12 mb-0">Timetable updates are done by a school administrator.</p>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in" *ngIf="!isParent">
        <div class="row g-3 align-items-end" *ngIf="scheduleScope === 'class'">
          <div class="col-md-3">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
              <option [ngValue]="null">Select Class</option>
              <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-3" *ngIf="sections.length">
            <label class="erp-label">Section</label>
            <select class="erp-select" [(ngModel)]="selectedSectionId" (change)="loadTimetable()">
              <option [ngValue]="null">Select Section</option>
              <option *ngFor="let sec of sections" [ngValue]="sec.id">{{ sec.name }}</option>
            </select>
          </div>
        </div>
        <div class="row g-3 align-items-end" *ngIf="scheduleScope === 'teacher'">
          <div class="col-md-4">
            <label class="erp-label">Teacher</label>
            <select
              class="erp-select"
              [(ngModel)]="selectedTeacherId"
              (change)="onTeacherChange()"
              [disabled]="isTeacherViewer"
            >
              <option [ngValue]="null">Select teacher</option>
              <option *ngFor="let t of teachers" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="erp-label">Session date</label>
            <app-erp-date-picker
              [(ngModel)]="teacherViewDate"
              (ngModelChange)="onTeacherViewDateChange()"
              placeholder="Date for cover merge"
            />
          </div>
          <p class="text-muted small col-12 mb-0">
            <ng-container *ngIf="isAdmin">Pick a date to include <strong>attendance cover</strong> classes for that day only (does not change the master timetable).</ng-container>
            <ng-container *ngIf="isTeacherViewer">Your cover assignments for the selected date appear as <span class="badge-erp badge-info" style="font-size:10px;">Cover</span> slots.</ng-container>
            <ng-container *ngIf="!isAdmin && !isTeacherViewer && !isParent">Teachers can view schedules; only an administrator can add or change slots.</ng-container>
          </p>
        </div>
        <p *ngIf="scheduleScope === 'class' && selectedClassId && !sections.length" class="text-muted small mt-2 mb-0">
          This class has no sections — the timetable applies to the entire class.
        </p>
        <p *ngIf="scheduleScope === 'class' && selectedClassId && sections.length && !selectedSectionId" class="text-muted small mt-2 mb-0">
          Select a section to load this class timetable.
        </p>
        <p *ngIf="scheduleScope === 'teacher' && isAdmin && selectedTeacherId" class="text-muted small mt-2 mb-0">
          Showing all slots for this teacher across classes. Add slot picks class/section in the form.
        </p>
      </div>

      <div class="erp-card mb-4 classic-wrap animate-in" *ngIf="grid?.days?.length && layout === 'dayRows'">
        <div style="overflow-x: auto;">
          <table class="erp-table">
            <thead>
              <tr>
                <th style="min-width: 120px;">Day / Period</th>
                <th *ngFor="let period of grid?.periods" style="min-width: 180px;">Period {{ period }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of grid?.days">
                <td><strong>{{ day }}</strong></td>
                <td *ngFor="let period of grid?.periods">
                  <ng-container *ngIf="getEntry(day, period) as entry; else emptySlot">
                    <div class="timetable-slot-cell" [class.timetable-slot--cover]="isCoverRow(entry)">
                      <div class="d-flex align-items-center gap-1 flex-wrap mb-1">
                        <span *ngIf="isCoverRow(entry)" class="badge-erp badge-info" style="font-size: 9px; text-transform: uppercase;">Cover</span>
                        <span *ngIf="isCoverRow(entry) && entry.coverForDate" class="text-muted" style="font-size: 10px;">{{ entry.coverForDate }}</span>
                      </div>
                      <div style="font-weight: 700; color: var(--clr-text);">{{ entry.subjectName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-secondary);">{{ entry.teacherName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-muted);">{{ entry.startTime }} - {{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-2 mt-2" *ngIf="canMutateTimetable && !isCoverRow(entry)">
                        <button class="btn-outline-erp btn-xs" (click)="openEditModal(entry)">Edit</button>
                        <button class="btn-outline-erp btn-xs" (click)="deleteEntry(entry.id)">Delete</button>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #emptySlot>
                    <span style="color: var(--clr-text-muted); font-size: 12px;">-</span>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card mb-4 timetable-calendar-week animate-in" *ngIf="grid?.days?.length && layout === 'periodRows'">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h4 class="erp-card-title mb-0" style="font-size: 15px;">Week matrix</h4>
          <span class="text-muted small">Rows = periods · Columns = weekdays</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="erp-table timetable-calendar">
            <thead>
              <tr>
                <th style="min-width: 88px;">Period</th>
                <th *ngFor="let day of grid?.days" style="min-width: 160px;">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let period of grid?.periods">
                <td><strong>P{{ period }}</strong></td>
                <td *ngFor="let day of grid?.days">
                  <ng-container *ngIf="getEntry(day, period) as entry; else emptyCal">
                    <div class="timetable-slot-cell" [class.timetable-slot--cover]="isCoverRow(entry)">
                      <div *ngIf="isCoverRow(entry)" class="mb-1"><span class="badge-erp badge-info" style="font-size: 8px;">Cover</span></div>
                      <div style="font-weight: 700; font-size: 13px;">{{ entry.subjectName }}</div>
                      <div style="font-size: 11px; color: var(--clr-text-secondary);">{{ entry.teacherName }}</div>
                      <div style="font-size: 10px; color: var(--clr-text-muted);">{{ entry.startTime }}-{{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-1 mt-1 flex-wrap" *ngIf="canMutateTimetable && !isCoverRow(entry)">
                        <button class="btn-outline-erp btn-xs" (click)="openEditModal(entry)">Edit</button>
                        <button class="btn-outline-erp btn-xs" (click)="deleteEntry(entry.id)">Del</button>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #emptyCal><span class="text-muted" style="font-size: 11px;">—</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card animate-in py-2 px-3 mb-4" *ngIf="entries.length">
        <button
          type="button"
          class="btn btn-link p-0 text-start w-100 erp-collapse-toggle"
          (click)="showSlotList = !showSlotList"
          [attr.aria-expanded]="showSlotList"
        >
          <span class="me-2"><i class="bi" [ngClass]="showSlotList ? 'bi-chevron-down' : 'bi-chevron-right'"></i></span>
          <strong>Flat slot list</strong>
          <span class="text-muted small ms-2">(optional — same data as the grid; useful for bulk review or export)</span>
        </button>
        <div *ngIf="showSlotList" class="mt-3">
          <table class="erp-table mb-0">
            <thead><tr><th>Day</th><th>Period</th><th>Subject</th><th>Teacher</th><th>Time</th><th>Room</th><th *ngIf="canMutateTimetable">Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let entry of entries">
                <td>{{ entry.day }}</td>
                <td>{{ entry.period }}</td>
                <td>{{ entry.subjectName }}</td>
                <td>{{ entry.teacherName }}</td>
                <td>{{ entry.startTime }} - {{ entry.endTime }}</td>
                <td>{{ entry.room }}</td>
                <td *ngIf="canMutateTimetable">
                  <div class="d-flex gap-1" *ngIf="!isCoverRow(entry)">
                    <button type="button" class="btn-icon" (click)="openEditModal(entry)"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-icon" (click)="deleteEntry(entry.id)"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
                  </div>
                  <span *ngIf="isCoverRow(entry)" class="text-muted small">Cover</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ editingEntryId != null ? 'Edit Slot' : 'Add Slot' }}</h3>
          <button class="btn-icon" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="erp-label">Day</label>
              <select class="erp-select" [(ngModel)]="entryForm.day" [disabled]="editingEntryId != null">
                <option *ngFor="let day of dayOptions" [value]="day">{{ day }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="erp-label">Period</label>
              <input class="erp-input" type="number" [(ngModel)]="entryForm.period" [disabled]="editingEntryId != null">
            </div>
            <div class="col-md-6">
              <label class="erp-label">Subject</label>
              <input class="erp-input" [(ngModel)]="entryForm.subjectName">
            </div>
            <div class="col-md-6">
              <label class="erp-label">Teacher</label>
              <select class="erp-select" [(ngModel)]="entryForm.teacherId" (change)="syncTeacherName()" [disabled]="scheduleScope === 'teacher' && selectedTeacherId != null && editingEntryId == null">
                <option [ngValue]="null">Select Teacher</option>
                <option *ngFor="let teacher of teachers" [ngValue]="teacher.id">{{ teacher.firstName }} {{ teacher.lastName }}</option>
              </select>
            </div>
            <ng-container *ngIf="scheduleScope === 'teacher'">
              <div class="col-md-6">
                <label class="erp-label">Class</label>
                <select class="erp-select" [(ngModel)]="entryForm.classId" (change)="onEntryFormClassChange()">
                  <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="erp-label">Section</label>
                <select class="erp-select" [(ngModel)]="entryForm.sectionId">
                  <option [ngValue]="null">Whole class (no section)</option>
                  <option *ngFor="let sec of entryFormSections" [ngValue]="sec.id">{{ sec.name }}</option>
                </select>
              </div>
            </ng-container>
            <div class="col-md-6">
              <label class="erp-label">Start Time</label>
              <input class="erp-input" type="time" [(ngModel)]="entryForm.startTime">
            </div>
            <div class="col-md-6">
              <label class="erp-label">End Time</label>
              <input class="erp-input" type="time" [(ngModel)]="entryForm.endTime">
            </div>
            <div class="col-md-12">
              <label class="erp-label">Room</label>
              <input class="erp-input" [(ngModel)]="entryForm.room">
            </div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="closeModal()">Cancel</button>
          <button class="btn-primary-erp" (click)="saveEntry()">{{ editingEntryId != null ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `
})
export class TimetableComponent implements OnInit {
  classes: SchoolClass[] = [];
  sections: { id: number; name: string }[] = [];
  teachers: Teacher[] = [];
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;
  selectedTeacherId: number | null = null;
  scheduleScope: 'class' | 'teacher' = 'class';
  isAdmin = false;
  isParent = false;
  /** Only school admins may create/update/delete slots (API enforces the same). */
  canMutateTimetable = false;
  myChildren: Student[] = [];
  selectedChildId: number | null = null;
  entries: TimetableEntry[] = [];
  grid: TimetableGrid | null = null;
  layout: 'dayRows' | 'periodRows' = 'dayRows';
  /** Duplicate flat view of slots; collapsed by default to save vertical space. */
  showSlotList = false;
  showModal = false;
  /** Set when editing an existing slot; null when creating. */
  editingEntryId: number | null = null;
  dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  entryForm: TimetableEntryForm = this.defaultEntryForm();
  /** When viewing by teacher, merge attendance covers for this calendar date only. */
  teacherViewDate = new Date().toISOString().split('T')[0];

  constructor(
    private timetableService: TimetableService,
    private academicService: AcademicService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private auth: AuthService
  ) {}

  get entryFormSections(): { id: number; name: string }[] {
    const cid = this.entryForm.classId ?? undefined;
    const c = cid != null ? this.classes.find(x => x.id === cid) : undefined;
    return c ? c.sections.map(s => ({ id: s.id, name: s.name })) : [];
  }

  ngOnInit(): void {
    const r = (this.auth.getRole() ?? '').toLowerCase();
    this.isAdmin = r === 'admin' || r === 'super_admin';
    this.isParent = r === 'parent';
    this.canMutateTimetable = r === 'admin';
    if (r === 'teacher') {
      this.scheduleScope = 'teacher';
    } else if (!this.isAdmin) {
      this.scheduleScope = 'class';
    }
    if (this.isParent) {
      this.loadParentTimetableContext();
    } else {
      this.refreshTimetable();
    }
  }

  get isTeacherViewer(): boolean {
    return (this.auth.getRole() ?? '').toLowerCase() === 'teacher';
  }

  isCoverRow(entry: TimetableEntry): boolean {
    return entry.scheduleSource === 'COVER';
  }

  private loadParentTimetableContext(): void {
    const uid = this.auth.getCurrentUser()?.id;
    this.studentService.getStudents().subscribe(all => {
      this.myChildren = uid != null ? (all || []).filter(s => s.parentId === uid) : [];
      this.academicService.getClasses().subscribe(classes => {
        const allowed = new Set(this.myChildren.map(c => c.classId));
        this.classes = classes.filter(c => allowed.has(c.id));
        if (this.myChildren.length === 1) {
          this.selectedChildId = this.myChildren[0].id;
          this.applyParentChildSelection();
        } else if (this.selectedChildId != null) {
          this.applyParentChildSelection();
        }
      });
    });
  }

  onParentChildChange(): void {
    this.applyParentChildSelection();
  }

  private applyParentChildSelection(): void {
    const st = this.myChildren.find(x => x.id === this.selectedChildId);
    if (!st) {
      this.entries = [];
      this.grid = null;
      return;
    }
    this.selectedClassId = st.classId;
    const cls = this.classes.find(c => c.id === st.classId);
    this.sections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    this.selectedSectionId = st.sectionId > 0 ? st.sectionId : null;
    this.loadTimetable();
  }

  /** Reload master data and current grid from the backend (same paths as mocks-off). */
  refreshTimetable(): void {
    if (this.isParent) {
      this.loadParentTimetableContext();
      return;
    }
    this.teacherService.getTeachers().subscribe(teachers => {
      this.teachers = teachers;
      if (this.scheduleScope === 'teacher' && this.selectedTeacherId == null && this.isTeacherViewer) {
        const me = this.auth.getCurrentUser()?.id;
        const row = teachers.find(t => t.userId === me);
        if (row) {
          this.selectedTeacherId = row.id;
        }
      }
      this.academicService.getClasses().subscribe(classes => {
        this.classes = classes;
        const sel = this.classes.find(c => c.id === this.selectedClassId);
        this.sections = sel ? sel.sections.map(s => ({ id: s.id, name: s.name })) : [];
        if (this.scheduleScope === 'class') {
          this.loadTimetable();
        } else if (this.selectedTeacherId != null) {
          this.loadTeacherTimetable();
        }
      });
    });
  }

  setScheduleScope(scope: 'class' | 'teacher'): void {
    this.scheduleScope = scope;
    this.entries = [];
    this.grid = null;
    if (scope === 'class') {
      this.selectedTeacherId = null;
      if (this.selectedClassId != null && (this.sections.length === 0 || this.selectedSectionId != null)) {
        this.loadTimetable();
      }
    } else {
      this.selectedClassId = null;
      this.selectedSectionId = null;
      this.sections = [];
      if (this.selectedTeacherId != null) {
        this.loadTeacherTimetable();
      }
    }
  }

  onTeacherChange(): void {
    this.entries = [];
    this.grid = null;
    if (this.selectedTeacherId == null) {
      return;
    }
    this.loadTeacherTimetable();
  }

  onTeacherViewDateChange(): void {
    if (this.scheduleScope === 'teacher' && this.selectedTeacherId != null) {
      this.loadTeacherTimetable();
    }
  }

  private loadTeacherTimetable(): void {
    if (this.selectedTeacherId == null) {
      return;
    }
    this.timetableService.getByTeacher(this.selectedTeacherId, this.teacherViewDate).subscribe(entries => {
      this.entries = entries;
      this.grid = this.timetableService.toGridFromEntries(entries);
    });
  }

  onEntryFormClassChange(): void {
    const ids = new Set(this.entryFormSections.map(s => s.id));
    const sid = this.entryForm.sectionId;
    if (sid != null && sid !== 0 && !ids.has(sid)) {
      this.entryForm.sectionId = this.entryFormSections[0]?.id ?? null;
    }
  }

  onClassChange(): void {
    const selectedClass = this.classes.find(cls => cls.id === this.selectedClassId);
    this.sections = selectedClass ? selectedClass.sections.map(section => ({ id: section.id, name: section.name })) : [];
    this.selectedSectionId = null;
    this.entries = [];
    this.grid = null;
    if (this.selectedClassId != null && this.sections.length === 0) {
      this.loadTimetable();
    }
  }

  canEditTimetable(): boolean {
    if (!this.canMutateTimetable) {
      return false;
    }
    if (this.scheduleScope === 'teacher') {
      return this.isAdmin && this.selectedTeacherId != null;
    }
    if (this.selectedClassId == null) return false;
    if (this.sections.length > 0) return this.selectedSectionId != null;
    return true;
  }

  loadTimetable(): void {
    if (this.selectedClassId == null) return;
    if (this.sections.length > 0 && this.selectedSectionId == null) return;
    const sectionArg = this.sections.length > 0 ? this.selectedSectionId! : undefined;
    this.timetableService.getByClassAndSection(this.selectedClassId, sectionArg).subscribe(entries => (this.entries = entries));
    this.timetableService.getGrid(this.selectedClassId, sectionArg).subscribe(grid => (this.grid = grid));
  }

  getEntry(day: string, period: number): TimetableEntry | undefined {
    const nd = this.normalizeDay(day);
    return this.entries.find(entry => this.normalizeDay(entry.day) === nd && entry.period === period);
  }

  openCreateModal(): void {
    if (!this.canMutateTimetable) {
      return;
    }
    this.editingEntryId = null;
    this.entryForm = this.defaultEntryForm();
    if (this.scheduleScope === 'teacher') {
      this.entryForm.teacherId = this.selectedTeacherId ?? undefined;
      this.syncTeacherName();
      this.entryForm.classId = this.classes[0]?.id ?? null;
      this.entryForm.sectionId = this.entryFormSections[0]?.id ?? null;
    }
    this.showModal = true;
  }

  openEditModal(entry: TimetableEntry): void {
    if (!this.canMutateTimetable || this.isCoverRow(entry)) {
      return;
    }
    this.editingEntryId = entry.id;
    this.entryForm = { ...entry };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.entryForm = this.defaultEntryForm();
    this.editingEntryId = null;
  }

  syncTeacherName(): void {
    const tid = this.entryForm.teacherId ?? undefined;
    const teacher = tid != null ? this.teachers.find(item => item.id === tid) : undefined;
    this.entryForm.teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : '';
  }

  saveEntry(): void {
    if (!this.canMutateTimetable) {
      return;
    }
    let classId: number;
    let sectionId: number;
    if (this.scheduleScope === 'class') {
      classId = this.selectedClassId!;
      sectionId = this.sections.length > 0 ? this.selectedSectionId! : 0;
    } else {
      classId = this.entryForm.classId ?? this.classes[0]?.id ?? 0;
      const cls = this.classes.find(c => c.id === classId);
      if (cls && cls.sections.length > 0) {
        const picked = this.entryForm.sectionId;
        sectionId =
          picked != null && picked !== 0 ? picked : cls.sections[0].id;
      } else {
        sectionId = 0;
      }
    }
    const teacherId = this.entryForm.teacherId ?? 0;
    const payload: TimetableEntry = {
      id: this.editingEntryId ?? 0,
      classId,
      sectionId,
      day: this.entryForm.day || 'Monday',
      period: Number(this.entryForm.period || 1),
      startTime: this.entryForm.startTime || '',
      endTime: this.entryForm.endTime || '',
      subjectName: this.entryForm.subjectName || '',
      teacherId,
      teacherName: this.entryForm.teacherName || '',
      room: this.entryForm.room || '',
      tenantId: ''
    };
    const request$ =
      this.editingEntryId != null
        ? this.timetableService.updateEntry(this.editingEntryId, payload)
        : this.timetableService.addEntry(payload);
    request$.subscribe(() => {
      this.closeModal();
      if (this.scheduleScope === 'class') {
        this.loadTimetable();
      } else {
        this.loadTeacherTimetable();
      }
    });
  }

  deleteEntry(id: number): void {
    if (!this.canMutateTimetable) {
      return;
    }
    this.timetableService.deleteEntry(id).subscribe(() => {
      if (this.scheduleScope === 'class') {
        this.loadTimetable();
      } else {
        this.loadTeacherTimetable();
      }
    });
  }

  private defaultEntryForm(): TimetableEntryForm {
    return {
      day: 'Monday',
      period: 1,
      startTime: '08:00',
      endTime: '08:45',
      subjectName: '',
      teacherId: null,
      teacherName: '',
      room: '',
      classId: null,
      sectionId: null
    };
  }

  private normalizeDay(day: string): string {
    return day ? day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() : day;
  }
}
