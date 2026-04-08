import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentRecord } from '../../core/models/models';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="documents-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Documents</h2><p class="text-muted mb-0" style="font-size: 13px;">Upload and manage documents</p></div>
        <button class="btn-primary-erp btn-sm" data-testid="upload-document-btn"><i class="bi bi-cloud-upload"></i> Upload</button>
      </div>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="search-input-wrapper mb-3" style="max-width: 400px;">
          <i class="bi bi-search"></i>
          <input type="text" class="erp-input" placeholder="Search documents..." [(ngModel)]="search" (input)="filterDocs()">
        </div>
        <table class="erp-table" data-testid="documents-table">
          <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Uploaded By</th><th>Date</th><th>Size</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let doc of filteredDocs">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <i class="bi" [ngClass]="getFileIcon(doc.type)" style="font-size: 20px; color: var(--clr-accent);"></i>
                  <strong>{{ doc.name }}</strong>
                </div>
              </td>
              <td><span class="badge-erp badge-neutral">{{ doc.type }}</span></td>
              <td style="text-transform: capitalize;">{{ doc.category }}</td>
              <td>{{ doc.uploadedBy }}</td>
              <td>{{ doc.uploadDate }}</td>
              <td>{{ doc.size }}</td>
              <td><button class="btn-icon" title="Download"><i class="bi bi-download"></i></button><button class="btn-icon" title="Delete"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DocumentsComponent {
  search = '';
  documents: DocumentRecord[] = [
    { id: 'd1', name: 'School Calendar 2025-26', type: 'PDF', category: 'general', uploadedBy: 'John Anderson', uploadDate: '2025-06-01', size: '2.4 MB', tenantId: 't1' },
    { id: 'd2', name: 'Student Transfer Certificate', type: 'PDF', category: 'student', uploadedBy: 'Admin', uploadDate: '2026-01-15', size: '156 KB', tenantId: 't1' },
    { id: 'd3', name: 'Teacher Employment Contract', type: 'DOCX', category: 'teacher', uploadedBy: 'HR', uploadDate: '2025-08-10', size: '340 KB', tenantId: 't1' },
    { id: 'd4', name: 'Fee Receipt Template', type: 'XLSX', category: 'admin', uploadedBy: 'Finance', uploadDate: '2025-07-01', size: '128 KB', tenantId: 't1' },
    { id: 'd5', name: 'Annual Report 2024-25', type: 'PDF', category: 'general', uploadedBy: 'John Anderson', uploadDate: '2025-05-30', size: '5.8 MB', tenantId: 't1' },
  ];
  filteredDocs: DocumentRecord[] = [...this.documents];

  filterDocs(): void {
    const term = this.search.toLowerCase();
    this.filteredDocs = this.documents.filter(d => d.name.toLowerCase().includes(term) || d.category.toLowerCase().includes(term));
  }

  getFileIcon(type: string): string {
    const icons: Record<string, string> = { PDF: 'bi-file-earmark-pdf-fill', DOCX: 'bi-file-earmark-word-fill', XLSX: 'bi-file-earmark-excel-fill', PNG: 'bi-file-earmark-image-fill', JPG: 'bi-file-earmark-image-fill' };
    return icons[type] || 'bi-file-earmark-fill';
  }
}
