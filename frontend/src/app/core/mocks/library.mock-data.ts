import type { Book, BookIssue } from '../models/models';

export const MOCK_LIBRARY_BOOKS: Book[] = [
  {
    id: 1,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    category: 'Fiction',
    totalCopies: 5,
    availableCopies: 3,
    shelfLocation: 'A-12',
    catalogActive: true,
    tenantId: 't1',
  },
  {
    id: 2,
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    category: 'Science',
    totalCopies: 3,
    availableCopies: 1,
    shelfLocation: 'B-05',
    catalogActive: true,
    tenantId: 't1',
  },
];

export const MOCK_LIBRARY_ISSUES: BookIssue[] = [
  {
    id: 'bi1',
    bookId: 1,
    bookTitle: 'To Kill a Mockingbird',
    studentId: 1,
    studentName: 'Arjun Patel',
    issueDate: '2026-01-15',
    dueDate: '2026-02-15',
    status: 'issued',
    fine: 0,
    tenantId: 't1',
  },
];
