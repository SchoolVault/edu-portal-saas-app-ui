import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableService } from '../../core/services/timetable.service';
import { AcademicService } from '../../core/services/academic.service';
import { SchoolClass, TimetableEntry } from '../../core/models/models';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="timetable-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Timetable</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">View and manage class timetables</p>
        </div>
      </div>
      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="selectedClassId" (change)="onClassChange()" data-testid="timetable-class">
              <option value="">Select Class</option>
              <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">Section</label>
            <select class="erp-select" [(ngModel)]="selectedSectionId" (change)="loadTimetable()" data-testid="timetable-section">
              <option value="">Select Section</option>
              <option *ngFor="let sec of sections" [value]="sec.id">{{ sec.name }}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-2" *ngIf="days.length > 0">
        <div style="overflow-x: auto;">
          <table class="erp-table" data-testid="timetable-grid">
            <thead>
              <tr>
                <th style="min-width: 120px;">Day / Period</th>
                <th *ngFor="let p of periods" style="min-width: 150px;">
                  Period {{ p }}<br>
                  <small style="font-weight: 400; text-transform: none;">{{ getPeriodTime(p) }}</small>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of days">
                <td><strong>{{ day }}</strong></td>
                <td *ngFor="let p of periods">
                  <ng-container *ngIf="getEntry(day, p) as entry">
                    <div style="background: var(--clr-bg); border-radius: var(--radius-md); padding: 8px; font-size: 12px;">
                      <div style="font-weight: 700; color: var(--clr-text); font-size: 13px;">{{ entry.subjectName }}</div>
                      <div style="color: var(--clr-text-muted);">{{ entry.teacherName }}</div>
                      <div style="color: var(--clr-text-muted);">{{ entry.room }}</div>
                    </div>
                  </ng-container>
                  <span *ngIf="!getEntry(day, p)" style="color: var(--clr-text-muted); font-size: 12px;">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div *ngIf="days.length === 0 && selectedClassId" class="erp-card">
        <div class="empty-state">
          <i class="bi bi-clock"></i>
          <h3>No Timetable Found</h3>
          <p>Select a class and section to view the timetable</p>
        </div>
      </div>
    </div>
  `
})
export class TimetableComponent implements OnInit {
  classes: SchoolClass[] = [];
  sections: { id: string; name: string }[] = [];
  selectedClassId = '';
  selectedSectionId = '';
  entries: TimetableEntry[] = [];
  days: string[] = [];
  periods: number[] = [];

  constructor(private timetableService: TimetableService, private academicService: AcademicService) {}

  ngOnInit(): void {
    this.academicService.getClasses().subscribe(c => this.classes = c);
  }

  onClassChange(): void {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    this.sections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    this.selectedSectionId = '';
    this.entries = [];
    this.days = [];
  }

  loadTimetable(): void {
    if (!this.selectedClassId || !this.selectedSectionId) return;
    this.timetableService.getByClassAndSection(this.selectedClassId, this.selectedSectionId).subscribe(entries => {
      this.entries = entries;
      this.days = [...new Set(entries.map(e => e.day))];
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      this.days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      this.periods = [...new Set(entries.map(e => e.period))].sort((a, b) => a - b);
    });
  }

  getEntry(day: string, period: number): TimetableEntry | undefined {
    return this.entries.find(e => e.day === day && e.period === period);
  }

  getPeriodTime(period: number): string {
    const times: Record<number, string> = { 1: '8:00-8:45', 2: '8:45-9:30', 3: '9:45-10:30', 4: '10:30-11:15', 5: '11:30-12:15', 6: '12:15-1:00' };
    return times[period] || '';
  }
}
