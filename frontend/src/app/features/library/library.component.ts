import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book, BookIssue, Student } from '../../core/models/models';
import { LibraryCatalogFilter, LibraryService } from '../../core/services/library.service';
import { StudentService } from '../../core/services/student.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent],
  template: `
    <div data-testid="library-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Library</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Catalog, circulation, and copy counts stay in sync when you issue or return</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAll()" [disabled]="refreshing">
            <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? 'Refreshing…' : 'Refresh' }}
          </button>
          <button *ngIf="canManageLibrary" type="button" class="btn-primary-erp btn-sm" data-testid="add-book-btn" (click)="openBookModal()">
            <i class="bi bi-plus-lg"></i> Add book
          </button>
        </div>
      </div>
      <div *ngIf="libraryReadOnlyHint" class="alert alert-info py-2 small mb-3" style="border-radius: var(--radius-md);">
        <i class="bi bi-info-circle me-1"></i>{{ libraryReadOnlyHint }}
      </div>
      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'catalog'" (click)="tab = 'catalog'; loadBooks()">Book catalog</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'issued'" (click)="tab = 'issued'; loadIssues()">Circulation</button>
      </div>
      <div *ngIf="tab === 'catalog'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
            <div class="search-input-wrapper flex-grow-1" style="min-width: 200px; max-width: 400px;">
              <i class="bi bi-search"></i>
              <input type="text" class="erp-input" placeholder="Search title, author, ISBN…" [(ngModel)]="searchTerm" (input)="loadBooks()" data-testid="book-search">
            </div>
            <div>
              <label class="erp-label d-block mb-1 small">Category</label>
              <select class="erp-select" style="min-width: 160px;" [(ngModel)]="catalogCategory" (change)="loadBooks()">
                <option value="">All categories</option>
                <option *ngFor="let c of bookCategories" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="erp-label d-block mb-1 small">Catalog</label>
              <select class="erp-select" style="min-width: 140px;" [(ngModel)]="catalogFilter" (change)="loadBooks()">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <table class="erp-table" data-testid="books-table">
            <thead>
              <tr>
                <th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Copies</th><th>On loan</th><th>Status</th><th>Shelf</th>
                <th *ngIf="canManageLibrary">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of books">
                <td><strong>{{ b.title }}</strong></td>
                <td>{{ b.author }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ b.isbn }}</td>
                <td><span class="badge-erp badge-neutral">{{ b.category }}</span></td>
                <td>
                  <span [style.color]="b.availableCopies > 0 ? 'var(--clr-success)' : 'var(--clr-danger)'">{{ b.availableCopies }}/{{ b.totalCopies }}</span>
                  available
                </td>
                <td>{{ onLoan(b) }}</td>
                <td>
                  <span *ngIf="b.catalogActive === false" class="badge-erp badge-warning">Inactive</span>
                  <span *ngIf="b.catalogActive !== false && b.availableCopies <= 0" class="badge-erp badge-danger">Out of stock</span>
                  <span *ngIf="b.catalogActive !== false && b.availableCopies > 0" class="badge-erp badge-success">In stock</span>
                </td>
                <td>{{ b.shelfLocation }}</td>
                <td *ngIf="canManageLibrary" class="text-nowrap">
                  <button
                    *ngIf="b.catalogActive !== false && b.availableCopies > 0"
                    type="button"
                    class="btn-outline-erp btn-xs"
                    (click)="openIssueModal(b)"
                  >Issue</button>
                  <button
                    *ngIf="b.catalogActive !== false"
                    type="button"
                    class="btn-outline-erp btn-xs ms-1"
                    (click)="deactivateBook(b)"
                  >Remove</button>
                  <button
                    *ngIf="b.catalogActive === false"
                    type="button"
                    class="btn-outline-erp btn-xs"
                    (click)="reactivateBook(b)"
                  >Restore</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!books.length" class="text-muted small mb-0">No titles match your filters.</p>
        </div>
      </div>
      <div *ngIf="tab === 'issued'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
            <div>
              <label class="erp-label d-block mb-1 small">Status</label>
              <select class="erp-select" style="min-width: 180px;" [(ngModel)]="issueStatusFilter" (change)="loadIssues()">
                <option value="">All active &amp; history</option>
                <option value="issued">Issued</option>
                <option value="overdue">Overdue</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadIssues()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          </div>
          <table class="erp-table" data-testid="issued-books-table">
            <thead><tr><th>Book</th><th>Student</th><th>Issue</th><th>Due</th><th>Status</th><th>Fine</th><th *ngIf="canManageLibrary">Return</th></tr></thead>
            <tbody>
              <tr *ngFor="let issue of issues">
                <td><strong>{{ issue.bookTitle }}</strong></td>
                <td>{{ issue.studentName }}</td>
                <td>{{ issue.issueDate }}</td>
                <td>{{ issue.dueDate }}</td>
                <td><span class="badge-erp" [ngClass]="{'badge-success': issue.status === 'returned', 'badge-info': issue.status === 'issued', 'badge-danger': issue.status === 'overdue'}">{{ issue.status }}</span></td>
                <td [style.color]="issue.fine > 0 ? 'var(--clr-danger)' : ''">₹{{ issue.fine | number:'1.2-2':'en-IN' }}</td>
                <td *ngIf="canManageLibrary">
                  <button *ngIf="issue.status === 'issued' || issue.status === 'overdue'" type="button" class="btn-outline-erp btn-xs" (click)="openReturnModal(issue)">Return</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="bookModal" (click)="bookModal = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Add book</h3><button type="button" class="btn-icon" (click)="bookModal = false"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">Title</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.title">
          <label class="erp-label">Author</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.author">
          <label class="erp-label">ISBN</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.isbn">
          <label class="erp-label">Category</label>
          <input class="erp-input mb-2" [(ngModel)]="bookForm.category">
          <label class="erp-label">Total copies</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="bookForm.totalCopies">
          <label class="erp-label">Shelf</label>
          <input class="erp-input" [(ngModel)]="bookForm.shelfLocation">
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="bookModal = false">Cancel</button>
          <button type="button" class="btn-primary-erp" (click)="saveBook()">Save</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="returnIssue" (click)="returnIssue = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Return book</h3><button type="button" class="btn-icon" (click)="returnIssue = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">{{ returnIssue.bookTitle }} · due {{ returnIssue.dueDate }}</p>
          <label class="erp-label">Return date</label>
          <app-erp-date-picker class="mb-2" [(ngModel)]="returnForm.returnDate" placeholder="Return date" />
          <label class="erp-label">Fine per overdue day (₹)</label>
          <input type="number" class="erp-input mb-2" [(ngModel)]="returnForm.finePerDay" min="0" step="1">
          <p class="small text-muted mb-0">Leave per-day rate empty to use the school default from settings / tenant config.</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="returnIssue = null">Cancel</button>
          <button type="button" class="btn-primary-erp" (click)="confirmReturn()">Confirm return</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="issueBook" (click)="closeIssueModal()">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Issue: {{ issueBook.title }}</h3><button type="button" class="btn-icon" (click)="closeIssueModal()"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">{{ issueBook.availableCopies }} of {{ issueBook.totalCopies }} copies available to lend.</p>
          <div *ngIf="!students.length" class="alert alert-warning py-2 small">No students loaded. Use Refresh, or check your account permissions.</div>
          <label class="erp-label">Student</label>
          <select class="erp-select mb-2" [(ngModel)]="issueForm.studentId" (ngModelChange)="syncIssueStudent()">
            <option [ngValue]="null">Select student</option>
            <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }} · {{ s.className }}</option>
          </select>
          <label class="erp-label">Due in (days)</label>
          <input class="erp-input mb-2" type="number" min="1" [(ngModel)]="issueForm.dueDays">
          <p *ngIf="issueError" class="text-danger small mb-0">{{ issueError }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="closeIssueModal()">Cancel</button>
          <button type="button" class="btn-primary-erp" (click)="saveIssue()">Issue</button>
        </div>
      </div>
    </div>
  `
})
export class LibraryComponent implements OnInit {
  tab = 'catalog';
  searchTerm = '';
  catalogCategory = '';
  catalogFilter: LibraryCatalogFilter = 'active';
  issueStatusFilter = '';
  bookCategories: string[] = [];
  books: Book[] = [];
  issues: BookIssue[] = [];
  students: Student[] = [];
  canManageLibrary = false;
  libraryReadOnlyHint = '';
  refreshing = false;
  bookModal = false;
  bookForm = { title: '', author: '', isbn: '', category: '', totalCopies: 1, shelfLocation: '' };
  issueBook: Book | null = null;
  issueForm = { studentId: null as number | null, studentName: '', dueDays: 14 };
  issueError = '';
  returnIssue: BookIssue | null = null;
  returnForm = { returnDate: '', finePerDay: '' as string | number };

  constructor(
    private libraryService: LibraryService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private authService: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    const r = (this.authService.getCurrentUser()?.role ?? '').toLowerCase();
    this.libraryReadOnlyHint = '';
    if (r === 'admin' || r === 'super_admin') {
      this.canManageLibrary = true;
    } else if (r === 'teacher') {
      const me = this.authService.getCurrentUser();
      this.teacherService.getTeachers().subscribe(list => {
        const row = (list || []).find(t => t.userId === me?.id);
        this.canManageLibrary = !!row?.libraryStaffRole;
        if (!this.canManageLibrary) {
          this.libraryReadOnlyHint =
            'Library catalog changes and circulation are limited to administrators and designated library staff (assistant, librarian, or head).';
        }
      });
    } else {
      this.canManageLibrary = false;
    }
    this.rebuildCategories();
    this.loadBooks();
    this.studentService.getStudents().subscribe(s => (this.students = s || []));
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
    this.libraryService.listBooks(undefined, undefined, 'all', true).subscribe(all => {
      const set = new Set<string>();
      (all || []).forEach(b => {
        if (b.category?.trim()) set.add(b.category.trim());
      });
      this.bookCategories = Array.from(set).sort();
    });
  }

  loadBooks(): void {
    this.libraryService.listBooks(this.searchTerm || undefined, this.catalogCategory || undefined, this.catalogFilter).subscribe(b => (this.books = b));
  }

  loadIssues(): void {
    this.libraryService.listIssues(this.issueStatusFilter || undefined).subscribe(i => (this.issues = i));
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
        error: (e: Error) => alert(e?.message || 'Could not add book')
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
      this.issueError = 'Please select a student.';
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
          this.issueError = e?.message || 'Could not issue book.';
        }
      });
  }

  deactivateBook(b: Book): void {
    this.confirmDialog
      .confirm({
        title: 'Mark book inactive?',
        message: `"${b.title}" will disappear from the active catalog and cannot be issued until it is restored.`,
        details: [b.author ? `Author: ${b.author}` : undefined, b.isbn ? `ISBN: ${b.isbn}` : undefined].filter(
          (x): x is string => !!x
        ),
        variant: 'warning',
        confirmLabel: 'Yes, mark inactive',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.libraryService.setCatalogActive(b.id, false).subscribe({
          next: () => this.loadBooks(),
          error: (e: Error) => alert(e?.message || 'Could not update catalog'),
        });
      });
  }

  reactivateBook(b: Book): void {
    this.libraryService.setCatalogActive(b.id, true).subscribe({
      next: () => this.loadBooks(),
      error: (e: Error) => alert(e?.message || 'Could not update catalog')
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
        error: (e: Error) => alert(e?.message || 'Could not return book')
      });
  }
}
