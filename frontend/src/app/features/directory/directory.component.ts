import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DirectoryEntry, DirectoryService } from '../../core/services/directory.service';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { OperationsService } from '../../core/services/operations.service';
import { OperationalStaffRow } from '../../core/models/operations.models';
import { UiAccessService } from '../../core/services/ui-access.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { filter, map, skip } from 'rxjs/operators';
import { distinctUntilChanged } from 'rxjs';
import { ImportExportService } from '../../core/services/import-export.service';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpPaginationComponent, ErpI18nTextDirective],
  styles: [`
    .directory-toolbar-inline {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px;
    }
    .directory-search-inline {
      width: 320px;
      min-width: 220px;
      max-width: 360px;
    }
    .directory-actions-inline {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .directory-status-inline {
      width: 150px;
      min-width: 140px;
    }
    .directory-status-select {
      height: 40px;
    }
    .directory-refresh-btn {
      min-width: 132px;
      height: 40px;
    }
    .directory-toolbar-inline .erp-label {
      margin-bottom: 4px !important;
    }
    @media (max-width: 768px) {
      .directory-search-inline,
      .directory-status-inline {
        width: 100%;
        max-width: 100%;
      }
      .directory-actions-inline {
        margin-left: 0;
        width: 100%;
      }
    }
  `],
  template: `
    <div data-testid="directory-page">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'directory.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            <ng-container *ngIf="activeTab !== 'staff'">{{ 'directory.pageLead' | translate }}</ng-container>
            <ng-container *ngIf="activeTab === 'staff'">{{ 'staff.list.lead' | translate }}</ng-container>
          </p>
        </div>
      </div>

      <div class="erp-card mb-4">
        <div class="erp-tabs mb-3">
          <button type="button" class="erp-tab" [class.active]="activeTab === 'all'" (click)="setTab('all')" data-testid="directory-tab-all">
            {{ 'directory.tabAll' | translate }}
          </button>
          <button type="button" class="erp-tab" [class.active]="activeTab === 'staff'" (click)="setTab('staff')" data-testid="directory-tab-staff">
            {{ 'directory.tabStaff' | translate }}
          </button>
        </div>

        <div class="directory-toolbar-inline">
          <div class="directory-search-inline">
            <label class="erp-label" *ngIf="activeTab === 'all'" erpI18nText="directory.searchLabel"></label>
            <label class="erp-label" *ngIf="activeTab === 'staff'" [attr.title]="('staff.list.searchPlaceholder' | translate)" style="white-space: nowrap;">{{ ('directory.staffToolbarSearchShort' | translate) }}</label>
            <input
              class="erp-input"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange()"
              [attr.placeholder]="((activeTab === 'staff' ? 'staff.list.searchPlaceholder' : 'directory.searchPlaceholder') | translate)"
              data-testid="directory-search-input"
            />
          </div>
          <div class="directory-actions-inline">
            <div class="directory-status-inline" *ngIf="activeTab === 'staff'">
              <select
                class="erp-select directory-status-select"
                [(ngModel)]="staffStatusFilter"
                (change)="refreshStaffList()"
                [attr.aria-label]="'staff.list.thStatus' | translate"
              >
                <option value="active">{{ 'staff.list.statusActive' | translate }}</option>
                <option value="inactive">{{ 'staff.list.statusInactive' | translate }}</option>
              </select>
            </div>
            <button *ngIf="activeTab === 'staff'" type="button" class="btn-outline-erp directory-refresh-btn" (click)="refreshStaffList()" [disabled]="staffLoading">
              <i class="bi bi-arrow-clockwise"></i> {{ 'staff.list.refresh' | translate }}
            </button>
            <button *ngIf="activeTab === 'staff' && canManageStaff" type="button" class="btn-outline-erp directory-refresh-btn" (click)="exportCanonicalStaffCsv()">
              <i class="bi bi-download"></i> {{ 'staff.list.exportCsv' | translate }}
            </button>
            <a *ngIf="activeTab === 'staff' && canManageStaff" routerLink="/app/staff/new" class="btn-primary-erp directory-refresh-btn" data-testid="directory-add-staff">
              <i class="bi bi-plus-lg"></i> {{ 'staff.list.add' | translate }}
            </a>
            <button *ngIf="activeTab !== 'staff'" type="button" class="btn-primary-erp" (click)="runSearch()" [disabled]="loading || query.trim().length < 2">
              {{ loading ? ('directory.searching' | translate) : ('directory.search' | translate) }}
            </button>
          </div>
        </div>
        <div *ngIf="activeTab === 'staff' && staffExportMessage" class="alert py-2 small mb-0 mt-2" [class.alert-success]="staffExportMessageOk" [class.alert-danger]="!staffExportMessageOk">
          <div class="d-flex justify-content-between align-items-center gap-2">
            <span>{{ staffExportMessage }}</span>
            <button type="button" class="btn-close" [attr.aria-label]="'directory.closeAlert' | translate" (click)="clearStaffExportMessage()"></button>
          </div>
        </div>
        <p *ngIf="activeTab === 'all'" class="text-muted small mb-0 mt-2">{{ 'directory.tip' | translate }}</p>
      </div>

      <div class="erp-card" *ngIf="error" style="border-color: var(--clr-danger);">
        <p class="mb-0 text-danger">{{ error }}</p>
      </div>

      <div class="erp-card" *ngIf="!error && activeTab === 'all' && !pagedResults.length && searched && !loading">
        <div class="empty-state py-4">
          <i class="bi bi-search"></i>
          <h3>{{ 'directory.emptyTitle' | translate }}</h3>
          <p>{{ 'directory.emptyLead' | translate }}</p>
        </div>
      </div>

      <div class="erp-card p-0 overflow-hidden" *ngIf="activeTab === 'all' && pagedResults.length && searched">
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

      <div class="erp-card p-0 overflow-hidden" *ngIf="activeTab === 'staff'" data-testid="directory-staff-pane">
        <div class="table-responsive">
          <table class="erp-table mb-0" data-testid="directory-staff-table">
            <thead>
              <tr>
                <th>{{ 'staff.list.thName' | translate }}</th>
                <th>{{ 'staff.list.thRole' | translate }}</th>
                <th>{{ 'staff.list.thContact' | translate }}</th>
                <th>{{ 'staff.list.thStatus' | translate }}</th>
                <th class="text-end" *ngIf="canManageStaff">{{ 'staff.list.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="staffLoading">
                <td [attr.colspan]="staffTableSpan" class="text-center text-muted py-4">{{ 'staff.list.loading' | translate }}</td>
              </tr>
              <tr *ngIf="!staffLoading && !pagedStaff.length">
                <td [attr.colspan]="staffTableSpan" class="text-center text-muted py-5">{{ 'staff.list.empty' | translate }}</td>
              </tr>
              <tr *ngFor="let s of pagedStaff" [attr.data-testid]="'directory-staff-row-' + s.id">
                <td>
                  <strong>{{ s.fullName }}</strong>
                  <div *ngIf="s.employeeCode" class="small text-muted">{{ s.employeeCode }}</div>
                </td>
                <td class="text-muted small">{{ s.staffRole || ('directory.emDash' | translate) }}</td>
                <td class="small">{{ s.email || s.phone || ('directory.emDash' | translate) }}</td>
                <td>
                  <span class="badge-erp" [ngClass]="s.isActive !== false ? 'badge-success' : 'badge-neutral'">
                    {{ s.isActive !== false ? ('directory.staffActive' | translate) : ('directory.staffInactive' | translate) }}
                  </span>
                </td>
                <td *ngIf="canManageStaff" class="text-end">
                  <div class="d-flex gap-1 justify-content-end">
                    <a [routerLink]="['/app/staff', s.id]" class="btn-icon" [title]="'staff.list.view' | translate"><i class="bi bi-eye"></i></a>
                    <a [routerLink]="['/app/staff', s.id, 'edit']" class="btn-icon" [title]="'staff.list.edit' | translate"><i class="bi bi-pencil"></i></a>
                    <button *ngIf="s.isActive !== false" type="button" class="btn-icon" (click)="setStaffStatus(s, 'inactive')" [title]="'directory.staffDeactivate' | translate">
                      <i class="bi bi-person-dash" style="color: var(--clr-warning);"></i>
                    </button>
                    <button *ngIf="s.isActive === false" type="button" class="btn-icon" (click)="setStaffStatus(s, 'active')" [title]="'directory.staffActivate' | translate">
                      <i class="bi bi-person-check" style="color: var(--clr-success);"></i>
                    </button>
                    <button *ngIf="s.isActive === false" type="button" class="btn-icon" (click)="archiveStaffRow(s)" [title]="'directory.staffDeleteArchive' | translate">
                      <i class="bi bi-trash" style="color: var(--clr-danger);"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-3 pb-2" *ngIf="staffTotal > 0">
          <app-erp-pagination
            [totalElements]="staffTotal"
            [pageIndex]="staffPageIndex"
            [pageSize]="staffPageSize"
            (pageIndexChange)="onStaffPageIndexChange($event)"
            (pageSizeChange)="onStaffPageSizeChange($event)"
          />
        </div>
        <p *ngIf="staffLoadError" class="text-danger small px-3 pb-3 mb-0">{{ staffLoadError }}</p>
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
  activeTab: 'all' | 'staff' = 'all';
  staffRows: OperationalStaffRow[] = [];
  pagedStaff: OperationalStaffRow[] = [];
  staffPageIndex = 0;
  staffPageSize = DEFAULT_ERP_PAGE_SIZE;
  staffTotal = 0;
  staffStatusFilter: 'active' | 'inactive' = 'active';
  staffExportMessage = '';
  staffExportMessageOk = true;
  staffLoading = false;
  staffLoadError = '';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private directoryService: DirectoryService,
    private operationsService: OperationsService,
    private uiAccess: UiAccessService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
    private importExport: ImportExportService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get canManageStaff(): boolean {
    return this.uiAccess.hasDirectoryDeskWriteAccess();
  }

  get staffTableSpan(): number {
    return this.canManageStaff ? 5 : 4;
  }

  get directoryUsesServerPaging(): boolean {
    return !runtimeConfig.useMocks;
  }

  get paginationTotal(): number {
    return this.directoryUsesServerPaging ? this.totalFromServer : this.results.length;
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    const snapshotTab =
      this.route.snapshot.queryParamMap.get('tab')?.toLowerCase() === 'staff'
        ? ('staff' as const)
        : ('all' as const);
    this.activeTab = snapshotTab;
    if (snapshotTab === 'staff') {
      this.pagedResults = [];
      this.searched = false;
      this.totalFromServer = 0;
      this.staffPageIndex = 0;
      this.refreshStaffList();
    }

    this.route.queryParamMap
      .pipe(
        map(q => ((q.get('tab') ?? '').toLowerCase() === 'staff' ? 'staff' : 'all') as 'staff' | 'all'),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(tab => {
        const prevTab = this.activeTab;
        this.activeTab = tab;
        if (tab === 'staff') {
          this.pagedResults = [];
          this.searched = false;
          this.totalFromServer = 0;
          if (prevTab !== 'staff') {
            this.staffPageIndex = 0;
          }
          this.refreshStaffList();
          return;
        }
        this.staffLoading = false;
        this.staffRows = [];
        this.pagedStaff = [];
        this.staffTotal = 0;
        this.staffLoadError = '';
        this.staffExportMessage = '';
        const qText = this.query.trim();
        if (qText.length >= 2) {
          this.pageIndex = 0;
          if (this.directoryUsesServerPaging) {
            this.fetchDirectoryPage();
          } else {
            this.runSearch();
          }
        }
        this.cdr.markForCheck();
      });
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
      if (this.activeTab === 'staff') {
        this.staffPageIndex = 0;
        this.refreshStaffList();
      }
      return;
    }
    this.debounceTimer = setTimeout(() => {
      if (this.activeTab === 'staff') {
        this.staffPageIndex = 0;
        this.refreshStaffList();
      } else {
        this.runSearch();
      }
    }, 350);
  }

  setTab(tab: 'all' | 'staff'): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'staff' ? 'staff' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
    this.directoryService.searchPaged(q, this.directoryKindsFilter(), this.pageIndex, this.pageSize).subscribe({
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

  private directoryKindsFilter(): string | undefined {
    if (this.activeTab === 'staff') {
      return 'staff';
    }
    return 'teacher,student,staff';
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

  refreshStaffList(): void {
    this.staffLoading = true;
    this.staffLoadError = '';
    this.operationsService
      .listStaffPageWithFilters(
        this.staffPageIndex,
        this.staffPageSize,
        this.query.trim() || undefined,
        this.staffStatusFilter
      )
      .subscribe({
        next: p => {
          this.staffRows = p.content || [];
          this.pagedStaff = p.content || [];
          this.staffTotal = p.totalElements || 0;
          this.staffPageIndex = p.page || 0;
          this.staffPageSize = p.size || this.staffPageSize;
          this.staffLoading = false;
          this.cdr.markForCheck();
        },
        error: (e: Error) => {
          this.staffLoading = false;
          this.staffRows = [];
          this.pagedStaff = [];
          this.staffTotal = 0;
          this.staffLoadError = e?.message || this.translate.instant('staff.list.loadError');
          this.cdr.markForCheck();
        },
      });
  }

  exportCanonicalStaffCsv(): void {
    this.staffExportMessage = this.translate.instant('directory.exportQueued');
    this.staffExportMessageOk = true;
    this.importExport.createExportJob('STAFF').subscribe({
      next: job => this.pollStaffExportJob(job.id, 0),
      error: e => {
        this.staffExportMessage = e?.message || this.translate.instant('directory.exportFailed');
        this.staffExportMessageOk = false;
      },
    });
  }

  clearStaffExportMessage(): void {
    this.staffExportMessage = '';
  }

  private pollStaffExportJob(jobId: number, attempt: number): void {
    this.importExport.getExportJob(jobId).subscribe({
      next: job => {
        const status = (job.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          this.importExport.downloadExportJobCsv(jobId).subscribe(blob => {
            this.saveBlob(blob, `canonical-staff-${new Date().toISOString().slice(0, 10)}-${jobId}.csv`);
            this.staffExportMessage = this.translate.instant('directory.exportDone');
            this.staffExportMessageOk = true;
          });
          return;
        }
        if (status === 'FAILED') {
          this.staffExportMessage = job.errorMessage || this.translate.instant('directory.exportFailed');
          this.staffExportMessageOk = false;
          return;
        }
        if (attempt > 80) {
          this.staffExportMessage = this.translate.instant('directory.exportTimeout');
          this.staffExportMessageOk = false;
          return;
        }
        setTimeout(() => this.pollStaffExportJob(jobId, attempt + 1), 1500);
      },
      error: () => {
        this.staffExportMessage = this.translate.instant('directory.exportFailed');
        this.staffExportMessageOk = false;
      },
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  setStaffStatus(row: OperationalStaffRow, status: 'active' | 'inactive'): void {
    const action = status === 'active' ? 'reactivate' : 'deactivate';
    this.confirmDialog
      .confirm({
        title: this.translate.instant(`directory.lifecycleConfirm.${action}.title`),
        message: this.translate.instant(`directory.lifecycleConfirm.${action}.message`, { name: row.fullName }),
        details: [
          this.translate.instant(`directory.lifecycleConfirm.${action}.detailVisible`),
          this.translate.instant(`directory.lifecycleConfirm.${action}.detailReversible`),
        ],
        variant: 'warning',
        confirmLabel: this.translate.instant(`directory.lifecycleConfirm.${action}.confirm`),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.operationsService.updateStaffStatus(row.id, status === 'active').subscribe({
          next: () => this.refreshStaffList(),
          error: (e: Error) => {
            this.error = e?.message || this.translate.instant('directory.searchFailed');
          },
        });
      });
  }

  /** Soft-delete / archive — removes row from active and inactive lists (ERP-style lifecycle final step). */
  archiveStaffRow(row: OperationalStaffRow): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('directory.lifecycleConfirm.deleteSoft.title'),
        message: this.translate.instant('directory.lifecycleConfirm.deleteSoft.message', { name: row.fullName }),
        details: [
          this.translate.instant('directory.lifecycleConfirm.deleteSoft.detailHidden'),
          this.translate.instant('directory.lifecycleConfirm.deleteSoft.detailRetention'),
        ],
        variant: 'danger',
        confirmLabel: this.translate.instant('directory.lifecycleConfirm.deleteSoft.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.operationsService.deleteStaff(row.id, false).subscribe({
          next: () => this.refreshStaffList(),
          error: (e: Error) => {
            this.error = e?.message || this.translate.instant('directory.searchFailed');
          },
        });
      });
  }

  onStaffPageIndexChange(idx: number): void {
    this.staffPageIndex = idx;
    this.refreshStaffList();
  }

  onStaffPageSizeChange(size: number): void {
    this.staffPageSize = size;
    this.staffPageIndex = 0;
    this.refreshStaffList();
  }
}
