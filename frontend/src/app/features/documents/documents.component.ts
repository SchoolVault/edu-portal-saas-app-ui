import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentRecord } from '../../core/models/models';
import { DocumentsService } from '../../core/services/documents.service';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div data-testid="documents-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'documents.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'documents.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()"><i class="bi bi-arrow-clockwise"></i> {{ 'documents.refresh' | translate }}</button>
          <button *ngIf="canUpload" class="btn-primary-erp btn-sm" data-testid="upload-document-btn" (click)="openUpload()"><i class="bi bi-cloud-upload"></i> {{ 'documents.upload' | translate }}</button>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="search-input-wrapper mb-3" style="max-width: 400px;">
          <i class="bi bi-search"></i>
          <input type="text" class="erp-input" [placeholder]="'documents.searchPlaceholder' | translate" [(ngModel)]="search" (input)="filterDocs()">
        </div>
        <table class="erp-table" data-testid="documents-table">
          <thead><tr><th>{{ 'documents.thName' | translate }}</th><th>{{ 'documents.thType' | translate }}</th><th>{{ 'documents.thCategory' | translate }}</th><th>{{ 'documents.thUploadedBy' | translate }}</th><th>{{ 'documents.thDate' | translate }}</th><th>{{ 'documents.thSize' | translate }}</th><th>{{ 'documents.thActions' | translate }}</th></tr></thead>
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
                <button *ngIf="doc.fileUrl" type="button" class="btn-icon" [title]="'documents.openDownload' | translate" (click)="download(doc)"><i class="bi bi-download"></i></button>
                <button *ngIf="canDelete(doc)" type="button" class="btn-icon" [title]="'documents.deleteTitle' | translate" (click)="remove(doc)"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="uploadOpen" (click)="uploadOpen = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'documents.modalTitle' | translate }}</h3><button class="btn-icon" (click)="uploadOpen = false"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">{{ 'documents.modalLead' | translate }}</p>
          <label class="erp-label">{{ 'documents.labelName' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="uploadForm.name">
          <label class="erp-label">{{ 'documents.labelFileType' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="uploadForm.fileType" [placeholder]="'documents.phFileType' | translate">
          <label class="erp-label">{{ 'documents.labelCategory' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="uploadForm.category">
            <option value="GENERAL">{{ 'documents.catGeneral' | translate }}</option>
            <option value="STUDENT">{{ 'documents.catStudent' | translate }}</option>
            <option value="TEACHER">{{ 'documents.catTeacher' | translate }}</option>
            <option value="ADMIN">{{ 'documents.catAdmin' | translate }}</option>
          </select>
          <label class="erp-label">{{ 'documents.labelSize' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="uploadForm.fileSize" [placeholder]="'documents.phFileSize' | translate">
          <label class="erp-label">{{ 'documents.labelFileUrl' | translate }}</label>
          <input class="erp-input" [(ngModel)]="uploadForm.fileUrl" [placeholder]="'documents.phFileUrl' | translate">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="uploadOpen = false">{{ 'documents.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveUpload()">{{ 'documents.save' | translate }}</button>
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
    private authService: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const u = this.authService.getCurrentUser();
    const r = (u?.role ?? '').toLowerCase();
    this.isAdmin = r === 'admin';
    this.canUpload = this.isAdmin || r === 'teacher';
    this.currentUserId = u?.id != null ? String(u.id) : '';
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
    if (runtimeConfig.useMocks) return true;
    return !!this.currentUserId && doc.uploadedBy === this.currentUserId;
  }

  download(doc: DocumentRecord): void {
    if (doc.fileUrl) window.open(doc.fileUrl, '_blank', 'noopener');
  }

  remove(doc: DocumentRecord): void {
    const t = this.translate.instant.bind(this.translate);
    this.confirmDialog
      .confirm({
        title: t('documents.confirmDeleteTitle'),
        message: t('documents.confirmDeleteMessage', { name: doc.name }),
        details: [
          t('documents.detailType', { type: doc.type }),
          t('documents.detailCategory', { category: doc.category }),
          t('documents.detailUploaded', { date: doc.uploadDate }),
        ],
        variant: 'danger',
        confirmLabel: t('documents.confirmDelete'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.documentsService.delete(doc.id).subscribe(() => this.reload()));
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
