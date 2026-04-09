import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Book, BookIssue } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { coerceApiLongId } from '../utils/coerce-api-long-id';

/** Mutable in-memory catalog (same shape as API). */
let MOCK_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    category: 'Fiction',
    totalCopies: 5,
    availableCopies: 3,
    shelfLocation: 'A-12',
    catalogActive: true,
    tenantId: 't1'
  },
  {
    id: 'b2',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    category: 'Science',
    totalCopies: 3,
    availableCopies: 1,
    shelfLocation: 'B-05',
    catalogActive: true,
    tenantId: 't1'
  }
];

let MOCK_ISSUES: BookIssue[] = [
  {
    id: 'bi1',
    bookId: 'b1',
    bookTitle: 'To Kill a Mockingbird',
    studentId: 's1',
    studentName: 'Arjun Patel',
    issueDate: '2026-01-15',
    dueDate: '2026-02-15',
    status: 'issued',
    fine: 0,
    tenantId: 't1'
  }
];

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

@Injectable({ providedIn: 'root' })
export class LibraryService {
  constructor(private api: ApiService) {}

  listBooks(
    search?: string,
    category?: string,
    catalogFilter: LibraryCatalogFilter = 'active',
    includeInactiveOnApi = false
  ): Observable<Book[]> {
    if (environment.useMocks) {
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
    if (environment.useMocks) {
      const total = Number(body.totalCopies ?? 1);
      const avail = body.availableCopies != null ? Number(body.availableCopies) : total;
      const book: Book = {
        id: 'b' + Date.now(),
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

  setCatalogActive(bookId: string, active: boolean): Observable<Book> {
    if (environment.useMocks) {
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) return throwError(() => new Error('Book not found'));
      book.catalogActive = active;
      return of({ ...book });
    }
    return this.api
      .put<any>(`/library/books/${coerceApiLongId(bookId, 'book')}/catalog`, { active })
      .pipe(map(b => this.normalizeBook(b)));
  }

  listIssues(status?: string): Observable<BookIssue[]> {
    if (environment.useMocks) {
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

  issueBook(bookId: string, studentId: string, studentName?: string, dueDays?: number): Observable<BookIssue> {
    if (environment.useMocks) {
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
    let sid: number;
    let bid: number;
    try {
      bid = coerceApiLongId(bookId, 'book');
      sid = coerceApiLongId(studentId, 'student');
    } catch (e: any) {
      return throwError(() => new Error(e?.message || 'Invalid id'));
    }
    return this.api
      .post<any>('/library/issues', { bookId: bid, studentId: sid, studentName, dueDays })
      .pipe(map(i => this.normalizeIssue(i)));
  }

  returnBook(issueId: string, opts?: { returnDate?: string; finePerDay?: number }): Observable<BookIssue> {
    if (environment.useMocks) {
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
    let iid: number;
    try {
      iid = coerceApiLongId(issueId, 'issue');
    } catch (e: any) {
      return throwError(() => new Error(e?.message || 'Invalid issue id'));
    }
    const body: Record<string, unknown> = {};
    if (opts?.returnDate) body.returnDate = opts.returnDate;
    if (opts?.finePerDay != null) body.finePerDay = opts.finePerDay;
    return this.api.put<any>(`/library/issues/${iid}/return`, body).pipe(map(i => this.normalizeIssue(i)));
  }

  private normalizeBook(b: any): Book {
    const active = b.catalogActive !== undefined ? !!b.catalogActive : b.isActive !== false;
    return {
      id: String(b.id),
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
    return {
      id: String(i.id),
      bookId: String(i.bookId),
      bookTitle: i.bookTitle ?? '',
      studentId: String(i.studentId),
      studentName: i.studentName ?? '',
      issueDate: (i.issueDate ?? '').toString().slice(0, 10),
      dueDate: (i.dueDate ?? '').toString().slice(0, 10),
      returnDate: i.returnDate ? String(i.returnDate).slice(0, 10) : undefined,
      fine: Number(i.fine ?? 0),
      status,
      tenantId: i.tenantId ?? ''
    };
  }
}
