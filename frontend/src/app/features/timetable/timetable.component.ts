import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import { SchoolClass, Teacher, TimetableEntry, TimetableGrid } from '../../core/models/models';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="timetable-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Timetable</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage class schedules, teachers, rooms, and period allocations</p>
        </div>
        <button class="btn-primary-erp btn-sm" [disabled]="!selectedClassId || !selectedSectionId" (click)="openCreateModal()">
          <i class="bi bi-plus-lg"></i> Add Slot
        </button>
      </div>

      <div class="erp-card mb-4 animate-in">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
              <option value="">Select Class</option>
              <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">Section</label>
            <select class="erp-select" [(ngModel)]="selectedSectionId" (change)="loadTimetable()">
              <option value="">Select Section</option>
              <option *ngFor="let sec of sections" [value]="sec.id">{{ sec.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="grid?.days?.length">
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
                    <div style="background: var(--clr-bg); border-radius: var(--radius-md); padding: 10px;">
                      <div style="font-weight: 700; color: var(--clr-text);">{{ entry.subjectName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-secondary);">{{ entry.teacherName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-muted);">{{ entry.startTime }} - {{ entry.endTime }} · {{ entry.room }}</div>
                      <div class="d-flex gap-2 mt-2">
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

      <div class="erp-card" *ngIf="entries.length">
        <div class="erp-card-header"><h3 class="erp-card-title">Timetable Entries</h3></div>
        <table class="erp-table">
          <thead><tr><th>Day</th><th>Period</th><th>Subject</th><th>Teacher</th><th>Time</th><th>Room</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let entry of entries">
              <td>{{ entry.day }}</td>
              <td>{{ entry.period }}</td>
              <td>{{ entry.subjectName }}</td>
              <td>{{ entry.teacherName }}</td>
              <td>{{ entry.startTime }} - {{ entry.endTime }}</td>
              <td>{{ entry.room }}</td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn-icon" (click)="openEditModal(entry)"><i class="bi bi-pencil"></i></button>
                  <button class="btn-icon" (click)="deleteEntry(entry.id)"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ editingEntryId ? 'Edit Slot' : 'Add Slot' }}</h3>
          <button class="btn-icon" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="erp-label">Day</label>
              <select class="erp-select" [(ngModel)]="entryForm.day" [disabled]="!!editingEntryId">
                <option *ngFor="let day of dayOptions" [value]="day">{{ day }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="erp-label">Period</label>
              <input class="erp-input" type="number" [(ngModel)]="entryForm.period" [disabled]="!!editingEntryId">
            </div>
            <div class="col-md-6">
              <label class="erp-label">Subject</label>
              <input class="erp-input" [(ngModel)]="entryForm.subjectName">
            </div>
            <div class="col-md-6">
              <label class="erp-label">Teacher</label>
              <select class="erp-select" [(ngModel)]="entryForm.teacherId" (change)="syncTeacherName()">
                <option value="">Select Teacher</option>
                <option *ngFor="let teacher of teachers" [value]="teacher.id">{{ teacher.firstName }} {{ teacher.lastName }}</option>
              </select>
            </div>
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
          <button class="btn-primary-erp" (click)="saveEntry()">{{ editingEntryId ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `
})
export class TimetableComponent implements OnInit {
  classes: SchoolClass[] = [];
  sections: { id: string; name: string }[] = [];
  teachers: Teacher[] = [];
  selectedClassId = '';
  selectedSectionId = '';
  entries: TimetableEntry[] = [];
  grid: TimetableGrid | null = null;
  showModal = false;
  editingEntryId = '';
  dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  entryForm: Partial<TimetableEntry> = this.defaultEntryForm();

  constructor(
    private timetableService: TimetableService,
    private academicService: AcademicService,
    private teacherService: TeacherService
  ) {}

  ngOnInit(): void {
    this.academicService.getClasses().subscribe(classes => this.classes = classes);
    this.teacherService.getTeachers().subscribe(teachers => this.teachers = teachers);
  }

  onClassChange(): void {
    const selectedClass = this.classes.find(cls => cls.id === this.selectedClassId);
    this.sections = selectedClass ? selectedClass.sections.map(section => ({ id: section.id, name: section.name })) : [];
    this.selectedSectionId = '';
    this.entries = [];
    this.grid = null;
  }

  loadTimetable(): void {
    if (!this.selectedClassId || !this.selectedSectionId) {
      return;
    }
    this.timetableService.getByClassAndSection(this.selectedClassId, this.selectedSectionId).subscribe(entries => this.entries = entries);
    this.timetableService.getGrid(this.selectedClassId, this.selectedSectionId).subscribe(grid => this.grid = grid);
  }

  getEntry(day: string, period: number): TimetableEntry | undefined {
    return this.entries.find(entry => entry.day === this.normalizeDay(day) && entry.period === period);
  }

  openCreateModal(): void {
    this.editingEntryId = '';
    this.entryForm = this.defaultEntryForm();
    this.showModal = true;
  }

  openEditModal(entry: TimetableEntry): void {
    this.editingEntryId = entry.id;
    this.entryForm = { ...entry };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.entryForm = this.defaultEntryForm();
    this.editingEntryId = '';
  }

  syncTeacherName(): void {
    const teacher = this.teachers.find(item => item.id === this.entryForm.teacherId);
    this.entryForm.teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : '';
  }

  saveEntry(): void {
    const payload: TimetableEntry = {
      id: this.editingEntryId || '',
      classId: this.selectedClassId,
      sectionId: this.selectedSectionId,
      day: this.entryForm.day || 'Monday',
      period: Number(this.entryForm.period || 1),
      startTime: this.entryForm.startTime || '',
      endTime: this.entryForm.endTime || '',
      subjectName: this.entryForm.subjectName || '',
      teacherId: this.entryForm.teacherId || '',
      teacherName: this.entryForm.teacherName || '',
      room: this.entryForm.room || '',
      tenantId: ''
    };
    const request$ = this.editingEntryId
      ? this.timetableService.updateEntry(this.editingEntryId, payload)
      : this.timetableService.addEntry(payload);
    request$.subscribe(() => {
      this.closeModal();
      this.loadTimetable();
    });
  }

  deleteEntry(id: string): void {
    this.timetableService.deleteEntry(id).subscribe(() => this.loadTimetable());
  }

  private defaultEntryForm(): Partial<TimetableEntry> {
    return {
      day: 'Monday',
      period: 1,
      startTime: '08:00',
      endTime: '08:45',
      subjectName: '',
      teacherId: '',
      teacherName: '',
      room: ''
    };
  }

  private normalizeDay(day: string): string {
    return day ? day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() : day;
  }
}
