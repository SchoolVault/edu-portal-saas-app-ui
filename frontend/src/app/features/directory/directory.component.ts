import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DirectoryEntry, DirectoryService } from '../../core/services/directory.service';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective, ErpI18nTextDirective],
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
        <label class="erp-label" erpI18nText="directory.searchLabel"></label>
        <div class="d-flex flex-wrap gap-2">
          <input
            class="erp-input"
            style="flex: 1; min-width: 200px;"
            [(ngModel)]="query"
            (ngModelChange)="onQueryChange()"
            erpI18nPh="directory.searchPlaceholder"
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

      <div class="erp-card" *ngIf="!error && !pagedResults.length && searched && !loading">
        <div class="empty-state py-4">
          <i class="bi bi-search"></i>
          <h3>{{ 'directory.emptyTitle' | translate }}</h3>
          <p>{{ 'directory.emptyLead' | translate }}</p>
        </div>
      </div>

      <div class="erp-card p-0 overflow-hidden" *ngIf="pagedResults.length && searched">
        <div class="table-responsive">
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
            <tr *ngFor="let r of pagedResults" [attr.data-testid]="'directory-row-' + r.kind + '-' + r.id">
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
        <div class="px-3 pb-2">
          <app-erp-pagination
            [totalElements]="paginationTotal"
            [pageIndex]="pageIndex"
            [pageSize]="pageSize"
            (pageIndexChange)="onPageIndexChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class DirectoryComponent implements OnInit {
  query = '';
  results: DirectoryEntry[] = [];
  pagedResults: DirectoryEntry[] = [];
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  totalFromServer = 0;
  loading = false;
  error = '';
  searched = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private directoryService: DirectoryService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  get directoryUsesServerPaging(): boolean {
    return !runtimeConfig.useMocks;
  }

  get paginationTotal(): number {
    return this.directoryUsesServerPaging ? this.totalFromServer : this.results.length;
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

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
      this.pagedResults = [];
      this.pageIndex = 0;
      this.totalFromServer = 0;
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
    this.pageIndex = 0;
    if (this.directoryUsesServerPaging) {
      this.fetchDirectoryPage();
      return;
    }
    this.loading = true;
    this.error = '';
    this.directoryService.search(q).subscribe({
      next: res => {
        this.results = res.results || [];
        this.pageIndex = 0;
        this.applyPage();
        this.searched = true;
        this.loading = false;
      },
      error: (e: Error) => {
        this.loading = false;
        this.error = e?.message || this.translate.instant('directory.searchFailed');
        this.results = [];
        this.pagedResults = [];
      },
    });
  }

  private fetchDirectoryPage(): void {
    const q = this.query.trim();
    if (q.length < 2) {
      return;
    }
    this.loading = true;
    this.error = '';
    this.directoryService.searchPaged(q, undefined, this.pageIndex, this.pageSize).subscribe({
      next: p => {
        this.pagedResults = p.content;
        this.totalFromServer = p.totalElements;
        this.pageIndex = p.page;
        this.pageSize = p.size;
        this.results = [];
        this.searched = true;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (e: Error) => {
        this.loading = false;
        this.error = e?.message || this.translate.instant('directory.searchFailed');
        this.pagedResults = [];
        this.totalFromServer = 0;
      },
    });
  }

  private applyPage(): void {
    const slice = sliceToPage(this.results, this.pageIndex, this.pageSize);
    this.pagedResults = slice.content;
    this.pageIndex = slice.page;
  }

  onPageIndexChange(idx: number): void {
    this.pageIndex = idx;
    if (this.directoryUsesServerPaging) {
      this.fetchDirectoryPage();
      return;
    }
    this.applyPage();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    if (this.directoryUsesServerPaging) {
      this.fetchDirectoryPage();
      return;
    }
    this.applyPage();
  }
}
