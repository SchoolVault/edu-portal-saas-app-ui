import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentRecord } from '../../core/models/models';
import { DocumentsService } from '../../core/services/documents.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="documents-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Documents</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">List metadata; upload/download where allowed. Delete: admin or original uploader (API mode).</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button *ngIf="canUpload" class="btn-primary-erp btn-sm" data-testid="upload-document-btn" (click)="openUpload()"><i class="bi bi-cloud-upload"></i> Upload</button>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="search-input-wrapper mb-3" style="max-width: 400px;">
          <i class="bi bi-search"></i>
          <input type="text" class="erp-input" placeholder="Search documents..." [(ngModel)]="search" (input)="filterDocs()">
        </div>
        <table class="erp-table" data-testid="documents-table">
          <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Uploaded by</th><th>Date</th><th>Size</th><th>Actions</th></tr></thead>
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
              <td>
                <button *ngIf="doc.fileUrl" type="button" class="btn-icon" title="Open / download" (click)="download(doc)"><i class="bi bi-download"></i></button>
                <button *ngIf="canDelete(doc)" type="button" class="btn-icon" title="Delete" (click)="remove(doc)"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="uploadOpen" (click)="uploadOpen = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Upload document</h3><button class="btn-icon" (click)="uploadOpen = false"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">Store file in your bucket/CDN, then register metadata here with the public or signed URL.</p>
          <label class="erp-label">Name</label>
          <input class="erp-input mb-2" [(ngModel)]="uploadForm.name">
          <label class="erp-label">File type</label>
          <input class="erp-input mb-2" [(ngModel)]="uploadForm.fileType" placeholder="PDF">
          <label class="erp-label">Category</label>
          <select class="erp-select mb-2" [(ngModel)]="uploadForm.category">
            <option value="GENERAL">General</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
          <label class="erp-label">Size (label)</label>
          <input class="erp-input mb-2" [(ngModel)]="uploadForm.fileSize" placeholder="1.2 MB">
          <label class="erp-label">File URL</label>
          <input class="erp-input" [(ngModel)]="uploadForm.fileUrl" placeholder="https://...">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="uploadOpen = false">Cancel</button>
          <button class="btn-primary-erp" (click)="saveUpload()">Save</button>
        </div>
      </div>
    </div>
  `
})
export class DocumentsComponent implements OnInit {
  search = '';
  documents: DocumentRecord[] = [];
  filteredDocs: DocumentRecord[] = [];
  canUpload = false;
  currentUserId = '';
  isAdmin = false;
  uploadOpen = false;
  uploadForm = { name: '', fileType: 'PDF', category: 'GENERAL', fileSize: '', fileUrl: '' };

  constructor(
    private documentsService: DocumentsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const u = this.authService.getCurrentUser();
    const r = (u?.role ?? '').toLowerCase();
    this.isAdmin = r === 'admin';
    this.canUpload = this.isAdmin || r === 'teacher';
    this.currentUserId = u?.id ?? '';
    this.reload();
  }

  reload(): void {
    this.documentsService.list().subscribe(d => {
      this.documents = d;
      this.filterDocs();
    });
  }

  filterDocs(): void {
    const term = this.search.toLowerCase();
    this.filteredDocs = this.documents.filter(doc => doc.name.toLowerCase().includes(term) || doc.category.toLowerCase().includes(term));
  }

  canDelete(doc: DocumentRecord): boolean {
    if (this.isAdmin) return true;
    if (environment.useMocks) return true;
    return !!this.currentUserId && doc.uploadedBy === this.currentUserId;
  }

  download(doc: DocumentRecord): void {
    if (doc.fileUrl) window.open(doc.fileUrl, '_blank', 'noopener');
  }

  remove(doc: DocumentRecord): void {
    if (!confirm('Delete this document record?')) return;
    this.documentsService.delete(doc.id).subscribe(() => this.reload());
  }

  openUpload(): void {
    this.uploadForm = { name: '', fileType: 'PDF', category: 'GENERAL', fileSize: '', fileUrl: '' };
    this.uploadOpen = true;
  }

  saveUpload(): void {
    if (!this.uploadForm.name.trim()) return;
    this.documentsService.uploadMeta({
      name: this.uploadForm.name,
      fileType: this.uploadForm.fileType,
      category: this.uploadForm.category,
      fileSize: this.uploadForm.fileSize,
      fileUrl: this.uploadForm.fileUrl || undefined
    }).subscribe(() => {
      this.uploadOpen = false;
      this.reload();
    });
  }

  getFileIcon(type: string): string {
    const icons: Record<string, string> = { PDF: 'bi-file-earmark-pdf-fill', DOCX: 'bi-file-earmark-word-fill', XLSX: 'bi-file-earmark-excel-fill', PNG: 'bi-file-earmark-image-fill', JPG: 'bi-file-earmark-image-fill' };
    return icons[(type || '').toUpperCase()] || 'bi-file-earmark-fill';
  }
}
