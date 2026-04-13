import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditLog } from '../../core/models/models';

const AUDIT_LOG_SEED: AuditLog[] = [
  { id: 'al1', action: 'create', module: 'Students', description: 'New student Arjun Patel added', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T10:30:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
  { id: 'al2', action: 'update', module: 'Fees', description: 'Fee payment recorded for Emily Watson', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T09:15:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
  { id: 'al3', action: 'login', module: 'System', description: 'Admin login successful', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-05T08:00:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
  { id: 'al4', action: 'update', module: 'Attendance', description: 'Attendance marked for Class 5-A', userId: 'u2', userName: 'Sarah Mitchell', timestamp: '2026-02-04T14:30:00Z', ipAddress: '192.168.1.105', tenantId: 't1' },
  { id: 'al5', action: 'create', module: 'Exams', description: 'New exam schedule created: Midterm', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-04T11:00:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
  { id: 'al6', action: 'delete', module: 'Students', description: 'Student record archived', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-03T16:45:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
  { id: 'al7', action: 'update', module: 'Teachers', description: 'Teacher profile updated: Maria Torres', userId: 'u1', userName: 'John Anderson', timestamp: '2026-02-03T10:20:00Z', ipAddress: '192.168.1.100', tenantId: 't1' },
  { id: 'al8', action: 'login', module: 'System', description: 'Teacher login successful', userId: 'u2', userName: 'Sarah Mitchell', timestamp: '2026-02-03T08:05:00Z', ipAddress: '192.168.1.105', tenantId: 't1' }
];

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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
        <div class="d-flex gap-3 mb-3">
          <select class="erp-select" style="width: 160px;" [(ngModel)]="actionFilter" (change)="filter()">
            <option value="">{{ 'audit.filterAllActions' | translate }}</option>
            <option value="create">{{ 'audit.action.create' | translate }}</option>
            <option value="update">{{ 'audit.action.update' | translate }}</option>
            <option value="delete">{{ 'audit.action.delete' | translate }}</option>
            <option value="login">{{ 'audit.action.login' | translate }}</option>
          </select>
          <select class="erp-select" style="width: 160px;" [(ngModel)]="moduleFilter" (change)="filter()">
            <option value="">{{ 'audit.filterAllModules' | translate }}</option>
            <option *ngFor="let m of modules" [value]="m">{{ moduleLabel(m) }}</option>
          </select>
        </div>
        <table class="erp-table" data-testid="audit-table">
          <thead><tr><th>{{ 'audit.thAction' | translate }}</th><th>{{ 'audit.thModule' | translate }}</th><th>{{ 'audit.thDescription' | translate }}</th><th>{{ 'audit.thUser' | translate }}</th><th>{{ 'audit.thTimestamp' | translate }}</th><th>{{ 'audit.thIp' | translate }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let log of filteredLogs">
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
    </div>
  `
})
export class AuditComponent implements OnInit {
  actionFilter = '';
  moduleFilter = '';
  modules = ['Students', 'Teachers', 'Fees', 'Attendance', 'Exams', 'System'];

  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.reloadFromServer();
  }

  /** Mock: resets catalog; API-backed version will call the same method without the seed. */
  reloadFromServer(): void {
    this.logs = AUDIT_LOG_SEED.map(row => ({ ...row }));
    this.filter();
  }

  filter(): void {
    this.filteredLogs = this.logs.filter(l =>
      (!this.actionFilter || l.action === this.actionFilter) && (!this.moduleFilter || l.module === this.moduleFilter)
    );
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
