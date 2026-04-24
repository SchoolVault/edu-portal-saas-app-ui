import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AuditLog } from '../models/models';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  constructor(private api: ApiService) {}

  /**
   * Paginated audit trail; aligns with {@code GET /api/v1/audit}.
   * When mocks are on, supply seed rows from the feature (or empty).
   */
  getPage(
    opts: {
      page?: number;
      size?: number;
      action?: string;
      module?: string;
      q?: string;
      /** Inclusive yyyy-MM-dd (calendar period start). */
      from?: string;
      /** Inclusive yyyy-MM-dd (calendar period end). */
      to?: string;
    },
    mockRows: AuditLog[]
  ): Observable<PageResp<AuditLog>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/audit', {
          page,
          size,
          action: opts.action?.trim() ? opts.action.trim().toUpperCase() : undefined,
          module: opts.module?.trim() || undefined,
          q: opts.q?.trim() || undefined,
          from: opts.from?.trim() || undefined,
          to: opts.to?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map((row: any) => this.normalize(row)) })));
    }
    let rows = [...mockRows];
    if (opts.action?.trim()) {
      rows = rows.filter(l => l.action === opts.action);
    }
    if (opts.module?.trim()) {
      rows = rows.filter(l => l.module === opts.module);
    }
    if (opts.from && opts.to) {
      rows = rows.filter(l => this.auditTsInRange(l.timestamp, opts.from!, opts.to!));
    }
    const tq = (opts.q ?? '').trim().toLowerCase();
    if (tq) {
      rows = rows.filter(l => {
        const hay = [
          l.description,
          l.userName,
          l.module,
          l.oldValue ?? '',
          l.newValue ?? '',
          l.entityType ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(tq);
      });
    }
    return of(sliceToPage(rows, page, size)).pipe(delay(200));
  }

  /**
   * Binary audit export (CSV/PDF); aligns with {@code GET /api/v1/audit/export}.
   * Mock mode builds a small UTF-8 CSV locally.
   */
  exportBlob(opts: {
    format: 'CSV' | 'PDF';
    action?: string;
    module?: string;
    q?: string;
    from?: string;
    to?: string;
  }): Observable<Blob> {
    if (!runtimeConfig.useMocks) {
      return this.api.getBlobParams('/audit/export', {
        format: opts.format,
        action: opts.action?.trim() ? opts.action.trim().toUpperCase() : undefined,
        module: opts.module?.trim() || undefined,
        q: opts.q?.trim() || undefined,
        from: opts.from?.trim() || undefined,
        to: opts.to?.trim() || undefined,
      });
    }
    const header = 'action,module,description,user,timestamp,ip\n';
    const line = `LOGIN,System,"Mock export (${opts.format})","demo@school.com",${new Date().toISOString()},127.0.0.1\n`;
    const mime = opts.format === 'PDF' ? 'application/pdf' : 'text/csv;charset=utf-8';
    const body = opts.format === 'PDF' ? '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' : header + line;
    return of(new Blob([body], { type: mime })).pipe(delay(200));
  }

  private auditTsInRange(ts: string, from: string, to: string): boolean {
    const day = ts.slice(0, 10);
    return day >= from && day <= to;
  }

  private normalize(row: any): AuditLog {
    const ts = row.timestamp ?? row.createdAt ?? '';
    const eid = row.entityId;
    return {
      id: String(row.id ?? ''),
      action: String(row.action ?? '').toLowerCase(),
      module: row.module ?? '',
      description: row.description ?? '',
      userId: row.userId != null ? String(row.userId) : '',
      userName: row.userName ?? '',
      timestamp: typeof ts === 'string' ? ts : String(ts),
      ipAddress: row.ipAddress ?? '',
      tenantId: row.tenantId ?? '',
      entityId: eid != null && eid !== '' ? String(eid) : undefined,
      entityType: row.entityType != null && String(row.entityType).trim() !== '' ? String(row.entityType) : undefined,
      oldValue: row.oldValue != null && String(row.oldValue).trim() !== '' ? String(row.oldValue) : undefined,
      newValue: row.newValue != null && String(row.newValue).trim() !== '' ? String(row.newValue) : undefined,
    };
  }
}
