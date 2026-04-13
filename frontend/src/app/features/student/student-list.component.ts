import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Student } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div data-testid="student-list-page">
      <header class="erp-page-header animate-in">
        <div>
          <h1 class="erp-page-header__title">{{ 'students.list.title' | translate }}</h1>
          <p class="erp-page-header__lead">
            {{ isAdmin ? ('students.list.leadAdmin' | translate) : ('students.list.leadTeacher' | translate) }}
          </p>
        </div>
        <div class="erp-page-header__actions">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadStudents()"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> {{ 'students.list.refresh' | translate }}</button>
          <ng-container *ngIf="isAdmin">
            <a routerLink="/app/students/new" class="btn-primary-erp btn-sm" data-testid="add-student-btn">
              <i class="bi bi-plus-lg" aria-hidden="true"></i><span>{{ 'students.list.add' | translate }}</span>
            </a>
          </ng-container>
        </div>
      </header>

      <div class="erp-card animate-in animate-in-delay-1">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="search-input-wrapper" style="min-width: 300px;">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" [placeholder]="'students.list.searchPlaceholder' | translate" [(ngModel)]="searchTerm"
                   (input)="filterStudents()" data-testid="student-search-input">
          </div>
          <div class="d-flex gap-2">
            <select class="erp-select" style="width: 160px;" [(ngModel)]="classFilter" (change)="filterStudents()" data-testid="class-filter">
              <option value="">{{ 'students.list.allClasses' | translate }}</option>
              <option *ngFor="let c of classOptions" [value]="c">{{ classDisplayName(c) }}</option>
            </select>
            <select class="erp-select" style="width: 140px;" [(ngModel)]="statusFilter" (change)="filterStudents()" data-testid="status-filter">
              <option value="">{{ 'students.list.allStatus' | translate }}</option>
              <option value="active">{{ 'students.enums.status.active' | translate }}</option>
              <option value="inactive">{{ 'students.enums.status.inactive' | translate }}</option>
              <option value="graduated">{{ 'students.enums.status.graduated' | translate }}</option>
              <option value="transferred">{{ 'students.enums.status.transferred' | translate }}</option>
              <option value="alumni">{{ 'students.enums.status.alumni' | translate }}</option>
            </select>
          </div>
        </div>

        <div style="overflow-x: auto;" dir="ltr">
          <table class="erp-table" data-testid="student-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sort('firstName')">{{ 'students.list.thStudent' | translate }} <i class="bi bi-chevron-expand" style="font-size: 10px;"></i></th>
                <th>{{ 'students.list.thAdmission' | translate }}</th>
                <th class="sortable" (click)="sort('className')">{{ 'students.list.thClass' | translate }} <i class="bi bi-chevron-expand" style="font-size: 10px;"></i></th>
                <th>{{ 'students.list.thSection' | translate }}</th>
                <th>{{ 'students.list.thParent' | translate }}</th>
                <th>{{ 'students.list.thStatus' | translate }}</th>
                <th>{{ 'students.list.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of paginatedStudents" [attr.data-testid]="'student-row-' + student.id">
                <td>
                  <div class="d-flex align-items-center">
                    <img
                      *ngIf="studentPortraitUrl(student) as src"
                      [src]="src"
                      alt=""
                      class="table-avatar"
                      width="36"
                      height="36"
                    />
                    <div
                      *ngIf="!studentPortraitUrl(student)"
                      class="table-avatar"
                      [style.background]="student.gender === 'female' ? '#C05C3D' : '#1B3A30'"
                    >
                      {{ student.firstName[0] }}{{ student.lastName[0] }}
                    </div>
                    <div>
                      <div style="font-weight: 600; color: var(--clr-text);">{{ student.firstName }} {{ student.lastName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-secondary);">{{ student.email }}</div>
                    </div>
                  </div>
                </td>
                <td style="color: var(--clr-text-secondary);">{{ student.admissionNumber }}</td>
                <td>{{ classDisplayName(student.className) }}</td>
                <td>{{ student.sectionName }}</td>
                <td>{{ student.parentName }}</td>
                <td>
                  <span class="badge-erp" [ngClass]="{'badge-success': student.status === 'active', 'badge-warning': student.status === 'inactive', 'badge-neutral': student.status === 'graduated' || student.status === 'alumni', 'badge-info': student.status === 'transferred'}">
                    {{ statusLabel(student.status) }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/app/students', student.id]" class="btn-icon" [attr.title]="'students.list.view' | translate" [attr.data-testid]="'view-student-' + student.id">
                      <i class="bi bi-eye"></i>
                    </a>
                    <a *ngIf="isAdmin" [routerLink]="['/app/students', student.id, 'edit']" class="btn-icon" [attr.title]="'students.list.edit' | translate" [attr.data-testid]="'edit-student-' + student.id">
                      <i class="bi bi-pencil"></i>
                    </a>
                    <button *ngIf="isAdmin" type="button" class="btn-icon" [attr.title]="'students.list.delete' | translate" (click)="deleteStudent(student.id)" [attr.data-testid]="'delete-student-' + student.id">
                      <i class="bi bi-trash" style="color: var(--clr-danger);"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-wrapper" *ngIf="filteredStudents.length > pageSize">
          <span>{{ 'students.list.showing' | translate: { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, filteredStudents.length), total: filteredStudents.length } }}</span>
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
export class StudentListComponent implements OnInit, OnDestroy {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  paginatedStudents: Student[] = [];
  searchTerm = '';
  classFilter = '';
  statusFilter = 'active';
  sortField = '';
  sortAsc = true;
  page = 1;
  pageSize = 10;
  totalPages = 1;
  pages: number[] = [];
  classOptions: string[] = [];
  Math = Math;
  private langSub?: Subscription;

  constructor(
    private studentService: StudentService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  statusLabel(status: string): string {
    const key = 'students.enums.status.' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  classDisplayName(raw: string | null | undefined): string {
    return formatSchoolClassName(raw, this.translate);
  }

  studentPortraitUrl(s: Student): string | null {
    return this.auth.getDirectoryStudentAvatarDataUrl(s.id) || s.avatar || null;
  }

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
    this.reloadStudents();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
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

  deleteStudent(id: number): void {
    const st = this.students.find(s => s.id === id);
    const name = st
      ? `${st.firstName} ${st.lastName}`
      : this.translate.instant('students.list.confirmDelete.fallbackName');
    this.confirmDialog
      .confirm({
        title: this.translate.instant('students.list.confirmDelete.title'),
        message: this.translate.instant('students.list.confirmDelete.message', { name }),
        details: [
          st ? this.translate.instant('students.list.confirmDelete.detailAdmission', { no: st.admissionNumber }) : undefined,
          st
            ? this.translate.instant('students.list.confirmDelete.detailClass', {
                class: `${st.className} ${st.sectionName || ''}`.trim(),
              })
            : undefined,
          this.translate.instant('students.list.confirmDelete.detailSoft'),
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: this.translate.instant('students.list.confirmDelete.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.studentService.deleteStudent(id).subscribe(() => {
          this.students = this.students.filter(s => s.id !== id);
          this.filterStudents();
        });
      });
  }
}
