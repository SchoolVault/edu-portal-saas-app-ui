import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Book, BookIssue } from '../models/models';
import { MOCK_LIBRARY_BOOKS, MOCK_LIBRARY_ISSUES } from '../mocks/library.mock-data';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

let MOCK_BOOKS: Book[] = MOCK_LIBRARY_BOOKS.map(b => ({ ...b }));
let MOCK_ISSUES: BookIssue[] = MOCK_LIBRARY_ISSUES.map(i => ({ ...i }));

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function withDerivedStatus(issue: BookIssue): BookIssue {
  if (issue.status === 'returned') return issue;
  if (issue.dueDate && issue.dueDate < todayStr()) {
    return { ...issue, status: 'overdue' };
  }
  return issue;
}

export type LibraryCatalogFilter = 'active' | 'inactive' | 'all';
export interface LibraryFinePolicy {
  id?: number;
  borrowerType: 'STUDENT' | 'STAFF' | 'GUARDIAN' | 'OTHER';
  finePerDay: number;
  graceDays: number;
  maxBooks: number;
  maxBorrowDays: number;
}
export interface LibraryReservation {
  id: number;
  bookId: number;
  bookTitle: string;
  borrowerType: string;
  borrowerRefId?: number;
  borrowerUserId?: number;
  borrowerDisplayName?: string;
  status: string;
  requestedAt?: string;
  expiresAt?: string;
  fulfilledIssueId?: number;
  note?: string;
}
export interface LibraryAnalyticsSnapshot {
  totalTitles: number;
  totalCopies: number;
  copiesAvailable: number;
  issuedCount: number;
  overdueCount: number;
  reservedCount: number;
  outstandingFine: number;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  constructor(private api: ApiService) {}

  listBooks(
    search?: string,
    category?: string,
    catalogFilter: LibraryCatalogFilter = 'active',
    includeInactiveOnApi = false
  ): Observable<Book[]> {
    if (runtimeConfig.useMocks) {
      let rows = MOCK_BOOKS.map(b => ({ ...b }));
      if (catalogFilter === 'active') {
        rows = rows.filter(b => b.catalogActive !== false);
      } else if (catalogFilter === 'inactive') {
        rows = rows.filter(b => b.catalogActive === false);
      }
      if (search?.trim()) {
        const t = search.trim().toLowerCase();
        rows = rows.filter(
          b => b.title.toLowerCase().includes(t) || b.author.toLowerCase().includes(t) || b.isbn.toLowerCase().includes(t)
        );
      }
      if (category?.trim()) {
        const c = category.trim().toLowerCase();
        rows = rows.filter(b => b.category.toLowerCase() === c);
      }
      return of(rows);
    }
    let path = '/library/books';
    const q: string[] = [];
    if (search?.trim()) q.push(`search=${encodeURIComponent(search.trim())}`);
    if (includeInactiveOnApi) q.push('includeInactive=true');
    if (q.length) path += `?${q.join('&')}`;
    return this.api.get<any[]>(path).pipe(
      map(list => {
        let rows = list.map(b => this.normalizeBook(b));
        if (catalogFilter === 'active') {
          rows = rows.filter(b => b.catalogActive !== false);
        } else if (catalogFilter === 'inactive') {
          rows = rows.filter(b => b.catalogActive === false);
        }
        if (category?.trim()) {
          const c = category.trim().toLowerCase();
          rows = rows.filter(b => b.category.toLowerCase() === c);
        }
        return rows;
      })
    );
  }

  addBook(body: Partial<Book>): Observable<Book> {
    if (runtimeConfig.useMocks) {
      const total = Number(body.totalCopies ?? 1);
      const avail = body.availableCopies != null ? Number(body.availableCopies) : total;
      const nextId = Math.max(0, ...MOCK_BOOKS.map(b => b.id)) + 1;
      const book: Book = {
        id: nextId,
        title: (body.title ?? '').trim(),
        author: (body.author ?? '').trim(),
        isbn: (body.isbn ?? '').trim(),
        category: (body.category ?? '').trim(),
        totalCopies: total,
        availableCopies: Math.min(avail, total),
        shelfLocation: (body.shelfLocation ?? '').trim(),
        catalogActive: true,
        tenantId: 't1'
      };
      MOCK_BOOKS = [...MOCK_BOOKS, book];
      return of({ ...book });
    }
    const payload = {
      title: body.title,
      author: body.author,
      isbn: body.isbn,
      category: body.category,
      totalCopies: body.totalCopies,
      availableCopies: body.availableCopies ?? body.totalCopies,
      shelfLocation: body.shelfLocation,
      isActive: true
    };
    return this.api.post<any>('/library/books', payload).pipe(map(b => this.normalizeBook(b)));
  }

  setCatalogActive(bookId: number, active: boolean): Observable<Book> {
    if (runtimeConfig.useMocks) {
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) return throwError(() => new Error('Book not found'));
      book.catalogActive = active;
      return of({ ...book });
    }
    return this.api.put<any>(`/library/books/${bookId}/catalog`, { active }).pipe(map(b => this.normalizeBook(b)));
  }

  /** Server + mock: same {@link PageResp} shape as {@code GET /library/books/paged}. */
  getBooksPage(opts: {
    page?: number;
    size?: number;
    search?: string;
    category?: string;
    catalogScope?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  }): Observable<PageResp<Book>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const scope = opts.catalogScope ?? 'ACTIVE';
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/library/books/paged', {
          page,
          size,
          search: opts.search?.trim() || undefined,
          category: opts.category?.trim() || undefined,
          catalogScope: scope,
        })
        .pipe(map(p => ({ ...p, content: p.content.map((b: any) => this.normalizeBook(b)) })));
    }
    const filter: LibraryCatalogFilter = scope === 'ALL' ? 'all' : scope === 'INACTIVE' ? 'inactive' : 'active';
    return this.listBooks(opts.search, opts.category, filter, true).pipe(
      map(rows => sliceToPage(rows ?? [], page, size)),
      delay(200)
    );
  }

  getIssuesPage(opts: { page?: number; size?: number; status?: string }): Observable<PageResp<BookIssue>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/library/issues/paged', {
          page,
          size,
          status: opts.status?.trim() ? opts.status.trim().toUpperCase() : undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map((i: any) => this.normalizeIssue(i)) })));
    }
    return this.listIssues(opts.status).pipe(
      map(rows => sliceToPage(rows ?? [], page, size)),
      delay(200)
    );
  }

  getMyIssuesPage(opts: { page?: number; size?: number; status?: string }): Observable<PageResp<BookIssue>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/library/issues/me/paged', {
          page,
          size,
          status: opts.status?.trim() ? opts.status.trim().toUpperCase() : undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map((i: any) => this.normalizeIssue(i)) })));
    }
    return this.listMyIssues(opts.status).pipe(
      map(rows => sliceToPage(rows ?? [], page, size)),
      delay(200)
    );
  }

  listIssues(status?: string): Observable<BookIssue[]> {
    if (runtimeConfig.useMocks) {
      let rows = MOCK_ISSUES.map(i => withDerivedStatus({ ...i }));
      if (status?.trim()) {
        const st = status.trim().toLowerCase();
        rows = rows.filter(i => i.status === st);
      }
      return of(rows);
    }
    const q = status?.trim() ? `?status=${encodeURIComponent(status.trim().toUpperCase())}` : '';
    return this.api.get<any[]>(`/library/issues${q}`).pipe(map(list => list.map(i => this.normalizeIssue(i))));
  }

  listMyIssues(status?: string): Observable<BookIssue[]> {
    if (runtimeConfig.useMocks) {
      return this.listIssues(status);
    }
    const q = status?.trim() ? `?status=${encodeURIComponent(status.trim().toUpperCase())}` : '';
    return this.api.get<any[]>(`/library/issues/me${q}`).pipe(map(list => list.map(i => this.normalizeIssue(i))));
  }

  issueBook(bookId: number, studentId: number, studentName?: string, dueDays?: number): Observable<BookIssue> {
    if (runtimeConfig.useMocks) {
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) return throwError(() => new Error('Book not found'));
      if (book.catalogActive === false) {
        return throwError(() => new Error('This title is inactive in the catalog.'));
      }
      if (book.availableCopies <= 0) return throwError(() => new Error('No copies available (out of stock).'));
      book.availableCopies -= 1;
      const days = dueDays != null && !Number.isNaN(Number(dueDays)) ? Number(dueDays) : 14;
      const issueDate = todayStr();
      const d = new Date();
      d.setDate(d.getDate() + days);
      const dueDate = d.toISOString().slice(0, 10);
      const issue: BookIssue = {
        id: 'bi' + Date.now(),
        bookId,
        bookTitle: book.title,
        studentId,
        studentName: studentName ?? '',
        issueDate,
        dueDate,
        status: 'issued',
        fine: 0,
        tenantId: 't1'
      };
      MOCK_ISSUES = [issue, ...MOCK_ISSUES];
      return of({ ...issue });
    }
    return this.api
      .post<any>('/library/issues', { bookId, studentId, studentName, dueDays })
      .pipe(map(i => this.normalizeIssue(i)));
  }

  returnBook(issueId: string, opts?: { returnDate?: string; finePerDay?: number }): Observable<BookIssue> {
    if (runtimeConfig.useMocks) {
      const idx = MOCK_ISSUES.findIndex(i => i.id === issueId);
      if (idx < 0) return throwError(() => new Error('Issue not found'));
      const issue = { ...MOCK_ISSUES[idx] };
      if (issue.status === 'returned') return throwError(() => new Error('Already returned'));
      const ret = opts?.returnDate?.trim() || todayStr();
      const rate = opts?.finePerDay != null && !Number.isNaN(Number(opts.finePerDay)) ? Number(opts.finePerDay) : 10;
      let fine = 0;
      if (issue.dueDate && ret > issue.dueDate) {
        const d0 = new Date(issue.dueDate).getTime();
        const d1 = new Date(ret).getTime();
        const days = Math.max(0, Math.ceil((d1 - d0) / 86400000));
        fine = days * rate;
      }
      const updated: BookIssue = {
        ...issue,
        returnDate: ret,
        status: 'returned',
        fine
      };
      MOCK_ISSUES[idx] = updated;
      const book = MOCK_BOOKS.find(b => b.id === issue.bookId);
      if (book) {
        book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      }
      return of({ ...updated });
    }
    const iid = Number(issueId);
    if (!Number.isFinite(iid)) {
      return throwError(() => new Error('Invalid issue id'));
    }
    const body: Record<string, unknown> = {};
    if (opts?.returnDate) body.returnDate = opts.returnDate;
    if (opts?.finePerDay != null) body.finePerDay = opts.finePerDay;
    return this.api.put<any>(`/library/issues/${iid}/return`, body).pipe(map(i => this.normalizeIssue(i)));
  }

  listFinePolicies(): Observable<LibraryFinePolicy[]> {
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<LibraryFinePolicy[]>('/library/policies/fine');
  }

  upsertFinePolicy(body: LibraryFinePolicy): Observable<LibraryFinePolicy> {
    if (runtimeConfig.useMocks) return of(body);
    return this.api.put<LibraryFinePolicy>('/library/policies/fine', body);
  }

  listReservations(status?: string): Observable<LibraryReservation[]> {
    if (runtimeConfig.useMocks) return of([]);
    const qp = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.api.get<LibraryReservation[]>(`/library/reservations${qp}`);
  }

  createReservation(body: {
    bookId: number;
    borrowerType: 'STUDENT' | 'STAFF' | 'GUARDIAN' | 'OTHER';
    borrowerRefId: number;
    borrowerUserId?: number;
    borrowerDisplayName?: string;
    holdHours?: number;
    note?: string;
  }): Observable<LibraryReservation> {
    if (runtimeConfig.useMocks) return of({ id: Date.now(), bookId: body.bookId, bookTitle: '', borrowerType: body.borrowerType, status: 'PENDING' });
    return this.api.post<LibraryReservation>('/library/reservations', body);
  }

  cancelReservation(id: number): Observable<LibraryReservation> {
    if (runtimeConfig.useMocks) return of({ id, bookId: 0, bookTitle: '', borrowerType: 'STUDENT', status: 'CANCELLED' });
    return this.api.put<LibraryReservation>(`/library/reservations/${id}/cancel`, {});
  }

  fulfillReservation(id: number, dueDays?: number): Observable<LibraryReservation> {
    if (runtimeConfig.useMocks) return of({ id, bookId: 0, bookTitle: '', borrowerType: 'STUDENT', status: 'FULFILLED' });
    const qp = dueDays != null ? `?dueDays=${encodeURIComponent(String(dueDays))}` : '';
    return this.api.put<LibraryReservation>(`/library/reservations/${id}/fulfill${qp}`, {});
  }

  adjustInventory(body: { bookId: number; action: 'ACCESSION' | 'LOSS' | 'WRITE_OFF' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS'; quantity: number; note?: string; }): Observable<any> {
    if (runtimeConfig.useMocks) return of(body);
    return this.api.post<any>('/library/inventory/adjust', body);
  }

  analyticsSnapshot(): Observable<LibraryAnalyticsSnapshot> {
    if (runtimeConfig.useMocks) return of({ totalTitles: 0, totalCopies: 0, copiesAvailable: 0, issuedCount: 0, overdueCount: 0, reservedCount: 0, outstandingFine: 0 });
    return this.api.get<LibraryAnalyticsSnapshot>('/library/analytics/snapshot').pipe(
      map(x => ({ ...x, outstandingFine: Number((x as any).outstandingFine ?? 0) }))
    );
  }

  dueReminders(days = 7): Observable<BookIssue[]> {
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<any[]>(`/library/reminders/due?dueInDays=${encodeURIComponent(String(days))}`).pipe(map(list => (list || []).map(i => this.normalizeIssue(i))));
  }

  exportAnalyticsCsv(): Observable<Blob> {
    return this.api.getBlob('/library/analytics/export.csv');
  }

  exportAnalyticsPdf(): Observable<Blob> {
    return this.api.getBlob('/library/analytics/export.pdf');
  }

  private normalizeBook(b: any): Book {
    const active = b.catalogActive !== undefined ? !!b.catalogActive : b.isActive !== false;
    return {
      id: Number(b.id),
      title: b.title ?? '',
      author: b.author ?? '',
      isbn: b.isbn ?? '',
      category: b.category ?? '',
      totalCopies: Number(b.totalCopies ?? 0),
      availableCopies: Number(b.availableCopies ?? 0),
      shelfLocation: b.shelfLocation ?? '',
      catalogActive: active,
      tenantId: b.tenantId ?? ''
    };
  }

  private normalizeIssue(i: any): BookIssue {
    const st = String(i.status ?? 'ISSUED').toLowerCase();
    const status: BookIssue['status'] = st === 'returned' ? 'returned' : st === 'overdue' ? 'overdue' : 'issued';
    const parseNum = (v: unknown): number | undefined => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const borrowerTypeRaw = String(i.borrowerType ?? '').toLowerCase();
    const borrowerType =
      borrowerTypeRaw === 'student' || borrowerTypeRaw === 'staff' || borrowerTypeRaw === 'guardian' || borrowerTypeRaw === 'other'
        ? borrowerTypeRaw
        : undefined;
    return {
      id: String(i.id),
      bookId: Number(i.bookId),
      bookTitle: i.bookTitle ?? '',
      studentId: parseNum(i.studentId),
      studentName: i.studentName ?? '',
      borrowerType,
      borrowerRefId: parseNum(i.borrowerRefId),
      borrowerUserId: parseNum(i.borrowerUserId),
      borrowerDisplayName: i.borrowerDisplayName ?? undefined,
      issueDate: (i.issueDate ?? '').toString().slice(0, 10),
      dueDate: (i.dueDate ?? '').toString().slice(0, 10),
      returnDate: i.returnDate ? String(i.returnDate).slice(0, 10) : undefined,
      fine: Number(i.fine ?? 0),
      status,
      tenantId: i.tenantId ?? ''
    };
  }
}
