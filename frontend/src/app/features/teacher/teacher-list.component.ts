import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeacherService } from '../../core/services/teacher.service';
import { Teacher } from '../../core/models/models';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div data-testid="teacher-list-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Teachers</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage teaching staff</p>
        </div>
        <div class="d-flex gap-3">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadTeachers()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <label class="btn-outline-erp btn-sm" style="cursor: pointer; margin-bottom: 0;">
            <i class="bi bi-upload"></i> Import ZIP
            <input type="file" accept=".zip" style="display: none;" (change)="onImport($event)">
          </label>
          <a routerLink="/app/teachers/new" class="btn-primary-erp btn-sm" data-testid="add-teacher-btn">
            <i class="bi bi-plus-lg"></i> Add Teacher
          </a>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="search-input-wrapper" style="min-width: 300px;">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" placeholder="Search teachers..." [(ngModel)]="searchTerm" (input)="filter()" data-testid="teacher-search">
          </div>
        </div>
        <div style="overflow-x: auto;">
          <table class="erp-table" data-testid="teacher-table">
            <thead>
              <tr><th>Teacher</th><th>Specialization</th><th>Subjects</th><th>Classes</th><th>Join Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of filtered" [attr.data-testid]="'teacher-row-' + t.id">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="table-avatar">{{ t.firstName[0] }}{{ t.lastName[0] }}</div>
                    <div>
                      <div style="font-weight: 600; color: var(--clr-text);">{{ t.firstName }} {{ t.lastName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-muted);">{{ t.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ t.specialization }}</td>
                <td><span class="badge-erp badge-neutral me-1" *ngFor="let s of t.subjects.slice(0, 2)">{{ s }}</span></td>
                <td>{{ t.classIds.length || 0 }} classes</td>
                <td>{{ t.joinDate }}</td>
                <td><span class="badge-erp badge-success">{{ t.status }}</span></td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/app/teachers', t.id, 'edit']" class="btn-icon" title="Edit"><i class="bi bi-pencil"></i></a>
                    <button class="btn-icon" (click)="deleteTeacher(t.id)"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  filtered: Teacher[] = [];
  searchTerm = '';

  constructor(private teacherService: TeacherService) {}

  ngOnInit(): void {
    this.reloadTeachers();
  }

  reloadTeachers(): void {
    this.teacherService.getTeachers().subscribe(t => {
      this.teachers = t;
      this.filtered = t;
    });
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.teachers.filter(t =>
      (t.firstName + ' ' + t.lastName).toLowerCase().includes(term) || (t.specialization || '').toLowerCase().includes(term)
    );
  }

  deleteTeacher(id: string): void {
    if (confirm('Delete this teacher?')) {
      this.teacherService.deleteTeacher(id).subscribe(() => {
        this.teachers = this.teachers.filter(t => t.id !== id);
        this.filter();
      });
    }
  }

  onImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.teacherService.importTeachersZip(file).subscribe(imported => {
      this.teachers = [...imported, ...this.teachers];
      this.filter();
      input.value = '';
    });
  }
}
