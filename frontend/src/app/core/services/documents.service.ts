import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MOCK_DOCUMENTS_LIST } from '../mocks/documents.mock-data';
import { DocumentRecord } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  constructor(private api: ApiService) {}

  list(category?: string): Observable<DocumentRecord[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_DOCUMENTS_LIST.map(d => ({ ...d })));
    }
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.api.get<any[]>(`/documents${q}`).pipe(map(list => list.map(d => this.normalizeDoc(d))));
  }

  uploadMeta(body: { name: string; fileType: string; category: string; fileSize?: string; fileUrl?: string }): Observable<DocumentRecord> {
    if (runtimeConfig.useMocks) {
      return of({ id: 'd-new', name: body.name, type: body.fileType, category: body.category, uploadedBy: 'me', uploadDate: new Date().toISOString().slice(0, 10), size: body.fileSize ?? '', fileUrl: body.fileUrl, tenantId: '' });
    }
    const payload: any = {
      name: body.name,
      fileType: body.fileType,
      category: body.category.toUpperCase(),
      fileSize: body.fileSize,
      fileUrl: body.fileUrl
    };
    return this.api.post<any>('/documents', payload).pipe(map(d => this.normalizeDoc(d)));
  }

  delete(id: string): Observable<void> {
    if (runtimeConfig.useMocks) return of(undefined);
    return this.api.delete<void>(`/documents/${id}`);
  }

  private normalizeDoc(d: any): DocumentRecord {
    return {
      id: String(d.id),
      name: d.name ?? '',
      type: d.fileType ?? d.type ?? '',
      category: (d.category ?? 'general').toString().toLowerCase(),
      uploadedBy: d.uploadedBy ?? '',
      uploadDate: d.createdAt ? String(d.createdAt).slice(0, 10) : '',
      size: d.fileSize ?? '',
      fileUrl: d.fileUrl,
      tenantId: d.tenantId ?? ''
    };
  }
}
