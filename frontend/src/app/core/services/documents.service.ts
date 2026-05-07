import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_DOCUMENTS_LIST } from '../mocks/documents.mock-data';
import { DocumentRecord } from '../models/models';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  constructor(private api: ApiService) {}

  list(category?: string, academicYearId?: number): Observable<DocumentRecord[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_DOCUMENTS_LIST.map(d => ({ ...d })));
    }
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (academicYearId != null) params.set('academicYearId', String(academicYearId));
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.api.get<any[]>(`/documents${q}`).pipe(map(list => list.map(d => this.normalizeDoc(d))));
  }

  listPaged(opts: { page?: number; size?: number; category?: string; academicYearId?: number; q?: string }): Observable<PageResp<DocumentRecord>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/documents/paged', {
          page,
          size,
          category: opts.category?.trim() || undefined,
          academicYearId: opts.academicYearId ?? undefined,
          q: opts.q?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map((d: any) => this.normalizeDoc(d)) })));
    }
    let rows = MOCK_DOCUMENTS_LIST.map(d => ({ ...d }));
    if (opts.category?.trim()) {
      const c = opts.category.trim().toLowerCase();
      rows = rows.filter(d => d.category.toLowerCase() === c);
    }
    const tq = (opts.q ?? '').trim().toLowerCase();
    if (tq) {
      rows = rows.filter(d => d.name.toLowerCase().includes(tq) || d.category.toLowerCase().includes(tq));
    }
    return of(sliceToPage(rows, page, size)).pipe(delay(200));
  }

  upload(body: {
    file: File;
    name?: string;
    category?: string;
    ownerType?: string;
    ownerId?: number;
    academicYearId?: number;
    visibilityScope?: string;
  }): Observable<DocumentRecord> {
    if (runtimeConfig.useMocks) {
      return of({
        id: 'd-new',
        name: body.name || body.file.name,
        type: (body.file.name.split('.').pop() || '').toUpperCase(),
        category: (body.category || 'general').toLowerCase(),
        uploadedBy: 'me',
        uploadDate: new Date().toISOString().slice(0, 10),
        size: `${Math.round(body.file.size / 1024)} KB`,
        academicYearId: body.academicYearId ?? null,
        tenantId: '',
      });
    }
    const form = new FormData();
    form.append('file', body.file);
    if (body.name?.trim()) form.append('name', body.name.trim());
    if (body.category?.trim()) form.append('category', body.category.trim().toUpperCase());
    if (body.ownerType?.trim()) form.append('ownerType', body.ownerType.trim().toUpperCase());
    if (body.ownerId != null) form.append('ownerId', String(body.ownerId));
    if (body.academicYearId != null) form.append('academicYearId', String(body.academicYearId));
    if (body.visibilityScope?.trim()) form.append('visibilityScope', body.visibilityScope.trim().toUpperCase());
    return this.api.post<any>('/documents/upload', form).pipe(map(d => this.normalizeDoc(d)));
  }

  downloadUrl(doc: DocumentRecord): string {
    return doc.fileUrl || `${this.api.getBaseUrl()}/documents/${encodeURIComponent(doc.id)}/download`;
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
      academicYearId: d.academicYearId != null ? Number(d.academicYearId) : null,
      checksumSha256: d.checksumSha256 ?? undefined,
      fileUrl: d.fileUrl,
      tenantId: d.tenantId ?? ''
    };
  }
}
