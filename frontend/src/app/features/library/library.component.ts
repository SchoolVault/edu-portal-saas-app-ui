import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Book, BookIssue, Student } from '../../core/models/models';
import { LibraryCatalogFilter, LibraryService } from '../../core/services/library.service';
import { StudentService } from '../../core/services/student.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { debounceTime, filter } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { runtimeConfig } from '../../core/config/runtime-config';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective, SchoolClassNamePipe],
  styleUrl: './library.component.css',
  template: `
    <div data-testid="library-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'library.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'library.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAll()" [disabled]="refreshing">
            <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? ('library.refreshing' | translate) : ('library.refresh' | translate) }}
          </button>
          <button *ngIf="canManageCatalog" type="button" class="btn-primary-erp btn-sm" data-testid="add-book-btn" (click)="openBookModal()">
            <i class="bi bi-plus-lg"></i> {{ 'library.addBook' | translate }}
          </button>
        </div>
      </div>
      <div *ngIf="readOnlyHintVisible" class="alert alert-info py-2 small mb-3" style="border-radius: var(--radius-md);">
        <i class="bi bi-info-circle me-1"></i>{{ libraryReadOnlyKey | translate }}
      </div>
      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'catalog'" (click)="tab = 'catalog'; loadBooks()">{{ 'library.tabCatalog' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'issued'" (click)="tab = 'issued'; loadIssues()">{{ 'library.tabCirculation' | translate }}</button>
      </div>
      <div *ngIf="tab === 'catalog'" class="animate-in">
        <div class="erp-card">
          <div class="erp-filter-toolbar mb-3 w-100">
            <div class="search-input-wrapper erp-filter-toolbar__search">
              <i class="bi bi-search"></i>
              <input type="text" class="erp-input" erpI18nPh="library.searchPlaceholder" [(ngModel)]="searchTerm" (input)="onBookSearchInput()" data-testid="book-search">
            </div>
            <div class="erp-filter-toolbar__actions">
              <div>
                <label class="erp-label d-block mb-1 small">{{ 'library.labelCategory' | translate }}</label>
                <select class="erp-select" style="width: 170px;" [(ngModel)]="catalogCategory" (change)="loadBooks()" [attr.aria-label]="'library.labelCategory' | translate">
                  <option value="">{{ 'library.allCategories' | translate }}</option>
                  <option *ngFor="let c of bookCategories" [value]="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="erp-label d-block mb-1 small">{{ 'library.labelCatalog' | translate }}</label>
                <select class="erp-select" style="width: 170px;" [(ngModel)]="catalogFilter" (change)="loadBooks()" [attr.aria-label]="'library.labelCatalog' | translate">
                  <option value="active">{{ 'library.catalogActive' | translate }}</option>
                  <option value="inactive">{{ 'library.catalogInactive' | translate }}</option>
                  <option value="all">{{ 'library.catalogAll' | translate }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="erp-table-scroll">
          <table class="erp-table library-books-table" data-testid="books-table">
            <thead>
              <tr>
                <th>{{ 'library.thTitle' | translate }}</th><th>{{ 'library.thAuthor' | translate }}</th><th>{{ 'library.thIsbn' | translate }}</th><th class="library-category-cell">{{ 'library.thCategory' | translate }}</th><th>{{ 'library.thCopies' | translate }}</th><th>{{ 'library.thOnLoan' | translate }}</th><th class="library-status-cell">{{ 'library.thStatus' | translate }}</th><th>{{ 'library.thShelf' | translate }}</th>
                <th *ngIf="canManageCatalog || canCirculateBooks">{{ 'library.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of books">
                <td><strong>{{ b.title }}</strong></td>
                <td>{{ b.author }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ b.isbn }}</td>
                <td class="library-category-cell">
                  <span
                    class="badge-erp badge-subject-pill library-category-pill"
                    [attr.title]="(b.category || '').trim() || null"
                  >{{ (b.category || '').trim() || '—' }}</span>
                </td>
                <td>
                  <span [style.color]="b.availableCopies > 0 ? 'var(--clr-success)' : 'var(--clr-danger)'">{{ b.availableCopies }}/{{ b.totalCopies }}</span>
                  {{ 'library.availableSuffix' | translate }}
                </td>
                <td>{{ onLoan(b) }}</td>
                <td class="library-status-cell">
                  <div class="library-status-wrap">
                    <span *ngIf="b.catalogActive === false" class="badge-erp badge-warning library-status-pill">{{ 'library.statusInactive' | translate }}</span>
                    <span *ngIf="b.catalogActive !== false && b.availableCopies <= 0" class="badge-erp badge-danger library-status-pill">{{ 'library.statusOutOfStock' | translate }}</span>
                    <span *ngIf="b.catalogActive !== false && b.availableCopies > 0" class="badge-erp badge-success library-status-pill">{{ 'library.statusInStock' | translate }}</span>
                  </div>
                </td>
                <td>{{ b.shelfLocation }}</td>
                <td *ngIf="canManageCatalog || canCirculateBooks" class="text-nowrap">
                  <button
                    *ngIf="canCirculateBooks && b.catalogActive !== false && b.availableCopies > 0"
                    type="button"
                    class="btn-outline-erp btn-xs"
                    (click)="openIssueModal(b)"
                  >{{ 'library.issue' | translate }}</button>
                  <button
                    *ngIf="canManageCatalog && b.catalogActive !== false"
                    type="button"
                    class="btn-outline-erp btn-xs ms-1"
                    (click)="deactivateBook(b)"
                  >{{ 'library.remove' | translate }}</button>
                  <button
                    *ngIf="canManageCatalog && b.catalogActive === false"
                    type="button"
                    class="btn-outline-erp btn-xs"
                    (click)="reactivateBook(b)"
                  >{{ 'library.restore' | translate }}</button>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <p *ngIf="!books.length" class="text-muted small mb-0">{{ 'library.emptyFilters' | translate }}</p>
          <app-erp-pagination
            *ngIf="booksTotal > 0"
            [totalElements]="booksTotal"
            [pageIndex]="bookPageIndex"
            [pageSize]="bookPageSize"
            (pageIndexChange)="onBookPageIndexChange($event)"
            (pageSizeChange)="onBookPageSizeChange($event)"
          />
        </div>
      </div>
      <div *ngIf="tab === 'issued'" class="animate-in">
        <div class="erp-card">
          <div class="erp-filter-toolbar mb-3">
            <div>
              <label class="erp-label d-block mb-1 small">{{ 'library.labelIssueStatus' | translate }}</label>
              <select class="erp-select" style="width: 180px;" [(ngModel)]="issueStatusFilter" (change)="loadIssues()">
                <option value="">{{ 'library.issueFilterAll' | translate }}</option>
                <option value="issued">{{ 'library.issueFilterIssued' | translate }}</option>
                <option value="overdue">{{ 'library.issueFilterOverdue' | translate }}</option>
                <option value="returned">{{ 'library.issueFilterReturned' | translate }}</option>
              </select>
            </div>
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="loadIssues()"><i class="bi bi-arrow-clockwise"></i> {{ 'library.refresh' | translate }}</button>
          </div>
          <div class="erp-table-scroll">
          <table class="erp-table library-issues-table" data-testid="issued-books-table">
            <thead><tr><th>{{ 'library.thBook' | translate }}</th><th>{{ 'library.thStudent' | translate }}</th><th>{{ 'library.thIssue' | translate }}</th><th>{{ 'library.thDue' | translate }}</th><th class="library-issue-status-cell">{{ 'library.thStatus' | translate }}</th><th>{{ 'library.thFine' | translate }}</th><th *ngIf="canCirculateBooks">{{ 'library.thReturn' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let issue of issues">
                <td><strong>{{ issue.bookTitle }}</strong></td>
                <td>{{ issue.studentName }}</td>
                <td>{{ issue.issueDate }}</td>
                <td>{{ issue.dueDate }}</td>
                <td class="library-issue-status-cell"><span class="badge-erp library-status-pill" [ngClass]="{'badge-success': issue.status === 'returned', 'badge-info': issue.status === 'issued', 'badge-danger': issue.status === 'overdue'}">{{ issueStatusLabel(issue.status) }}</span></td>
                <td [style.color]="issue.fine > 0 ? 'var(--clr-danger)' : ''">₹{{ issue.fine | number:'1.2-2':'en-IN' }}</td>
                <td *ngIf="canCirculateBooks">
                  <button *ngIf="issue.status === 'issued' || issue.status === 'overdue'" type="button" class="btn-outline-erp btn-xs" (click)="openReturnModal(issue)">{{ 'library.return' | translate }}</button>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <app-erp-pagination
            *ngIf="issuesTotal > 0"
            [totalElements]="issuesTotal"
            [pageIndex]="issuePageIndex"
            [pageSize]="issuePageSize"
            (pageIndexChange)="onIssuePageIndexChange($event)"
            (pageSizeChange)="onIssuePageSizeChange($event)"
          />
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="bookModal" (click)="bookModal = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'library.modalAddTitle' | translate }}</h3><button type="button" class="btn-icon" (click)="bookModal = false"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'library.thTitle' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.title">
          <label class="erp-label">{{ 'library.thAuthor' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.author">
          <label class="erp-label">{{ 'library.thIsbn' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.isbn">
          <label class="erp-label">{{ 'library.thCategory' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.category">
          <label class="erp-label">{{ 'library.thCopies' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="bookForm.totalCopies">
          <label class="erp-label">{{ 'library.thShelf' | translate }}</label>
          <input class="erp-input" [(ngModel)]="bookForm.shelfLocation">
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="bookModal = false">{{ 'library.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="saveBook()">{{ 'library.save' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="returnIssue" (click)="returnIssue = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'library.modalReturnTitle' | translate }}</h3><button type="button" class="btn-icon" (click)="returnIssue = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">{{ 'library.returnSummary' | translate: { title: returnIssue.bookTitle, due: returnIssue.dueDate } }}</p>
          <label class="erp-label">{{ 'library.labelReturnDate' | translate }}</label>
          <app-erp-date-picker class="mb-2" [(ngModel)]="returnForm.returnDate" placeholderI18nKey="library.phReturnDate" />
          <label class="erp-label">{{ 'library.labelFinePerDay' | translate }}</label>
          <input type="number" class="erp-input mb-2" [(ngModel)]="returnForm.finePerDay" min="0" step="1">
          <p class="small text-muted mb-0">{{ 'library.fineHelp' | translate }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="returnIssue = null">{{ 'library.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="confirmReturn()">{{ 'library.confirmReturn' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="issueBook" (click)="closeIssueModal()">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'library.issueHeading' | translate: { title: issueBook.title } }}</h3><button type="button" class="btn-icon" (click)="closeIssueModal()"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">{{ 'library.issueCopiesAvailable' | translate: { avail: issueBook.availableCopies, total: issueBook.totalCopies } }}</p>
          <div *ngIf="!students.length" class="alert alert-warning py-2 small">{{ 'library.noStudentsLoaded' | translate }}</div>
          <label class="erp-label">{{ 'library.thStudent' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="issueForm.studentId" (ngModelChange)="syncIssueStudent()">
            <option [ngValue]="null">{{ 'library.selectStudent' | translate }}</option>
            <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }} · {{ s.className | schoolClassName }}</option>
          </select>
          <label class="erp-label">{{ 'library.labelDueDays' | translate }}</label>
          <input class="erp-input mb-2" type="number" min="1" [(ngModel)]="issueForm.dueDays">
          <p *ngIf="issueError" class="text-danger small mb-0">{{ issueError }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="closeIssueModal()">{{ 'library.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="saveIssue()">{{ 'library.issue' | translate }}</button>
        </div>
      </div>
    </div>
  `
})
export class LibraryComponent implements OnInit, OnDestroy {
  readonly useServerPaging = !runtimeConfig.useMocks;

  tab = 'catalog';
  searchTerm = '';
  catalogCategory = '';
  catalogFilter: LibraryCatalogFilter = 'active';
  issueStatusFilter = '';
  bookCategories: string[] = [];
  private booksFull: Book[] = [];
  books: Book[] = [];
  booksTotal = 0;
  bookPageIndex = 0;
  bookPageSize = DEFAULT_ERP_PAGE_SIZE;
  private issuesFull: BookIssue[] = [];
  issues: BookIssue[] = [];
  issuesTotal = 0;
  issuePageIndex = 0;
  issuePageSize = DEFAULT_ERP_PAGE_SIZE;
  students: Student[] = [];
  /** Add / remove / restore catalog rows — admin, library_staff login, or teacher with library duty / JWT LIBRARY_MANAGE. */
  canManageCatalog = false;
  /** Issue and return — same cohort as circulation on the API (LIBRARY_MANAGE or LIBRARY_CIRCULATION), not all teachers. */
  canCirculateBooks = false;
  readOnlyHintVisible = false;
  refreshing = false;
  bookModal = false;
  bookForm = { title: '', author: '', isbn: '', category: '', totalCopies: 1, shelfLocation: '' };
  issueBook: Book | null = null;
  issueForm = { studentId: null as number | null, studentName: '', dueDays: 14 };
  issueError = '';
  returnIssue: BookIssue | null = null;
  returnForm = { returnDate: '', finePerDay: '' as string | number };

  private readonly booksSearch$ = new Subject<void>();
  private readonly subs = new Subscription();
  private booksReqSeq = 0;
  private issuesReqSeq = 0;

  constructor(
    private libraryService: LibraryService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private authService: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService
  ) {}

  get libraryReadOnlyKey(): string {
    return this.authService.getNormalizedRole() === 'super_admin' ? 'library.readOnlyHintSuperAdmin' : 'library.readOnlyHintTeacher';
  }

  issueStatusLabel(raw: string): string {
    const k = `library.issueStatus.${raw}`;
    const t = this.translate.instant(k);
    return t !== k ? t : raw;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
    this.subs.add(
      this.booksSearch$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.bookPageIndex = 0;
        this.fetchBooksPage();
      })
    );
    const nr = this.authService.getNormalizedRole();
    this.readOnlyHintVisible = false;
    if (nr === 'super_admin') {
      this.canManageCatalog = false;
      this.canCirculateBooks = false;
      this.readOnlyHintVisible = true;
    } else if (nr === 'admin' || nr === 'library_staff') {
      this.canManageCatalog = true;
      this.canCirculateBooks = true;
    } else if (nr === 'teacher') {
      this.applyTeacherLibraryAccess();
    } else {
      this.canManageCatalog = false;
      this.canCirculateBooks = false;
    }
    this.rebuildCategories();
    this.loadBooks();
    this.studentService.getStudents().subscribe(s => (this.students = s || []));
  }

  /**
   * Mirrors backend {@code AuthService.resolveJwtPermissions}: teachers get library actions only when
   * JWT includes LIBRARY_* (real API) or mock teacher row has {@link Teacher.libraryStaffRole}.
   */
  private applyTeacherLibraryAccess(): void {
    const jwt = this.authService.getJwtPermissionAuthorities();
    const jwtManage = jwt.has('LIBRARY_MANAGE');
    const jwtCirc = jwt.has('LIBRARY_CIRCULATION');
    if (jwtManage || jwtCirc) {
      this.canManageCatalog = jwtManage;
      this.canCirculateBooks = jwtManage || jwtCirc;
      this.readOnlyHintVisible = !this.canManageCatalog && !this.canCirculateBooks;
      return;
    }
    const me = this.authService.getCurrentUser();
    this.teacherService.getTeachers().subscribe(list => {
      const row = (list || []).find(t => t.userId === me?.id);
      const libStaff = !!row?.libraryStaffRole;
      this.canManageCatalog = libStaff;
      this.canCirculateBooks = libStaff;
      this.readOnlyHintVisible = !libStaff;
    });
  }

  onLoan(b: Book): number {
    return Math.max(0, b.totalCopies - b.availableCopies);
  }

  refreshAll(): void {
    this.refreshing = true;
    this.rebuildCategories();
    this.studentService.getStudents().subscribe({
      next: s => {
        this.students = s || [];
        this.loadBooks();
        this.loadIssues();
        this.refreshing = false;
      },
      error: () => {
        this.loadBooks();
        this.loadIssues();
        this.refreshing = false;
      }
    });
  }

  private rebuildCategories(): void {
    if (this.useServerPaging) {
      this.libraryService.getBooksPage({ page: 0, size: 500, catalogScope: 'ALL' }).subscribe(p => {
        const set = new Set<string>();
        (p.content || []).forEach(b => {
          if (b.category?.trim()) set.add(b.category.trim());
        });
        this.bookCategories = Array.from(set).sort();
      });
      return;
    }
    this.libraryService.listBooks(undefined, undefined, 'all', true).subscribe(all => {
      const set = new Set<string>();
      (all || []).forEach(b => {
        if (b.category?.trim()) set.add(b.category.trim());
      });
      this.bookCategories = Array.from(set).sort();
    });
  }

  onBookSearchInput(): void {
    if (this.useServerPaging) {
      this.booksSearch$.next();
    } else {
      this.loadBooks();
    }
  }

  loadBooks(): void {
    if (this.useServerPaging) {
      this.bookPageIndex = 0;
      this.fetchBooksPage();
      return;
    }
    this.libraryService.listBooks(this.searchTerm || undefined, this.catalogCategory || undefined, this.catalogFilter).subscribe(b => {
      this.booksFull = b || [];
      this.bookPageIndex = 0;
      this.applyBooksPage();
    });
  }

  private fetchBooksPage(): void {
    const seq = ++this.booksReqSeq;
    const scope = this.catalogFilter === 'active' ? 'ACTIVE' : this.catalogFilter === 'inactive' ? 'INACTIVE' : 'ALL';
    this.libraryService
      .getBooksPage({
        page: this.bookPageIndex,
        size: this.bookPageSize,
        search: this.searchTerm || undefined,
        category: this.catalogCategory || undefined,
        catalogScope: scope,
      })
      .subscribe(p => {
        if (seq !== this.booksReqSeq) return;
        this.books = p.content;
        this.booksTotal = p.totalElements;
        this.bookPageIndex = p.page;
        this.bookPageSize = p.size;
      });
  }

  private applyBooksPage(): void {
    const slice = sliceToPage(this.booksFull, this.bookPageIndex, this.bookPageSize);
    this.books = slice.content;
    this.booksTotal = slice.totalElements;
    this.bookPageIndex = slice.page;
  }

  onBookPageIndexChange(idx: number): void {
    this.bookPageIndex = idx;
    if (this.useServerPaging) this.fetchBooksPage();
    else this.applyBooksPage();
  }

  onBookPageSizeChange(size: number): void {
    this.bookPageSize = size;
    this.bookPageIndex = 0;
    if (this.useServerPaging) this.fetchBooksPage();
    else this.applyBooksPage();
  }

  loadIssues(): void {
    if (this.useServerPaging) {
      this.issuePageIndex = 0;
      this.fetchIssuesPage();
      return;
    }
    this.libraryService.listIssues(this.issueStatusFilter || undefined).subscribe(i => {
      this.issuesFull = i || [];
      this.issuePageIndex = 0;
      this.applyIssuesPage();
    });
  }

  private fetchIssuesPage(): void {
    const seq = ++this.issuesReqSeq;
    this.libraryService
      .getIssuesPage({
        page: this.issuePageIndex,
        size: this.issuePageSize,
        status: this.issueStatusFilter || undefined,
      })
      .subscribe(p => {
        if (seq !== this.issuesReqSeq) return;
        this.issues = p.content;
        this.issuesTotal = p.totalElements;
        this.issuePageIndex = p.page;
        this.issuePageSize = p.size;
      });
  }

  private applyIssuesPage(): void {
    const slice = sliceToPage(this.issuesFull, this.issuePageIndex, this.issuePageSize);
    this.issues = slice.content;
    this.issuesTotal = slice.totalElements;
    this.issuePageIndex = slice.page;
  }

  onIssuePageIndexChange(idx: number): void {
    this.issuePageIndex = idx;
    if (this.useServerPaging) this.fetchIssuesPage();
    else this.applyIssuesPage();
  }

  onIssuePageSizeChange(size: number): void {
    this.issuePageSize = size;
    this.issuePageIndex = 0;
    if (this.useServerPaging) this.fetchIssuesPage();
    else this.applyIssuesPage();
  }

  openBookModal(): void {
    this.bookForm = { title: '', author: '', isbn: '', category: '', totalCopies: 1, shelfLocation: '' };
    this.bookModal = true;
  }

  saveBook(): void {
    if (!this.bookForm.title.trim()) return;
    this.libraryService
      .addBook({
        ...this.bookForm,
        totalCopies: Number(this.bookForm.totalCopies),
        availableCopies: Number(this.bookForm.totalCopies)
      })
      .subscribe({
        next: () => {
          this.bookModal = false;
          this.rebuildCategories();
          this.loadBooks();
        },
        error: (e: Error) => alert(e?.message || this.translate.instant('library.errAddBook'))
      });
  }

  openIssueModal(b: Book): void {
    this.issueError = '';
    this.issueBook = b;
    this.issueForm = { studentId: null, studentName: '', dueDays: 14 };
  }

  closeIssueModal(): void {
    this.issueBook = null;
    this.issueError = '';
  }

  syncIssueStudent(): void {
    const sid = this.issueForm.studentId;
    const s = sid != null ? this.students.find(x => x.id === sid) : undefined;
    this.issueForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  saveIssue(): void {
    this.issueError = '';
    if (!this.issueBook) return;
    if (this.issueForm.studentId == null) {
      this.issueError = this.translate.instant('library.errSelectStudent');
      return;
    }
    this.libraryService
      .issueBook(this.issueBook.id, this.issueForm.studentId, this.issueForm.studentName, Number(this.issueForm.dueDays))
      .subscribe({
        next: () => {
          this.closeIssueModal();
          this.loadBooks();
          this.loadIssues();
        },
        error: (e: Error) => {
          this.issueError = e?.message || this.translate.instant('library.errIssueFailed');
        }
      });
  }

  deactivateBook(b: Book): void {
    const t = this.translate.instant.bind(this.translate);
    this.confirmDialog
      .confirm({
        title: t('library.confirmInactiveTitle'),
        message: t('library.confirmInactiveMessage', { title: b.title }),
        details: [b.author ? t('library.detailAuthor', { author: b.author }) : undefined, b.isbn ? t('library.detailIsbn', { isbn: b.isbn }) : undefined].filter(
          (x): x is string => !!x
        ),
        variant: 'warning',
        confirmLabel: t('library.confirmInactive'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.libraryService.setCatalogActive(b.id, false).subscribe({
          next: () => this.loadBooks(),
          error: (e: Error) => alert(e?.message || this.translate.instant('library.errCatalog')),
        });
      });
  }

  reactivateBook(b: Book): void {
    this.libraryService.setCatalogActive(b.id, true).subscribe({
      next: () => this.loadBooks(),
      error: (e: Error) => alert(e?.message || this.translate.instant('library.errCatalog'))
    });
  }

  openReturnModal(issue: BookIssue): void {
    this.returnIssue = issue;
    this.returnForm = {
      returnDate: new Date().toISOString().split('T')[0],
      finePerDay: ''
    };
  }

  confirmReturn(): void {
    if (!this.returnIssue) return;
    const fineRaw = this.returnForm.finePerDay;
    const finePerDay = fineRaw === '' || fineRaw === null ? undefined : Number(fineRaw);
    this.libraryService
      .returnBook(this.returnIssue.id, {
        returnDate: this.returnForm.returnDate || undefined,
        finePerDay: finePerDay != null && !Number.isNaN(finePerDay) ? finePerDay : undefined
      })
      .subscribe({
        next: () => {
          this.returnIssue = null;
          this.loadIssues();
          this.loadBooks();
        },
        error: (e: Error) => alert(e?.message || this.translate.instant('library.errReturnFailed'))
      });
  }
}
