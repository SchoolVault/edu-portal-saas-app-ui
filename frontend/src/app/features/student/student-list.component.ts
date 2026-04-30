import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, filter } from 'rxjs/operators';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
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
import { sortSchoolClassesByGrade } from '../../core/utils/school-class-sort.util';
import { ImportExportService } from '../../core/services/import-export.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
  styles: [
    `
      .student-list-page {
        color: var(--clr-text);
      }
      .student-list-page .erp-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 82%, var(--clr-primary) 18%);
        border-radius: 14px;
        box-shadow: 0 8px 22px color-mix(in srgb, var(--clr-primary) 8%, transparent);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--clr-surface) 97%, var(--clr-primary) 3%) 0%,
          var(--clr-surface) 100%
        );
      }
      .student-list-filter-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .student-list-search {
        min-width: 300px;
        max-width: 360px;
      }
      .student-list-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .student-list-table-wrap {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .student-list-table-wrap .erp-table {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary) 20%);
        min-width: 760px;
      }
      .student-list-table-wrap .erp-table thead th {
        background: color-mix(in srgb, var(--clr-primary) 11%, var(--clr-surface));
        color: color-mix(in srgb, var(--clr-text) 80%, var(--clr-primary) 20%);
        font-weight: 700;
        border-bottom-color: color-mix(in srgb, var(--clr-border) 68%, var(--clr-primary) 32%);
      }
      .student-list-table-wrap .erp-table tbody tr:nth-child(even) td {
        background: color-mix(in srgb, var(--clr-surface) 95%, var(--clr-primary) 5%);
      }
      .student-list-table-wrap .erp-table tbody tr:hover td {
        background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
      }
      @media (max-width: 768px) {
        .student-list-search {
          min-width: 100%;
          max-width: 100%;
        }
      }
      @media (max-width: 576px) {
        .student-list-table-wrap .erp-table {
          min-width: 700px;
        }
      }
    `,
  ],
  template: `
    <div class="student-list-page" data-testid="student-list-page">
      <header class="erp-page-header animate-in">
        <div>
          <h1 class="erp-page-header__title">{{ 'students.list.title' | translate }}</h1>
          <p class="erp-page-header__lead">
            {{ isAdmin ? ('students.list.leadAdmin' | translate) : ('students.list.leadTeacher' | translate) }}
          </p>
        </div>
        <div class="erp-page-header__actions">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadStudents()"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> {{ 'students.list.refresh' | translate }}</button>
          <button *ngIf="isAdmin" type="button" class="btn-outline-erp btn-sm" (click)="exportCanonicalStudentsCsv()">
            <i class="bi bi-download" aria-hidden="true"></i> {{ 'students.list.exportCsv' | translate }}
          </button>
          <ng-container *ngIf="isAdmin">
            <a routerLink="/app/students/new" class="btn-primary-erp btn-sm" data-testid="add-student-btn">
              <i class="bi bi-plus-lg" aria-hidden="true"></i><span>{{ 'students.list.add' | translate }}</span>
            </a>
          </ng-container>
        </div>
      </header>
      <div *ngIf="exportMessage" class="alert py-2 small mb-3" [class.alert-success]="exportMessageOk" [class.alert-danger]="!exportMessageOk">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <span>{{ exportMessage }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'students.list.closeAlert' | translate" (click)="clearExportMessage()"></button>
        </div>
      </div>

      <div *ngIf="showHomeroomDeepLinkBanner" class="erp-card mb-3 animate-in" style="border-left: 4px solid var(--clr-primary); padding: 12px 16px;">
        <div class="d-flex align-items-start gap-2 mb-0">
          <i class="bi bi-funnel-fill" style="color: var(--clr-primary); margin-top: 2px;"></i>
          <p class="mb-0 small" style="color: var(--clr-text-secondary); line-height: 1.45;">{{ 'students.list.homeroomFilterBanner' | translate }}</p>
        </div>
      </div>

      <div class="erp-card animate-in animate-in-delay-1">
        <div class="erp-filter-toolbar student-list-filter-row">
          <div class="search-input-wrapper student-list-search erp-filter-toolbar__search">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" erpI18nPh="students.list.searchPlaceholder" [(ngModel)]="searchTerm"
                   (input)="onSearchInput()" data-testid="student-search-input">
          </div>
          <div class="student-list-filter-group erp-filter-toolbar__actions">
            <select class="erp-select" style="width: 170px;" [(ngModel)]="classFilter" (change)="onClassOrStatusChange()" data-testid="class-filter">
              <option *ngFor="let c of classOptions" [value]="c.value">{{ c.value === '' ? ('students.list.allClasses' | translate) : classDisplayName(c.label) }}</option>
            </select>
            <select class="erp-select" style="width: 170px;" [(ngModel)]="statusFilter" (change)="onClassOrStatusChange()" data-testid="status-filter">
              <option value="">{{ 'students.list.allStatus' | translate }}</option>
              <option value="active">{{ 'students.enums.status.active' | translate }}</option>
              <option *ngIf="canViewInactive" value="inactive">{{ 'students.enums.status.inactive' | translate }}</option>
              <option *ngIf="canViewInactive" value="graduated">{{ 'students.enums.status.graduated' | translate }}</option>
              <option *ngIf="canViewInactive" value="transferred">{{ 'students.enums.status.transferred' | translate }}</option>
              <option *ngIf="canViewInactive" value="alumni">{{ 'students.enums.status.alumni' | translate }}</option>
            </select>
          </div>
        </div>

        <div class="student-list-table-wrap" dir="ltr">
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
              <tr *ngIf="paginationTotal === 0 && !loadingStudents">
                <td colspan="7" class="text-center text-muted py-5">{{ 'students.list.noMatches' | translate }}</td>
              </tr>
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
                    <button
                      *ngIf="isAdmin && student.status === 'active'"
                      type="button"
                      class="btn-icon"
                      [attr.title]="'students.profile.markInactive' | translate"
                      (click)="deactivateStudent(student.id)"
                      [attr.data-testid]="'deactivate-student-' + student.id"
                    >
                      <i class="bi bi-person-dash" style="color: var(--clr-warning);"></i>
                    </button>
                    <button
                      *ngIf="isAdmin && student.status === 'inactive'"
                      type="button"
                      class="btn-icon"
                      [attr.title]="'students.profile.reactivate' | translate"
                      (click)="reactivateStudent(student.id)"
                      [attr.data-testid]="'reactivate-student-' + student.id"
                    >
                      <i class="bi bi-person-check" style="color: var(--clr-success);"></i>
                    </button>
                    <button
                      *ngIf="isAdmin && student.status === 'inactive'"
                      type="button"
                      class="btn-icon"
                      [attr.title]="'students.list.deletePermanent' | translate"
                      (click)="deleteStudentPermanently(student.id)"
                      [attr.data-testid]="'delete-student-' + student.id"
                    >
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
  /** Section PK when deep-linking from dashboard homeroom (?sectionId=). */
  sectionFilter = '';
  statusFilter = 'active';
  sortField = '';
  sortAsc = true;
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  /** value: class id string (canonical); label: display name */
  classOptions: { value: string; label: string }[] = [{ value: '', label: '' }];
  loadingStudents = true;
  exportMessage = '';
  exportMessageOk = true;
  private readonly subs = new Subscription();
  private readonly searchDebounced$ = new Subject<void>();
  /** Ignores stale HTTP responses when a newer list request was started. */
  private studentsListRequestSeq = 0;

  constructor(
    private studentService: StudentService,
    private academic: AcademicService,
    private auth: AuthService,
    private uiAccess: UiAccessService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private importExport: ImportExportService
  ) {}

  /** True when URL carries homeroom filters from the teacher dashboard. */
  get showHomeroomDeepLinkBanner(): boolean {
    return !!this.classFilter && !!this.sectionFilter;
  }

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
    return this.uiAccess.hasStudentMasterWriteAccess();
  }

  get canViewInactive(): boolean {
    return this.uiAccess.canViewInactiveRosterRows();
  }

  ngOnInit(): void {
    if (!this.canViewInactive) {
      this.statusFilter = 'active';
    }
    this.subs.add(this.translate.onLangChange.subscribe(() => this.cdr.markForCheck()));
    this.subs.add(
      this.searchDebounced$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.pageIndex = 0;
        this.fetchStudentsPage();
      })
    );
    this.subs.add(
      this.route.queryParamMap.subscribe(() => {
        this.applyHomeroomQueryFromRoute();
        if (this.classOptions.length > 1 && !this.loadingStudents) {
          this.pageIndex = 0;
          if (this.useServerPaging) {
            this.fetchStudentsPage();
          } else {
            this.filterStudents();
          }
        }
      })
    );
    this.reloadStudents();
  }

  /** Applies ?classId= & ?sectionId= from the route (e.g. teacher dashboard homeroom deep link). */
  private applyHomeroomQueryFromRoute(): void {
    const q = this.route.snapshot.queryParamMap;
    const cid = q.get('classId');
    const sid = q.get('sectionId');
    if (cid && /^\d+$/.test(cid)) {
      this.classFilter = cid;
    } else {
      this.classFilter = '';
    }
    this.sectionFilter = sid && /^\d+$/.test(sid) ? sid : '';
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
    if (!this.classFilter) {
      this.sectionFilter = '';
    }
    if (this.useServerPaging) {
      this.pageIndex = 0;
      this.fetchStudentsPage();
    } else {
      this.filterStudents();
    }
  }

  reloadStudents(): void {
    this.loadingStudents = true;
    if (this.useServerPaging) {
      this.subs.add(
        this.academic.getClasses().subscribe(classes => {
          this.classOptions = [
            { value: '', label: '' },
            ...sortSchoolClassesByGrade(classes.filter(c => c.id > 0)).map(c => ({ value: String(c.id), label: c.name || '' })),
          ];
          this.applyHomeroomQueryFromRoute();
          this.pageIndex = 0;
          this.loadingStudents = false;
          this.fetchStudentsPage();
        })
      );
      return;
    }
    this.subs.add(
      this.academic.getClasses().subscribe(classes => {
        this.classOptions = [
          { value: '', label: '' },
          ...sortSchoolClassesByGrade(classes.filter(c => c.id > 0)).map(c => ({ value: String(c.id), label: c.name || '' })),
        ];
        this.applyHomeroomQueryFromRoute();
        this.studentService.getStudents().subscribe(students => {
          this.students = students;
          this.loadingStudents = false;
          this.filterStudents();
        });
      })
    );
  }

  exportCanonicalStudentsCsv(): void {
    this.exportMessage = this.translate.instant('students.list.exportQueued');
    this.exportMessageOk = true;
    this.importExport.createExportJob('STUDENTS').subscribe({
      next: job => this.pollExportJob(job.id, 0),
      error: e => {
        this.exportMessage = e?.message || this.translate.instant('students.list.exportFailed');
        this.exportMessageOk = false;
      },
    });
  }

  private pollExportJob(jobId: number, attempt: number): void {
    this.importExport.getExportJob(jobId).subscribe({
      next: job => {
        const status = (job.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          this.importExport.downloadExportJobCsv(jobId).subscribe(blob => {
            this.saveBlob(blob, `canonical-students-${new Date().toISOString().slice(0, 10)}-${jobId}.csv`);
            this.exportMessage = this.translate.instant('students.list.exportDone');
            this.exportMessageOk = true;
          });
          return;
        }
        if (status === 'FAILED') {
          this.exportMessage = job.errorMessage || this.translate.instant('students.list.exportFailed');
          this.exportMessageOk = false;
          return;
        }
        if (attempt > 80) {
          this.exportMessage = this.translate.instant('students.list.exportTimeout');
          this.exportMessageOk = false;
          return;
        }
        setTimeout(() => this.pollExportJob(jobId, attempt + 1), 1500);
      },
      error: () => {
        this.exportMessage = this.translate.instant('students.list.exportFailed');
        this.exportMessageOk = false;
      },
    });
  }

  private saveBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearExportMessage(): void {
    this.exportMessage = '';
  }

  private fetchStudentsPage(): void {
    const classIdRaw = this.classFilter ? Number(this.classFilter) : NaN;
    const classId = Number.isFinite(classIdRaw) && classIdRaw > 0 ? classIdRaw : undefined;
    const sectionIdRaw = this.sectionFilter ? Number(this.sectionFilter) : NaN;
    const sectionId = Number.isFinite(sectionIdRaw) && sectionIdRaw > 0 ? sectionIdRaw : undefined;
    const seq = ++this.studentsListRequestSeq;
    this.subs.add(
      this.studentService
        .getStudentsPage({
          page: this.pageIndex,
          size: this.pageSize,
          search: this.searchTerm.trim() || undefined,
          classId,
          sectionId,
          status: this.statusFilter || undefined,
          sortBy: this.serverSortProperty(),
          direction: this.sortAsc ? 'asc' : 'desc',
        })
        .subscribe({
          next: page => {
            if (seq !== this.studentsListRequestSeq) return;
            this.serverTotal = page.totalElements;
            this.paginatedStudents = page.content;
            this.pageIndex = page.page;
            this.pageSize = page.size;
            this.loadingStudents = false;
            this.cdr.markForCheck();
          },
          error: () => {
            if (seq !== this.studentsListRequestSeq) return;
            this.loadingStudents = false;
            this.cdr.markForCheck();
          },
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
    if (this.classFilter) {
      const cid = Number(this.classFilter);
      if (Number.isFinite(cid) && cid > 0) {
        filtered = filtered.filter(s => s.classId === cid);
      } else {
        filtered = filtered.filter(s => s.className === this.classFilter);
      }
    }
    if (this.sectionFilter) {
      const sid = Number(this.sectionFilter);
      if (Number.isFinite(sid) && sid > 0) {
        filtered = filtered.filter(s => (s.sectionId ?? 0) === sid);
      }
    }
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

  deactivateStudent(id: number): void {
    const st = this.students.find(s => s.id === id);
    const name = st
      ? `${st.firstName} ${st.lastName}`
      : this.translate.instant('students.list.confirmDelete.fallbackName');
    this.confirmDialog
      .confirm({
        title: this.translate.instant('students.profile.confirmInactive.title'),
        message: this.translate.instant('students.profile.confirmInactive.message', { name }),
        details: [
          st ? this.translate.instant('students.profile.confirmInactive.detailAdmission', { no: st.admissionNumber }) : undefined,
          st
            ? this.translate.instant('students.profile.confirmInactive.detailClass', {
                class: `${st.className} ${st.sectionName || ''}`.trim(),
              })
            : undefined,
        ].filter((x): x is string => !!x),
        variant: 'warning',
        confirmLabel: this.translate.instant('students.profile.confirmInactive.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.studentService.updateStudent(id, { status: 'inactive' }).subscribe(() => {
          if (this.useServerPaging) {
            this.fetchStudentsPage();
          } else {
            this.students = this.students.map(s => (s.id === id ? { ...s, status: 'inactive' } : s));
            this.filterStudents();
          }
        });
      });
  }

  reactivateStudent(id: number): void {
    const st = this.students.find(s => s.id === id);
    const name = st ? `${st.firstName} ${st.lastName}` : this.translate.instant('students.list.confirmDelete.fallbackName');
    this.confirmDialog
      .confirm({
        title: this.translate.instant('students.list.lifecycleConfirm.reactivate.title'),
        message: this.translate.instant('students.list.lifecycleConfirm.reactivate.message', { name }),
        details: [
          this.translate.instant('students.list.lifecycleConfirm.reactivate.detailVisible'),
          this.translate.instant('students.list.lifecycleConfirm.reactivate.detailReversible'),
        ],
        variant: 'warning',
        confirmLabel: this.translate.instant('students.list.lifecycleConfirm.reactivate.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.studentService.updateStudent(id, { status: 'active' }).subscribe(() => {
          if (this.useServerPaging) this.fetchStudentsPage();
          else {
            this.students = this.students.map(s => (s.id === id ? { ...s, status: 'active' } : s));
            this.filterStudents();
          }
        });
      });
  }

  deleteStudentPermanently(id: number): void {
    const st = this.students.find(s => s.id === id);
    const name = st ? `${st.firstName} ${st.lastName}` : this.translate.instant('students.list.confirmDelete.fallbackName');
    this.confirmDialog
      .confirm({
        title: this.translate.instant('students.list.lifecycleConfirm.deletePermanent.title'),
        message: this.translate.instant('students.list.lifecycleConfirm.deletePermanent.message', { name }),
        details: [
          st ? this.translate.instant('students.list.confirmDelete.detailAdmission', { no: st.admissionNumber }) : undefined,
          this.translate.instant('students.list.lifecycleConfirm.deletePermanent.detailHidden'),
          this.translate.instant('students.list.lifecycleConfirm.deletePermanent.detailFinal'),
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: this.translate.instant('students.list.lifecycleConfirm.deletePermanent.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.studentService.deleteStudent(id).subscribe(() => {
          if (this.useServerPaging) this.fetchStudentsPage();
          else {
            this.students = this.students.filter(s => s.id !== id);
            this.filterStudents();
          }
        });
      });
  }
}
