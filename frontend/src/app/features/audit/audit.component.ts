import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditLog } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { AuditLogsService } from '../../core/services/audit-logs.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

const AUDIT_ACTIONS = ['create', 'update', 'delete', 'login'] as const;
const AUDIT_MODULES = ['Students', 'Teachers', 'Fees', 'Attendance', 'Exams', 'System'];

function buildAuditSeed(): AuditLog[] {
  const base: AuditLog[] = [
    { id: 'al1', action: 'create', module: 'Students', description: 'New student Arjun Patel added', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T10:30:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
    { id: 'al2', action: 'update', module: 'Fees', description: 'Fee payment recorded for Emily Watson', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T09:15:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
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
  return base;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
  template: `
    <div data-testid="audit-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">{{ 'audit.pageTitle' | translate }}</h2><p class="text-muted mb-0" style="font-size: 13px;">{{ 'audit.lead' | translate }}</p></div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadFromServer()"><i class="bi bi-arrow-clockwise"></i> {{ 'audit.refresh' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-sm" data-testid="export-audit-btn"><i class="bi bi-download"></i> {{ 'audit.export' | translate }}</button>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="d-flex flex-wrap gap-3 mb-3 align-items-end">
          <div class="search-input-wrapper flex-grow-1" style="min-width: 200px; max-width: 360px;">
            <i class="bi bi-search"></i>
            <input
              type="text"
              class="erp-input"
              erpI18nPh="audit.searchPlaceholder"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
            />
          </div>
          <select class="erp-select" style="width: 160px;" [(ngModel)]="actionFilter" (ngModelChange)="onFilterDropdownChange()">
            <option value="">{{ 'audit.filterAllActions' | translate }}</option>
            <option value="create">{{ 'audit.action.create' | translate }}</option>
            <option value="update">{{ 'audit.action.update' | translate }}</option>
            <option value="delete">{{ 'audit.action.delete' | translate }}</option>
            <option value="login">{{ 'audit.action.login' | translate }}</option>
          </select>
          <select class="erp-select" style="width: 160px;" [(ngModel)]="moduleFilter" (ngModelChange)="onFilterDropdownChange()">
            <option value="">{{ 'audit.filterAllModules' | translate }}</option>
            <option *ngFor="let m of modules" [value]="m">{{ moduleLabel(m) }}</option>
          </select>
        </div>
        <div style="overflow-x: auto;" dir="ltr">
          <table class="erp-table" data-testid="audit-table">
            <thead><tr><th>{{ 'audit.thAction' | translate }}</th><th>{{ 'audit.thModule' | translate }}</th><th>{{ 'audit.thDescription' | translate }}</th><th>{{ 'audit.thUser' | translate }}</th><th>{{ 'audit.thTimestamp' | translate }}</th><th>{{ 'audit.thIp' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let log of pagedLogs">
                <td><span class="badge-erp" [ngClass]="getActionBadge(log.action)">{{ actionLabel(log.action) }}</span></td>
                <td>{{ moduleLabel(log.module) }}</td>
                <td>{{ log.description }}</td>
                <td>{{ log.userName }}</td>
                <td style="white-space: nowrap;">{{ formatDate(log.timestamp) }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ log.ipAddress }}</td>
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
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private totalFromServer = 0;
  private apiSeq = 0;

  constructor(
    private translate: TranslateService,
    private auditApi: AuditLogsService
  ) {}

  get paginationTotal(): number {
    return runtimeConfig.useMocks ? this.filteredLogs.length : this.totalFromServer;
  }

  ngOnInit(): void {
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

  filter(): void {
    if (!runtimeConfig.useMocks) {
      this.pageIndex = 0;
      this.fetchApiPage();
      return;
    }
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredLogs = this.logs.filter(l => {
      const actionOk = !this.actionFilter || l.action === this.actionFilter;
      const moduleOk = !this.moduleFilter || l.module === this.moduleFilter;
      const textOk =
        !q ||
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q);
      return actionOk && moduleOk && textOk;
    });
    this.applyPage();
  }

  private fetchApiPage(): void {
    const seq = ++this.apiSeq;
    this.auditApi
      .getPage(
        {
          page: this.pageIndex,
          size: this.pageSize,
          action: this.actionFilter || undefined,
          module: this.moduleFilter || undefined,
          q: this.searchQuery.trim() || undefined,
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
    const map: Record<string, string> = { create: 'badge-success', update: 'badge-info', delete: 'badge-danger', login: 'badge-neutral', logout: 'badge-neutral' };
    return map[action] || 'badge-neutral';
  }

  formatDate(dateStr: string): string {
    const lang = (this.translate.currentLang || 'en').split('-')[0];
    return new Date(dateStr).toLocaleString(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
