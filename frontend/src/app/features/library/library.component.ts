import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book, BookIssue } from '../../core/models/models';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="library-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Library</h2><p class="text-muted mb-0" style="font-size: 13px;">Manage books and circulation</p></div>
        <button class="btn-primary-erp btn-sm" data-testid="add-book-btn"><i class="bi bi-plus-lg"></i> Add Book</button>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'catalog'" (click)="tab = 'catalog'">Book Catalog</button>
        <button class="erp-tab" [class.active]="tab === 'issued'" (click)="tab = 'issued'">Issued Books</button>
      </div>
      <div *ngIf="tab === 'catalog'" class="animate-in">
        <div class="erp-card">
          <div class="search-input-wrapper mb-3" style="max-width: 400px;">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" placeholder="Search by title, author, or ISBN..." [(ngModel)]="searchTerm" (input)="filterBooks()" data-testid="book-search">
          </div>
          <table class="erp-table" data-testid="books-table">
            <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Available</th><th>Shelf</th></tr></thead>
            <tbody>
              <tr *ngFor="let b of filteredBooks">
                <td><strong>{{ b.title }}</strong></td>
                <td>{{ b.author }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ b.isbn }}</td>
                <td><span class="badge-erp badge-neutral">{{ b.category }}</span></td>
                <td>
                  <span [style.color]="b.availableCopies > 0 ? 'var(--clr-success)' : 'var(--clr-danger)'">{{ b.availableCopies }}/{{ b.totalCopies }}</span>
                </td>
                <td>{{ b.shelfLocation }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div *ngIf="tab === 'issued'" class="animate-in">
        <div class="erp-card">
          <table class="erp-table" data-testid="issued-books-table">
            <thead><tr><th>Book</th><th>Student</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Fine</th></tr></thead>
            <tbody>
              <tr *ngFor="let issue of issues">
                <td><strong>{{ issue.bookTitle }}</strong></td>
                <td>{{ issue.studentName }}</td>
                <td>{{ issue.issueDate }}</td>
                <td>{{ issue.dueDate }}</td>
                <td><span class="badge-erp" [ngClass]="{'badge-success': issue.status === 'returned', 'badge-info': issue.status === 'issued', 'badge-danger': issue.status === 'overdue'}">{{ issue.status }}</span></td>
                <td [style.color]="issue.fine > 0 ? 'var(--clr-danger)' : ''">\${{ issue.fine }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class LibraryComponent implements OnInit {
  tab = 'catalog';
  searchTerm = '';
  books: Book[] = [
    { id: 'b1', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0061120084', category: 'Fiction', totalCopies: 5, availableCopies: 3, shelfLocation: 'A-12', tenantId: 't1' },
    { id: 'b2', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', category: 'Science', totalCopies: 3, availableCopies: 1, shelfLocation: 'B-05', tenantId: 't1' },
    { id: 'b3', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', category: 'Fiction', totalCopies: 4, availableCopies: 4, shelfLocation: 'A-08', tenantId: 't1' },
    { id: 'b4', title: 'Introduction to Algorithms', author: 'T. Cormen', isbn: '978-0262033848', category: 'Computer Science', totalCopies: 2, availableCopies: 0, shelfLocation: 'C-01', tenantId: 't1' },
    { id: 'b5', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', category: 'History', totalCopies: 3, availableCopies: 2, shelfLocation: 'D-03', tenantId: 't1' },
  ];
  filteredBooks: Book[] = [];
  issues: BookIssue[] = [
    { id: 'bi1', bookId: 'b1', bookTitle: 'To Kill a Mockingbird', studentId: 's1', studentName: 'Arjun Patel', issueDate: '2026-01-15', dueDate: '2026-02-15', status: 'issued', fine: 0, tenantId: 't1' },
    { id: 'bi2', bookId: 'b2', bookTitle: 'A Brief History of Time', studentId: 's4', studentName: 'Sofia Martinez', issueDate: '2026-01-10', dueDate: '2026-02-10', returnDate: '2026-02-05', status: 'returned', fine: 0, tenantId: 't1' },
    { id: 'bi3', bookId: 'b4', bookTitle: 'Introduction to Algorithms', studentId: 's9', studentName: 'Mason Davis', issueDate: '2025-12-15', dueDate: '2026-01-15', status: 'overdue', fine: 5, tenantId: 't1' },
  ];

  ngOnInit(): void { this.filteredBooks = [...this.books]; }

  filterBooks(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredBooks = this.books.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term) || b.isbn.includes(term));
  }
}
