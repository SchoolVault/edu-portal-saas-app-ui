import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, filter } from 'rxjs/operators';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { Student } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
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
            <input type="text" class="erp-input" erpI18nPh="students.list.searchPlaceholder" [(ngModel)]="searchTerm"
                   (input)="onSearchInput()" data-testid="student-search-input">
          </div>
          <div class="d-flex gap-2">
            <select class="erp-select" style="width: 160px;" [(ngModel)]="classFilter" (change)="onClassOrStatusChange()" data-testid="class-filter">
              <option *ngFor="let c of classOptions" [value]="c.value">{{ c.value === '' ? ('students.list.allClasses' | translate) : classDisplayName(c.label) }}</option>
            </select>
            <select class="erp-select" style="width: 140px;" [(ngModel)]="statusFilter" (change)="onClassOrStatusChange()" data-testid="status-filter">
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

        <app-erp-pagination
          *ngIf="paginationTotal > 0"
          [totalElements]="paginationTotal"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          (pageIndexChange)="onPageIndexChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        />
      </div>
    </div>
  `
})
export class StudentListComponent implements OnInit, OnDestroy {
  /** Real API: server-driven pages so totals match DB. Mocks: client filter + slice. */
  readonly useServerPaging = !runtimeConfig.useMocks;

  students: Student[] = [];
  filteredStudents: Student[] = [];
  paginatedStudents: Student[] = [];
  serverTotal = 0;
  searchTerm = '';
  classFilter = '';
  statusFilter = 'active';
  sortField = '';
  sortAsc = true;
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  /** value: className (mock) or class id string (API); label: display name */
  classOptions: { value: string; label: string }[] = [{ value: '', label: '' }];
  private readonly subs = new Subscription();
  private readonly searchDebounced$ = new Subject<void>();
  /** Ignores stale HTTP responses when a newer list request was started. */
  private studentsListRequestSeq = 0;

  constructor(
    private studentService: StudentService,
    private academic: AcademicService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  get paginationTotal(): number {
    return this.useServerPaging ? this.serverTotal : this.filteredStudents.length;
  }

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
    this.subs.add(this.translate.onLangChange.subscribe(() => this.cdr.markForCheck()));
    this.subs.add(
      this.searchDebounced$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.pageIndex = 0;
        this.fetchStudentsPage();
      })
    );
    this.reloadStudents();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onSearchInput(): void {
    if (this.useServerPaging) {
      this.searchDebounced$.next();
    } else {
      this.filterStudents();
    }
  }

  onClassOrStatusChange(): void {
    if (this.useServerPaging) {
      this.pageIndex = 0;
      this.fetchStudentsPage();
    } else {
      this.filterStudents();
    }
  }

  reloadStudents(): void {
    if (this.useServerPaging) {
      this.subs.add(
        this.academic.getClasses().subscribe(classes => {
          this.classOptions = [
            { value: '', label: '' },
            ...classes
              .slice()
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
              .map(c => ({ value: String(c.id), label: c.name || '' })),
          ];
          this.pageIndex = 0;
          this.fetchStudentsPage();
        })
      );
      return;
    }
    this.studentService.getStudents().subscribe(students => {
      this.students = students;
      const names = [...new Set(students.map(s => s.className).filter(Boolean))].sort() as string[];
      this.classOptions = [{ value: '', label: '' }, ...names.map(n => ({ value: n, label: n }))];
      this.filterStudents();
    });
  }

  private fetchStudentsPage(): void {
    const classIdRaw = this.classFilter ? Number(this.classFilter) : NaN;
    const classId = Number.isFinite(classIdRaw) && classIdRaw > 0 ? classIdRaw : undefined;
    const seq = ++this.studentsListRequestSeq;
    this.subs.add(
      this.studentService
        .getStudentsPage({
          page: this.pageIndex,
          size: this.pageSize,
          search: this.searchTerm.trim() || undefined,
          classId,
          status: this.statusFilter || undefined,
          sortBy: this.serverSortProperty(),
          direction: this.sortAsc ? 'asc' : 'desc',
        })
        .subscribe(page => {
          if (seq !== this.studentsListRequestSeq) return;
          this.serverTotal = page.totalElements;
          this.paginatedStudents = page.content;
          this.pageIndex = page.page;
          this.pageSize = page.size;
          this.cdr.markForCheck();
        })
    );
  }

  /** Maps UI sort column to JPA property on {@code Student}. */
  private serverSortProperty(): string {
    const f = this.sortField || 'firstName';
    return f === 'className' ? 'classId' : f;
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
    this.pageIndex = 0;
    this.paginate();
  }

  sort(field: string): void {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else {
      this.sortField = field;
      this.sortAsc = true;
    }
    if (this.useServerPaging) {
      this.pageIndex = 0;
      this.fetchStudentsPage();
      return;
    }
    this.filteredStudents.sort((a: any, b: any) => {
      const va = a[field]?.toLowerCase?.() || a[field];
      const vb = b[field]?.toLowerCase?.() || b[field];
      return this.sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    this.paginate();
  }

  paginate(): void {
    const slice = sliceToPage(this.filteredStudents, this.pageIndex, this.pageSize);
    this.paginatedStudents = slice.content;
    this.pageIndex = slice.page;
  }

  onPageIndexChange(idx: number): void {
    this.pageIndex = idx;
    if (this.useServerPaging) {
      this.fetchStudentsPage();
    } else {
      this.paginate();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    if (this.useServerPaging) {
      this.fetchStudentsPage();
    } else {
      this.paginate();
    }
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
          if (this.useServerPaging) {
            this.fetchStudentsPage();
          } else {
            this.students = this.students.filter(s => s.id !== id);
            this.filterStudents();
          }
        });
      });
  }
}
