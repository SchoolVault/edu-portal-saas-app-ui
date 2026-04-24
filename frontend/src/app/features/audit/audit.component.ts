import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditLog } from '../../core/models/models';
import { MOCK_RBAC_AUDIT_LOGS } from '../../core/mocks/audit-rbac-seed';
import { runtimeConfig } from '../../core/config/runtime-config';
import { AuditLogsService } from '../../core/services/audit-logs.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

const AUDIT_ACTIONS = ['create', 'update', 'delete', 'login', 'logout', 'cache_cleared'] as const;
const AUDIT_MODULES = ['Students', 'Teachers', 'Fees', 'Attendance', 'Exams', 'Auth', 'System', 'RBAC'];

function buildAuditSeed(): AuditLog[] {
  const base: AuditLog[] = [
    { id: 'al1', action: 'create', module: 'Students', description: 'New student Arjun Patel added', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T10:30:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
    {
      id: 'al2',
      action: 'update',
      module: 'Fees',
      description: 'Fee payment recorded for Emily Watson',
      userId: 'u1',
      userName: 'John Anderson (john.anderson@demo-school.edu)',
      timestamp: '2026-02-05T09:15:00Z',
      ipAddress: '192.168.1.100',
      tenantId: 't1',
    },
    { id: 'al3', action: 'login', module: 'System', description: 'Admin login successful', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T08:00:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
    { id: 'al4', action: 'update', module: 'Attendance', description: 'Attendance marked for Class 5-A', userId: 'u2', userName: 'Sarah Mitchell', timestamp: '2026-02-04T14:30:00Z', ipAddress: '192.168.1.105', tenantId: 't1' },
    { id: 'al5', action: 'create', module: 'Exams', description: 'New exam schedule created: Midterm', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-04T11:00:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
    { id: 'al6', action: 'delete', module: 'Students', description: 'Student record archived', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-03T16:45:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
    { id: 'al7', action: 'update', module: 'Teachers', description: 'Teacher profile updated: Maria Torres', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-03T10:20:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
    { id: 'al8', action: 'login', module: 'System', description: 'Teacher login successful', userId: 'u2', userName: 'Sarah Mitchell', timestamp: '2026-02-03T08:05:00Z', ipAddress: '192.168.1.105', tenantId: 't1' },
  ];
  for (let i = 0; i < 32; i++) {
    const day = 1 + (i % 28);
    const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
    const mod = AUDIT_MODULES[i % AUDIT_MODULES.length];
    base.push({
      id: `al-synth-${i}`,
      action,
      module: mod,
      description: `Synthetic audit row ${i + 1} — ${mod} / ${action}`,
      userId: i % 2 === 0 ? 'u1' : 'u2',
      userName: i % 2 === 0 ? 'John Anderson' : 'Sarah Mitchell',
      timestamp: `2026-01-${String(day).padStart(2, '0')}T${String(9 + (i % 8)).padStart(2, '0')}:15:00Z`,
      ipAddress: i % 2 === 0 ? '192.168.1.100' : '192.168.1.105',
      tenantId: 't1',
    });
  }
  for (const row of MOCK_RBAC_AUDIT_LOGS) {
    base.push({ ...row });
  }
  return base;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
  styles: [
    `
      .audit-table-wrap {
        overflow-x: auto;
      }
      .audit-table-wrap .erp-table {
        min-width: 880px;
      }
      .audit-user-cell {
        min-width: 160px;
      }
      .audit-user-name {
        font-weight: 700;
        color: var(--clr-text);
        line-height: 1.3;
      }
      .audit-user-meta {
        font-size: 11px;
        color: var(--clr-text-muted);
      }
      .audit-filter-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: flex-end;
        justify-content: space-between;
      }
      .audit-filter-toolbar__search {
        flex: 1 1 280px;
        min-width: 220px;
        max-width: 420px;
      }
      .audit-filter-toolbar__right {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: flex-end;
        justify-content: flex-end;
      }
      .audit-filter-select {
        width: 170px;
      }
      .audit-table-wrap .audit-col-action,
      .audit-table-wrap .audit-col-module {
        white-space: nowrap;
      }
      @media (max-width: 576px) {
        .audit-table-wrap .erp-table {
          min-width: 760px;
        }
        .audit-filter-toolbar__search {
          max-width: 100%;
        }
        .audit-filter-toolbar__right {
          width: 100%;
          justify-content: stretch;
        }
        .audit-filter-select {
          flex: 1 1 100%;
          width: 100%;
        }
      }
    `,
  ],
  template: `
    <div data-testid="audit-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">{{ 'audit.pageTitle' | translate }}</h2><p class="text-muted mb-0" style="font-size: 13px;">{{ 'audit.lead' | translate }}</p></div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadFromServer()"><i class="bi bi-arrow-clockwise"></i> {{ 'audit.refresh' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-sm" data-testid="export-audit-csv-btn" (click)="exportAudit('CSV')"><i class="bi bi-filetype-csv"></i> {{ 'audit.exportCsv' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-sm" data-testid="export-audit-pdf-btn" (click)="exportAudit('PDF')"><i class="bi bi-file-earmark-pdf"></i> {{ 'audit.exportPdf' | translate }}</button>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="audit-filter-toolbar mb-3">
          <div class="search-input-wrapper audit-filter-toolbar__search">
            <i class="bi bi-search"></i>
            <input
              type="text"
              class="erp-input"
              erpI18nPh="audit.searchPlaceholder"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
            />
          </div>
          <div class="audit-filter-toolbar__right">
            <div class="d-flex flex-column" style="min-width: 170px;">
              <label class="small text-muted mb-1">{{ 'audit.periodMonth' | translate }}</label>
              <input type="month" class="erp-input" [(ngModel)]="periodMonth" (ngModelChange)="onPeriodMonthChange()" />
            </div>
            <select class="erp-select audit-filter-select" [(ngModel)]="actionFilter" (ngModelChange)="onFilterDropdownChange()">
              <option value="">{{ 'audit.filterAllActions' | translate }}</option>
              <option value="create">{{ 'audit.action.create' | translate }}</option>
              <option value="update">{{ 'audit.action.update' | translate }}</option>
              <option value="delete">{{ 'audit.action.delete' | translate }}</option>
              <option value="login">{{ 'audit.action.login' | translate }}</option>
              <option value="logout">{{ 'audit.action.logout' | translate }}</option>
              <option value="cache_cleared">{{ 'audit.action.cache_cleared' | translate }}</option>
            </select>
            <select class="erp-select audit-filter-select" [(ngModel)]="moduleFilter" (ngModelChange)="onFilterDropdownChange()">
              <option value="">{{ 'audit.filterAllModules' | translate }}</option>
              <option *ngFor="let m of modules" [value]="m">{{ moduleLabel(m) }}</option>
            </select>
          </div>
        </div>
        <div class="audit-table-wrap" dir="ltr">
          <table class="erp-table" data-testid="audit-table">
            <thead><tr><th class="audit-col-action">{{ 'audit.thAction' | translate }}</th><th class="audit-col-module">{{ 'audit.thModule' | translate }}</th><th>{{ 'audit.thDescription' | translate }}</th><th>{{ 'audit.thUser' | translate }}</th><th>{{ 'audit.thTimestamp' | translate }}</th><th>{{ 'audit.thIp' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let log of pagedLogs">
                <td class="audit-col-action"><span class="badge-erp" [ngClass]="getActionBadge(log.action)">{{ actionLabel(log.action) }}</span></td>
                <td class="audit-col-module">{{ moduleLabel(log.module) }}</td>
                <td>{{ log.description }}</td>
                <td class="audit-user-cell">
                  <div class="audit-user-name">{{ displayUser(log) }}</div>
                  <div class="audit-user-meta" *ngIf="log.userId">{{ 'audit.userIdLabel' | translate:{ id: log.userId } }}</div>
                </td>
                <td style="white-space: nowrap;">{{ formatDate(log.timestamp) }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ log.ipAddress || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-erp-pagination
          *ngIf="paginationTotal > 0"
          [totalElements]="paginationTotal"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          (pageIndexChange)="onPageIndexChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        />
      </div>
    </div>
  `
})
export class AuditComponent implements OnInit {
  actionFilter = '';
  moduleFilter = '';
  modules = AUDIT_MODULES;

  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  pagedLogs: AuditLog[] = [];
  searchQuery = '';
  /** yyyy-MM — export and list are scoped to this calendar month. */
  periodMonth = new Date().toISOString().slice(0, 7);
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private totalFromServer = 0;
  private apiSeq = 0;

  constructor(
    private translate: TranslateService,
    private auditApi: AuditLogsService,
    private route: ActivatedRoute
  ) {}

  get paginationTotal(): number {
    return runtimeConfig.useMocks ? this.filteredLogs.length : this.totalFromServer;
  }

  ngOnInit(): void {
    const m = this.route.snapshot.queryParamMap.get('module')?.trim();
    if (m && AUDIT_MODULES.includes(m)) {
      this.moduleFilter = m;
    }
    this.reloadFromServer();
  }

  /** Mock: in-memory seed; API: tenant paged audit from backend. */
  reloadFromServer(): void {
    if (runtimeConfig.useMocks) {
      this.logs = buildAuditSeed().map(row => ({ ...row }));
      this.filter();
      return;
    }
    this.pageIndex = 0;
    this.fetchApiPage();
  }

  onSearchChange(): void {
    if (runtimeConfig.useMocks) {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.searchTimer = null;
        this.pageIndex = 0;
        this.filter();
      }, 350);
      return;
    }
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.pageIndex = 0;
      this.fetchApiPage();
    }, 350);
  }

  onFilterDropdownChange(): void {
    this.pageIndex = 0;
    if (runtimeConfig.useMocks) {
      this.filter();
    } else {
      this.fetchApiPage();
    }
  }

  onPeriodMonthChange(): void {
    this.pageIndex = 0;
    if (runtimeConfig.useMocks) {
      this.filter();
    } else {
      this.fetchApiPage();
    }
  }

  /** Inclusive calendar bounds for {@code periodMonth} (yyyy-MM). */
  periodRange(): { from: string; to: string } {
    const pm = (this.periodMonth || '').trim();
    if (pm.length < 7) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return this.monthBounds(`${y}-${m}`);
    }
    return this.monthBounds(pm);
  }

  private monthBounds(pm: string): { from: string; to: string } {
    const [ys, ms] = pm.split('-');
    const y = parseInt(ys, 10);
    const m = parseInt(ms, 10);
    const from = `${ys}-${String(m).padStart(2, '0')}-01`;
    const last = new Date(y, m, 0).getDate();
    const to = `${ys}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    return { from, to };
  }

  exportAudit(format: 'CSV' | 'PDF'): void {
    const { from, to } = this.periodRange();
    this.auditApi
      .exportBlob({
        format,
        action: this.actionFilter || undefined,
        module: this.moduleFilter || undefined,
        q: this.searchQuery.trim() || undefined,
        from,
        to,
      })
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ext = format === 'PDF' ? 'pdf' : 'csv';
          a.download = `audit-trail-${this.periodMonth}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
        },
      });
  }

  filter(): void {
    if (!runtimeConfig.useMocks) {
      this.pageIndex = 0;
      this.fetchApiPage();
      return;
    }
    const q = this.searchQuery.trim().toLowerCase();
    const { from, to } = this.periodRange();
    this.filteredLogs = this.logs.filter(l => {
      const actionOk = !this.actionFilter || l.action === this.actionFilter;
      const moduleOk = !this.moduleFilter || l.module === this.moduleFilter;
      const textOk =
        !q ||
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q);
      const day = l.timestamp.slice(0, 10);
      const periodOk = day >= from && day <= to;
      return actionOk && moduleOk && textOk && periodOk;
    });
    this.applyPage();
  }

  private fetchApiPage(): void {
    const seq = ++this.apiSeq;
    const { from, to } = this.periodRange();
    this.auditApi
      .getPage(
        {
          page: this.pageIndex,
          size: this.pageSize,
          action: this.actionFilter || undefined,
          module: this.moduleFilter || undefined,
          q: this.searchQuery.trim() || undefined,
          from,
          to,
        },
        []
      )
      .subscribe(p => {
        if (seq !== this.apiSeq) return;
        this.pagedLogs = p.content;
        this.totalFromServer = p.totalElements;
        this.pageIndex = p.page;
        this.pageSize = p.size;
      });
  }

  private applyPage(): void {
    const slice = sliceToPage(this.filteredLogs, this.pageIndex, this.pageSize);
    this.pagedLogs = slice.content;
    this.pageIndex = slice.page;
  }

  onPageIndexChange(idx: number): void {
    this.pageIndex = idx;
    if (runtimeConfig.useMocks) {
      this.applyPage();
    } else {
      this.fetchApiPage();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    if (runtimeConfig.useMocks) {
      this.applyPage();
    } else {
      this.fetchApiPage();
    }
  }

  actionLabel(action: string): string {
    const key = `audit.action.${action}`;
    const t = this.translate.instant(key);
    return t !== key ? t : action;
  }

  moduleLabel(module: string): string {
    const key = `audit.modules.${module}`;
    const t = this.translate.instant(key);
    return t !== key ? t : module;
  }

  getActionBadge(action: string): string {
    const map: Record<string, string> = {
      create: 'badge-success',
      update: 'badge-info',
      delete: 'badge-danger',
      login: 'badge-neutral',
      logout: 'badge-neutral',
      cache_cleared: 'badge-warning',
    };
    return map[action] || 'badge-neutral';
  }

  displayUser(log: AuditLog): string {
    const raw = (log.userName || '').trim();
    if (raw && raw.toLowerCase() !== 'system') {
      return raw;
    }
    const m = /user logged in:\s*(.+)$/i.exec(log.description || '');
    if (m && m[1]) {
      return m[1].trim();
    }
    if (log.userId) {
      return this.translate.instant('audit.userFallbackById', { id: log.userId });
    }
    return this.translate.instant('audit.systemActor');
  }

  formatDate(dateStr: string): string {
    const lang = (this.translate.currentLang || 'en').split('-')[0];
    return new Date(dateStr).toLocaleString(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
