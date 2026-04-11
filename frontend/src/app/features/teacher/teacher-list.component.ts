import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { Teacher } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div data-testid="teacher-list-page">
      <header class="erp-page-header animate-in">
        <div>
          <h1 class="erp-page-header__title">Teachers</h1>
          <p class="erp-page-header__lead">Manage teaching staff. Bulk ZIP/CSV import is under Operations → Import / export.</p>
        </div>
        <div class="erp-page-header__actions">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadTeachers()"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Refresh</button>
          <a routerLink="/app/teachers/new" class="btn-primary-erp btn-sm" data-testid="add-teacher-btn">
            <i class="bi bi-plus-lg" aria-hidden="true"></i><span>Add Teacher</span>
          </a>
        </div>
      </header>
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
                    <img
                      *ngIf="teacherPortraitUrl(t) as src"
                      [src]="src"
                      alt=""
                      class="table-avatar"
                      width="36"
                      height="36"
                    />
                    <div *ngIf="!teacherPortraitUrl(t)" class="table-avatar">{{ t.firstName[0] }}{{ t.lastName[0] }}</div>
                    <div>
                      <div style="font-weight: 600; color: var(--clr-text);">{{ t.firstName }} {{ t.lastName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-secondary);">{{ t.email }}</div>
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
                    <a [routerLink]="['/app/teachers', t.id]" class="btn-icon" title="View profile" [attr.data-testid]="'view-teacher-' + t.id">
                      <i class="bi bi-eye"></i>
                    </a>
                    <a [routerLink]="['/app/teachers', t.id, 'edit']" class="btn-icon" title="Edit"><i class="bi bi-pencil"></i></a>
                    <button type="button" class="btn-icon" (click)="deleteTeacher(t.id)" title="Deactivate"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
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

  constructor(
    private teacherService: TeacherService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  teacherPortraitUrl(t: Teacher): string | null {
    return this.auth.getDirectoryTeacherAvatarDataUrl(t.id) || t.avatar || null;
  }

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

  deleteTeacher(id: number): void {
    const t = this.teachers.find(x => x.id === id);
    const name = t ? `${t.firstName} ${t.lastName}` : 'This teacher';
    this.confirmDialog
      .confirm({
        title: 'Remove teacher?',
        message: `${name} will be deactivated and removed from staff lists. Homeroom assignments for this teacher are cleared in the backend.`,
        details: [
          t?.email ? `Email: ${t.email}` : undefined,
          t?.specialization ? `Focus: ${t.specialization}` : undefined,
          'This is a soft delete for compliance and audit.',
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: 'Yes, remove',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.teacherService.deleteTeacher(id).subscribe(() => {
          this.teachers = this.teachers.filter(x => x.id !== id);
          this.filter();
        });
      });
  }
}
