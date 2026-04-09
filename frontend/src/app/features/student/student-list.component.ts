import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Student } from '../../core/models/models';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div data-testid="student-list-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Students</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            {{ isAdmin ? 'Manage enrolment and student master records.' : 'Directory view for your classes (read-only). Admins handle new admissions and edits.' }}
          </p>
        </div>
        <div class="d-flex gap-3 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadStudents()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <ng-container *ngIf="isAdmin">
            <label class="btn-outline-erp btn-sm" style="cursor: pointer; margin-bottom: 0;">
              <i class="bi bi-upload"></i> Import ZIP
              <input type="file" accept=".zip" style="display: none;" (change)="onImport($event)">
            </label>
            <button class="btn-outline-erp btn-sm" data-testid="export-students-btn">
              <i class="bi bi-download"></i> Export
            </button>
            <a routerLink="/app/students/new" class="btn-primary-erp btn-sm" data-testid="add-student-btn">
              <i class="bi bi-plus-lg"></i> Add Student
            </a>
          </ng-container>
        </div>
      </div>

      <div class="erp-card animate-in animate-in-delay-1">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="search-input-wrapper" style="min-width: 300px;">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" placeholder="Search students..." [(ngModel)]="searchTerm"
                   (input)="filterStudents()" data-testid="student-search-input">
          </div>
          <div class="d-flex gap-2">
            <select class="erp-select" style="width: 160px;" [(ngModel)]="classFilter" (change)="filterStudents()" data-testid="class-filter">
              <option value="">All Classes</option>
              <option *ngFor="let c of classOptions" [value]="c">{{ c }}</option>
            </select>
            <select class="erp-select" style="width: 140px;" [(ngModel)]="statusFilter" (change)="filterStudents()" data-testid="status-filter">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="erp-table" data-testid="student-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sort('firstName')">Student <i class="bi bi-chevron-expand" style="font-size: 10px;"></i></th>
                <th>Admission #</th>
                <th class="sortable" (click)="sort('className')">Class</th>
                <th>Section</th>
                <th>Parent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of paginatedStudents" [attr.data-testid]="'student-row-' + student.id">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="table-avatar" [style.background]="student.gender === 'female' ? '#C05C3D' : '#1B3A30'">
                      {{ student.firstName[0] }}{{ student.lastName[0] }}
                    </div>
                    <div>
                      <div style="font-weight: 600; color: var(--clr-text);">{{ student.firstName }} {{ student.lastName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-muted);">{{ student.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ student.admissionNumber }}</td>
                <td>{{ student.className }}</td>
                <td>{{ student.sectionName }}</td>
                <td>{{ student.parentName }}</td>
                <td>
                  <span class="badge-erp" [ngClass]="{'badge-success': student.status === 'active', 'badge-warning': student.status === 'inactive', 'badge-neutral': student.status === 'graduated'}">
                    {{ student.status }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/app/students', student.id]" class="btn-icon" title="View" [attr.data-testid]="'view-student-' + student.id">
                      <i class="bi bi-eye"></i>
                    </a>
                    <a *ngIf="isAdmin" [routerLink]="['/app/students', student.id, 'edit']" class="btn-icon" title="Edit" [attr.data-testid]="'edit-student-' + student.id">
                      <i class="bi bi-pencil"></i>
                    </a>
                    <button *ngIf="isAdmin" type="button" class="btn-icon" title="Delete" (click)="deleteStudent(student.id)" [attr.data-testid]="'delete-student-' + student.id">
                      <i class="bi bi-trash" style="color: var(--clr-danger);"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-wrapper" *ngIf="filteredStudents.length > pageSize">
          <span>Showing {{ (page - 1) * pageSize + 1 }} to {{ Math.min(page * pageSize, filteredStudents.length) }} of {{ filteredStudents.length }}</span>
          <div class="pagination-controls">
            <button class="page-btn" [disabled]="page === 1" (click)="page = page - 1; paginate()">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button *ngFor="let p of pages" class="page-btn" [class.active]="p === page" (click)="page = p; paginate()">{{ p }}</button>
            <button class="page-btn" [disabled]="page === totalPages" (click)="page = page + 1; paginate()">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  paginatedStudents: Student[] = [];
  searchTerm = '';
  classFilter = '';
  statusFilter = '';
  sortField = '';
  sortAsc = true;
  page = 1;
  pageSize = 10;
  totalPages = 1;
  pages: number[] = [];
  classOptions: string[] = [];
  Math = Math;
  importError = '';

  constructor(private studentService: StudentService, private auth: AuthService) {}

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  ngOnInit(): void {
    this.reloadStudents();
  }

  reloadStudents(): void {
    this.studentService.getStudents().subscribe(students => {
      this.students = students;
      this.classOptions = [...new Set(students.map(s => s.className))].sort();
      this.filterStudents();
    });
  }

  filterStudents(): void {
    let filtered = [...this.students];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        (s.firstName + ' ' + s.lastName).toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.admissionNumber.toLowerCase().includes(term)
      );
    }
    if (this.classFilter) filtered = filtered.filter(s => s.className === this.classFilter);
    if (this.statusFilter) filtered = filtered.filter(s => s.status === this.statusFilter);
    this.filteredStudents = filtered;
    this.page = 1;
    this.paginate();
  }

  sort(field: string): void {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
    this.filteredStudents.sort((a: any, b: any) => {
      const va = a[field]?.toLowerCase?.() || a[field];
      const vb = b[field]?.toLowerCase?.() || b[field];
      return this.sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    this.paginate();
  }

  paginate(): void {
    this.totalPages = Math.ceil(this.filteredStudents.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.page - 1) * this.pageSize;
    this.paginatedStudents = this.filteredStudents.slice(start, start + this.pageSize);
  }

  deleteStudent(id: string): void {
    if (confirm('Are you sure you want to delete this student?')) {
      this.studentService.deleteStudent(id).subscribe(() => {
        this.students = this.students.filter(s => s.id !== id);
        this.filterStudents();
      });
    }
  }

  onImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.studentService.importStudentsZip(file).subscribe(imported => {
      this.students = [...imported, ...this.students];
      this.classOptions = [...new Set(this.students.map(s => s.className))].sort();
      this.filterStudents();
      input.value = '';
    });
  }
}
