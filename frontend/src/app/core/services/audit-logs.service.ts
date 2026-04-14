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
    const tq = (opts.q ?? '').trim().toLowerCase();
    if (tq) {
      rows = rows.filter(
        l =>
          l.description.toLowerCase().includes(tq) ||
          l.userName.toLowerCase().includes(tq) ||
          l.module.toLowerCase().includes(tq)
      );
    }
    return of(sliceToPage(rows, page, size)).pipe(delay(200));
  }

  private normalize(row: any): AuditLog {
    const ts = row.timestamp ?? row.createdAt ?? '';
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
    };
  }
}
