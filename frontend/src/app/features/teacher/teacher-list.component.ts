import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { SchoolClass, Teacher } from '../../core/models/models';
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
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
  styles: [
    `
      .teacher-list-table-wrap {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .teacher-list-table-wrap .erp-table {
        min-width: 720px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary) 20%);
      }
      .teacher-list-page {
        color: var(--clr-text);
      }
      .teacher-list-page .erp-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 82%, var(--clr-primary) 18%);
        border-radius: 14px;
        box-shadow: 0 8px 22px color-mix(in srgb, var(--clr-primary) 8%, transparent);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--clr-surface) 97%, var(--clr-primary) 3%) 0%,
          var(--clr-surface) 100%
        );
      }
      .teacher-list-table-wrap .erp-table thead th {
        background: color-mix(in srgb, var(--clr-primary) 11%, var(--clr-surface));
        color: color-mix(in srgb, var(--clr-text) 80%, var(--clr-primary) 20%);
        font-weight: 700;
        border-bottom-color: color-mix(in srgb, var(--clr-border) 68%, var(--clr-primary) 32%);
      }
      .teacher-list-table-wrap .erp-table tbody tr:nth-child(even) td {
        background: color-mix(in srgb, var(--clr-surface) 95%, var(--clr-primary) 5%);
      }
      .teacher-list-table-wrap .erp-table tbody tr:hover td {
        background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
      }
      .teacher-list-filter-toolbar {
        align-items: flex-end !important;
      }
      @media (max-width: 576px) {
        .search-input-wrapper {
          min-width: 100% !important;
          width: 100%;
        }
        .search-input-wrapper .erp-input {
          width: 100%;
        }
        .teacher-list-filter-wrap {
          min-width: 100% !important;
          width: 100%;
        }
        .teacher-list-table-wrap .erp-table {
          min-width: 640px;
        }
      }
    `,
  ],
  template: `
    <div class="teacher-list-page" data-testid="teacher-list-page">
      <header class="erp-page-header animate-in">
        <div>
          <h1 class="erp-page-header__title">{{ 'teachers.list.title' | translate }}</h1>
          <p class="erp-page-header__lead">
            {{ isAdmin ? ('teachers.list.leadAdmin' | translate) : ('teachers.list.leadTeacher' | translate) }}
          </p>
        </div>
        <div class="erp-page-header__actions">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadTeachers()"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> {{ 'teachers.list.refresh' | translate }}</button>
          <a *ngIf="isAdmin" routerLink="/app/teachers/new" class="btn-primary-erp btn-sm" data-testid="add-teacher-btn">
            <i class="bi bi-plus-lg" aria-hidden="true"></i><span>{{ 'teachers.list.add' | translate }}</span>
          </a>
        </div>
      </header>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="d-flex justify-content-between teacher-list-filter-toolbar mb-3 flex-wrap gap-2">
          <div class="search-input-wrapper" style="min-width: 300px;">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" erpI18nPh="teachers.list.searchPlaceholder" [(ngModel)]="searchTerm" (input)="onSearchInput()" data-testid="teacher-search">
          </div>
          <div class="teacher-list-filter-wrap" style="min-width: 220px;">
            <label class="erp-label mb-1">{{ 'teachers.list.subjectFilterLabel' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedSubject" (ngModelChange)="onSubjectFilterChange()" data-testid="teacher-subject-filter">
              <option value="">{{ 'teachers.list.subjectFilterAll' | translate }}</option>
              <option *ngFor="let subject of subjectOptions" [value]="subject">{{ subject }}</option>
            </select>
          </div>
        </div>
        <div class="teacher-list-table-wrap" dir="ltr">
          <table class="erp-table" data-testid="teacher-table">
            <thead>
              <tr><th>{{ 'teachers.list.thTeacher' | translate }}</th><th>{{ 'teachers.list.thSpecialization' | translate }}</th><th>{{ 'teachers.list.thSubjects' | translate }}</th><th>{{ 'teachers.list.thHomeroom' | translate }}</th><th>{{ 'teachers.list.thJoinDate' | translate }}</th><th>{{ 'teachers.list.thStatus' | translate }}</th><th>{{ 'teachers.list.thActions' | translate }}</th></tr>
            </thead>
            <tbody>
              <tr *ngIf="paginationTotal === 0">
                <td colspan="7" class="text-center text-muted py-5">{{ 'teachers.list.noMatches' | translate }}</td>
              </tr>
              <tr *ngFor="let t of pagedTeachers" [attr.data-testid]="'teacher-row-' + t.id">
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
                      <div *ngIf="t.email" style="font-size: 12px; color: var(--clr-text-secondary);">{{ t.email }}</div>
                      <div *ngIf="!t.email && !isAdmin" style="font-size: 12px; color: var(--clr-text-muted); font-style: italic;">
                        {{ 'teachers.list.contactNotListed' | translate }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ t.specialization }}</td>
                <td>
                  <ng-container *ngIf="t.subjects.length; else noSubjectsCell">
                    <span class="badge-erp badge-subject-pill me-1" *ngFor="let s of t.subjects!.slice(0, 2)">{{ s }}</span>
                  </ng-container>
                  <ng-template #noSubjectsCell><span class="text-muted small">—</span></ng-template>
                </td>
                <td>
                  <ng-container *ngIf="homeroomLine(t) as line; else noHomeroom">
                    <span>{{ line }}</span>
                  </ng-container>
                  <ng-template #noHomeroom><span class="text-muted small">{{ 'teachers.list.homeroomNone' | translate }}</span></ng-template>
                </td>
                <td>{{ t.joinDate }}</td>
                <td><span class="badge-erp badge-success">{{ statusLabel(t.status) }}</span></td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/app/teachers', t.id]" class="btn-icon" [attr.title]="'teachers.list.viewProfile' | translate" [attr.data-testid]="'view-teacher-' + t.id">
                      <i class="bi bi-eye"></i>
                    </a>
                    <a *ngIf="isAdmin" [routerLink]="['/app/teachers', t.id, 'edit']" class="btn-icon" [attr.title]="'teachers.list.edit' | translate" [attr.data-testid]="'edit-teacher-' + t.id"><i class="bi bi-pencil"></i></a>
                    <button *ngIf="isAdmin" type="button" class="btn-icon" (click)="deleteTeacher(t.id)" [attr.title]="'teachers.list.deactivate' | translate" [attr.data-testid]="'delete-teacher-' + t.id"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
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
export class TeacherListComponent implements OnInit, OnDestroy {
  readonly useServerPaging = !runtimeConfig.useMocks;

  teachers: Teacher[] = [];
  filtered: Teacher[] = [];
  pagedTeachers: Teacher[] = [];
  subjectOptions: string[] = [];
  serverTotal = 0;
  searchTerm = '';
  selectedSubject = '';
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  private readonly subs = new Subscription();
  private readonly searchDebounced$ = new Subject<void>();
  private teachersListRequestSeq = 0;
  private allTeachersCache: Teacher[] = [];

  constructor(
    private teacherService: TeacherService,
    private academicService: AcademicService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  /** Localized class names, comma-separated (homeroom / class teacher only). */
  homeroomLine(t: Teacher): string {
    const names = t.homeroomClassNames ?? [];
    if (!names.length) return '';
    const sep = this.translate.instant('teachers.list.homeroomSeparator');
    return names.map(n => formatSchoolClassName(n, this.translate)).join(sep);
  }

  get paginationTotal(): number {
    return this.useServerPaging ? this.serverTotal : this.filtered.length;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  statusLabel(status: string): string {
    const key = 'teachers.enums.status.' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  teacherPortraitUrl(t: Teacher): string | null {
    return this.auth.getDirectoryTeacherAvatarDataUrl(t.id) || t.avatar || null;
  }

  ngOnInit(): void {
    this.subs.add(this.translate.onLangChange.subscribe(() => this.cdr.markForCheck()));
    this.subs.add(
      this.searchDebounced$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.pageIndex = 0;
        this.fetchTeachersPage();
      })
    );
    this.reloadTeachers();
    this.loadSubjectOptionsCatalog();
  }

  onSearchInput(): void {
    if (this.useServerPaging) {
      this.searchDebounced$.next();
    } else {
      this.filter();
    }
  }

  onSubjectFilterChange(): void {
    if (this.useServerPaging) {
      this.pageIndex = 0;
      this.fetchTeachersPage();
    } else {
      this.filter();
    }
  }

  reloadTeachers(): void {
    if (this.useServerPaging) {
      this.pageIndex = 0;
      this.fetchTeachersPage();
      return;
    }
    this.teacherService.getTeachers().subscribe(t => {
      this.teachers = t;
      this.subjectOptions = this.extractSubjectOptions(t);
      this.filter();
    });
  }

  private fetchTeachersPage(): void {
    const seq = ++this.teachersListRequestSeq;
    const hasSubjectFilter = !!this.selectedSubject.trim();
    this.subs.add(
      this.teacherService
        .getTeachersPage({
          page: this.pageIndex,
          size: this.pageSize,
          search: this.searchTerm.trim() || undefined,
          subject: this.selectedSubject || undefined,
        })
        .pipe(
          switchMap(page => {
            const needsCatalog =
              this.useServerPaging && page.content.some(t => !(t.homeroomClassNames?.length));
            if (!needsCatalog) {
              return of(page);
            }
            return this.academicService.getClasses().pipe(
              map(classes => ({
                ...page,
                content: this.fillHomeroomFromCatalog(page.content, classes),
              })),
              catchError(() => of(page))
            );
          })
        )
        .subscribe(page => {
          if (seq !== this.teachersListRequestSeq) return;
          const q = this.selectedSubject.trim().toLowerCase();
          const backendIgnoredSubjectFilter =
            hasSubjectFilter &&
            page.content.length > 0 &&
            page.content.some(t => !(t.subjects ?? []).some(s => s.toLowerCase().includes(q)));
          if (backendIgnoredSubjectFilter) {
            this.fallbackClientSubjectFilterPage();
            return;
          }
          this.serverTotal = page.totalElements;
          this.pagedTeachers = page.content;
          this.subjectOptions = this.extractSubjectOptions(page.content, this.subjectOptions);
          this.pageIndex = page.page;
          this.pageSize = page.size;
          this.cdr.markForCheck();
        })
    );
  }

  private loadSubjectOptionsCatalog(): void {
    if (!this.useServerPaging) {
      return;
    }
    this.subs.add(
      this.teacherService.getTeachers().subscribe(rows => {
        this.allTeachersCache = rows;
        this.subjectOptions = this.extractSubjectOptions(rows, this.subjectOptions);
        this.cdr.markForCheck();
      })
    );
  }

  /**
   * Safety fallback when backend ignores `subject` query filtering; keeps UX correct while API catches up.
   */
  private fallbackClientSubjectFilterPage(): void {
    const source = this.allTeachersCache.length ? this.allTeachersCache : this.pagedTeachers;
    const term = this.searchTerm.trim().toLowerCase();
    const subject = this.selectedSubject.trim().toLowerCase();
    const filtered = source.filter(t => {
      const nameOrSpec =
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(term) || (t.specialization || '').toLowerCase().includes(term);
      const subjectMatch = !subject || (t.subjects ?? []).some(s => (s || '').toLowerCase().includes(subject));
      return nameOrSpec && subjectMatch;
    });
    const page = sliceToPage(filtered, this.pageIndex, this.pageSize);
    this.serverTotal = filtered.length;
    this.pagedTeachers = page.content;
    this.pageIndex = page.page;
    this.subjectOptions = this.extractSubjectOptions(source, this.subjectOptions);
    this.cdr.markForCheck();
  }

  /**
   * When the paged teacher API omits homeroom labels (e.g. stale Redis cache), derive the same
   * section-aware labels as the profile fallback from {@link AcademicService#getClasses}.
   */
  private fillHomeroomFromCatalog(rows: Teacher[], classes: SchoolClass[]): Teacher[] {
    const byTeacher = TeacherListComponent.homeroomLabelsByTeacherId(classes);
    return rows.map(t => {
      if (t.homeroomClassNames?.length) {
        return t;
      }
      const labels = byTeacher.get(t.id);
      if (!labels?.length) {
        return t;
      }
      return { ...t, homeroomClassNames: labels };
    });
  }

  private static homeroomLabelsByTeacherId(classes: SchoolClass[]): Map<number, string[]> {
    const raw = new Map<number, Set<string>>();
    const add = (teacherId: number, label: string) => {
      let set = raw.get(teacherId);
      if (!set) {
        set = new Set<string>();
        raw.set(teacherId, set);
      }
      set.add(label);
    };
    for (const c of classes) {
      if (!c.sections?.length && c.classTeacherId != null) {
        add(c.classTeacherId, c.name);
      }
      for (const s of c.sections ?? []) {
        if (s.classTeacherId != null) {
          add(s.classTeacherId, `${c.name}-${s.name}`);
        }
      }
    }
    const out = new Map<number, string[]>();
    for (const [id, set] of raw) {
      out.set(id, Array.from(set).sort((a, b) => a.localeCompare(b)));
    }
    return out;
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase();
    const subjectNeedle = this.selectedSubject.toLowerCase();
    this.filtered = this.teachers.filter(t =>
      ((t.firstName + ' ' + t.lastName).toLowerCase().includes(term) || (t.specialization || '').toLowerCase().includes(term)) &&
      (!subjectNeedle || (t.subjects ?? []).some(s => (s || '').toLowerCase().includes(subjectNeedle)))
    );
    this.pageIndex = 0;
    this.applyPage();
  }

  private extractSubjectOptions(rows: Teacher[], existing: string[] = []): string[] {
    const options = new Set(existing);
    for (const teacher of rows) {
      for (const subject of teacher.subjects ?? []) {
        const clean = subject?.trim();
        if (clean) {
          options.add(clean);
        }
      }
    }
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }

  private applyPage(): void {
    const slice = sliceToPage(this.filtered, this.pageIndex, this.pageSize);
    this.pagedTeachers = slice.content;
    this.pageIndex = slice.page;
  }

  onPageIndexChange(idx: number): void {
    this.pageIndex = idx;
    if (this.useServerPaging) {
      this.fetchTeachersPage();
    } else {
      this.applyPage();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    if (this.useServerPaging) {
      this.fetchTeachersPage();
    } else {
      this.applyPage();
    }
  }

  deleteTeacher(id: number): void {
    if (!this.isAdmin) {
      return;
    }
    const t = this.teachers.find(x => x.id === id);
    const name = t
      ? `${t.firstName} ${t.lastName}`
      : this.translate.instant('teachers.list.confirmDelete.fallbackName');
    this.confirmDialog
      .confirm({
        title: this.translate.instant('teachers.list.confirmDelete.title'),
        message: this.translate.instant('teachers.list.confirmDelete.message', { name }),
        details: [
          t?.email ? this.translate.instant('teachers.list.confirmDelete.detailEmail', { email: t.email }) : undefined,
          t?.specialization
            ? this.translate.instant('teachers.list.confirmDelete.detailFocus', { focus: t.specialization })
            : undefined,
          this.translate.instant('teachers.list.confirmDelete.detailSoft'),
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: this.translate.instant('teachers.list.confirmDelete.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.teacherService.deleteTeacher(id).subscribe(() => {
          if (this.useServerPaging) {
            this.fetchTeachersPage();
          } else {
            this.teachers = this.teachers.filter(x => x.id !== id);
            this.filter();
          }
        });
      });
  }
}
