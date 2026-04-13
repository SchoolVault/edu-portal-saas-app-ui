import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DirectoryEntry, DirectoryService } from '../../core/services/directory.service';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div data-testid="directory-page">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'directory.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            {{ 'directory.pageLead' | translate }}
          </p>
        </div>
      </div>

      <div class="erp-card mb-4">
        <label class="erp-label">{{ 'directory.searchLabel' | translate }}</label>
        <div class="d-flex flex-wrap gap-2">
          <input
            class="erp-input"
            style="flex: 1; min-width: 200px;"
            [(ngModel)]="query"
            (ngModelChange)="onQueryChange()"
            [placeholder]="'directory.searchPlaceholder' | translate"
            data-testid="directory-search-input"
          />
          <button type="button" class="btn-primary-erp" (click)="runSearch()" [disabled]="loading || query.trim().length < 2">
            {{ loading ? ('directory.searching' | translate) : ('directory.search' | translate) }}
          </button>
        </div>
        <p class="text-muted small mb-0 mt-2">{{ 'directory.tip' | translate }}</p>
      </div>

      <div class="erp-card" *ngIf="error" style="border-color: var(--clr-danger);">
        <p class="mb-0 text-danger">{{ error }}</p>
      </div>

      <div class="erp-card" *ngIf="!error && results.length === 0 && searched && !loading">
        <div class="empty-state py-4">
          <i class="bi bi-search"></i>
          <h3>{{ 'directory.emptyTitle' | translate }}</h3>
          <p>{{ 'directory.emptyLead' | translate }}</p>
        </div>
      </div>

      <div class="table-responsive erp-card p-0 overflow-hidden" *ngIf="results.length">
        <table class="erp-table mb-0">
          <thead>
            <tr>
              <th>{{ 'directory.thType' | translate }}</th>
              <th>{{ 'directory.thName' | translate }}</th>
              <th>{{ 'directory.thDetails' | translate }}</th>
              <th>{{ 'directory.thContact' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of results" [attr.data-testid]="'directory-row-' + r.kind + '-' + r.id">
              <td><span class="badge-erp badge-neutral">{{ kindLabel(r.kind) }}</span></td>
              <td><strong>{{ r.displayName }}</strong></td>
              <td class="text-muted small">{{ r.subtitle || ('directory.emDash' | translate) }}</td>
              <td class="small">
                <div *ngIf="r.email">{{ r.email }}</div>
                <div *ngIf="r.phone">{{ r.phone }}</div>
                <span *ngIf="!r.email && !r.phone">{{ 'directory.emDash' | translate }}</span>
              </td>
              <td class="text-end">
                <a *ngIf="r.deepLink" [routerLink]="r.deepLink" class="btn-outline-erp btn-sm">{{ 'directory.open' | translate }}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DirectoryComponent {
  query = '';
  results: DirectoryEntry[] = [];
  loading = false;
  error = '';
  searched = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private directoryService: DirectoryService,
    private translate: TranslateService
  ) {}

  kindLabel(kind: string): string {
    const key = 'directory.kind.' + kind;
    const t = this.translate.instant(key);
    return t !== key ? t : kind;
  }

  onQueryChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.query.trim().length < 2) {
      this.results = [];
      this.searched = false;
      return;
    }
    this.debounceTimer = setTimeout(() => this.runSearch(), 350);
  }

  runSearch(): void {
    const q = this.query.trim();
    if (q.length < 2) {
      return;
    }
    this.loading = true;
    this.error = '';
    this.directoryService.search(q).subscribe({
      next: res => {
        this.results = res.results || [];
        this.searched = true;
        this.loading = false;
      },
      error: (e: Error) => {
        this.loading = false;
        this.error = e?.message || this.translate.instant('directory.searchFailed');
        this.results = [];
      },
    });
  }
}
