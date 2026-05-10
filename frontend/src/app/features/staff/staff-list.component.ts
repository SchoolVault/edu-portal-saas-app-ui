import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationsService } from '../../core/services/operations.service';
import { OperationalStaffRow } from '../../core/models/operations.models';
import { UiAccessService } from '../../core/services/ui-access.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { ImportExportService } from '../../core/services/import-export.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
  template: `
    <div class="staff-list-page" data-testid="staff-list-page">
      <header class="erp-page-header animate-in">
        <div>
          <h1 class="erp-page-header__title">{{ 'staff.list.title' | translate }}</h1>
          <p class="erp-page-header__lead">{{ 'staff.list.lead' | translate }}</p>
        </div>
        <div class="erp-page-header__actions">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()">
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> {{ 'staff.list.refresh' | translate }}
          </button>
          <button *ngIf="canManage" type="button" class="btn-outline-erp btn-sm" (click)="exportCsv()">
            <i class="bi bi-download" aria-hidden="true"></i> {{ 'staff.list.exportCsv' | translate }}
          </button>
          <a *ngIf="canManage" routerLink="/app/staff/new" class="btn-primary-erp btn-sm" data-testid="staff-add-btn">
            <i class="bi bi-plus-lg" aria-hidden="true"></i><span>{{ 'staff.list.add' | translate }}</span>
          </a>
        </div>
      </header>

      <div *ngIf="exportMessage" class="alert py-2 small mb-3" [class.alert-success]="exportMessageOk" [class.alert-danger]="!exportMessageOk">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <span>{{ exportMessage }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'staff.list.closeAlert' | translate" (click)="exportMessage = ''"></button>
        </div>
      </div>

      <div class="erp-card animate-in animate-in-delay-1">
        <div class="erp-filter-toolbar mb-3">
          <div class="search-input-wrapper erp-filter-toolbar__search">
            <i class="bi bi-search"></i>
            <input
              type="text"
              class="erp-input"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              erpI18nPh="staff.list.searchPlaceholder"
              data-testid="staff-search"
            />
          </div>
          <div class="d-flex gap-2 align-items-end">
            <select class="erp-select staff-list-status-select" [(ngModel)]="statusFilter" (ngModelChange)="reload()">
              <option value="active">{{ 'staff.list.statusActive' | translate }}</option>
              <option value="inactive">{{ 'staff.list.statusInactive' | translate }}</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="erp-table mb-0" data-testid="staff-table">
            <thead>
              <tr>
                <th>{{ 'staff.list.thName' | translate }}</th>
                <th>{{ 'staff.list.thRole' | translate }}</th>
                <th>{{ 'staff.list.thContact' | translate }}</th>
                <th>{{ 'staff.list.thStatus' | translate }}</th>
                <th *ngIf="canManage">{{ 'staff.list.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="!loading && !rows.length">
                <td [attr.colspan]="canManage ? 5 : 4" class="text-center text-muted py-5">{{ 'staff.list.empty' | translate }}</td>
              </tr>
              <tr *ngFor="let s of rows">
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
                <td *ngIf="canManage" class="text-end">
                  <div class="d-flex gap-1 justify-content-end">
                    <a [routerLink]="['/app/staff', s.id]" class="btn-icon" [title]="'staff.list.view' | translate"><i class="bi bi-eye"></i></a>
                    <a [routerLink]="['/app/staff', s.id, 'edit']" class="btn-icon" [title]="'staff.list.edit' | translate"><i class="bi bi-pencil"></i></a>
                    <button
                      *ngIf="s.isActive !== false"
                      type="button"
                      class="btn-icon"
                      (click)="setStatus(s, false)"
                      [title]="'directory.staffDeactivate' | translate"
                    >
                      <i class="bi bi-person-dash" style="color: var(--clr-warning);"></i>
                    </button>
                    <button
                      *ngIf="s.isActive === false"
                      type="button"
                      class="btn-icon"
                      (click)="setStatus(s, true)"
                      [title]="'directory.staffActivate' | translate"
                    >
                      <i class="bi bi-person-check" style="color: var(--clr-success);"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-3 pb-2" *ngIf="total > 0">
          <app-erp-pagination
            [totalElements]="total"
            [pageIndex]="pageIndex"
            [pageSize]="pageSize"
            (pageIndexChange)="onPageIndex($event)"
            (pageSizeChange)="onPageSize($event)"
          />
        </div>
        <p *ngIf="loading" class="text-muted small px-3 py-2 mb-0">{{ 'staff.list.loading' | translate }}</p>
        <p *ngIf="loadError" class="text-danger small px-3 py-2 mb-0">{{ loadError }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .staff-list-page .erp-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 82%, var(--clr-primary) 18%);
        border-radius: 14px;
      }
      .staff-list-status-select {
        min-width: 160px;
      }
      .search-input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 240px;
        flex: 1 1 280px;
      }
      .search-input-wrapper .erp-input {
        flex: 1;
      }
      @media (max-width: 768px) {
        .staff-list-page .erp-filter-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .staff-list-page .erp-filter-toolbar .erp-filter-toolbar__search {
          flex: 1 1 auto;
          min-width: 0;
          max-width: none;
        }
        .staff-list-page .erp-filter-toolbar .erp-select {
          width: 100%;
          min-width: 0 !important;
        }
      }
    `,
  ],
})
export class StaffListComponent implements OnInit {
  searchTerm = '';
  statusFilter: 'active' | 'inactive' = 'active';
  rows: OperationalStaffRow[] = [];
  pageIndex = 0;
  pageSize = DEFAULT_ERP_PAGE_SIZE;
  total = 0;
  loading = false;
  loadError = '';
  exportMessage = '';
  exportMessageOk = true;

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly operations: OperationsService,
    private readonly uiAccess: UiAccessService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
    private readonly importExport: ImportExportService,
    private readonly confirm: ConfirmDialogService
  ) {}

  get canManage(): boolean {
    return this.uiAccess.hasDirectoryDeskWriteAccess();
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.reload();
  }

  onSearchChange(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.pageIndex = 0;
      this.reload();
    }, 320);
  }

  reload(): void {
    this.loading = true;
    this.loadError = '';
    this.operations
      .listStaffPageWithFilters(this.pageIndex, this.pageSize, this.searchTerm.trim() || undefined, this.statusFilter)
      .subscribe({
        next: p => {
          this.rows = p.content ?? [];
          this.total = p.totalElements ?? 0;
          this.pageIndex = p.page ?? 0;
          this.pageSize = p.size ?? this.pageSize;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (e: Error) => {
          this.loading = false;
          this.rows = [];
          this.total = 0;
          this.loadError = e?.message || this.translate.instant('staff.list.loadError');
          this.cdr.markForCheck();
        },
      });
  }

  onPageIndex(i: number): void {
    this.pageIndex = i;
    this.reload();
  }

  onPageSize(s: number): void {
    this.pageSize = s;
    this.pageIndex = 0;
    this.reload();
  }

  exportCsv(): void {
    this.exportMessage = this.translate.instant('directory.exportQueued');
    this.exportMessageOk = true;
    this.importExport.createExportJob('STAFF').subscribe({
      next: job => this.pollExport(job.id, 0),
      error: e => {
        this.exportMessage = e?.message || this.translate.instant('directory.exportFailed');
        this.exportMessageOk = false;
      },
    });
  }

  private pollExport(jobId: number, attempt: number): void {
    this.importExport.getExportJob(jobId).subscribe({
      next: job => {
        const status = (job.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          this.importExport.downloadExportJobCsv(jobId).subscribe(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canonical-staff-${new Date().toISOString().slice(0, 10)}-${jobId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            this.exportMessage = this.translate.instant('directory.exportDone');
            this.exportMessageOk = true;
          });
          return;
        }
        if (status === 'FAILED') {
          this.exportMessage = job.errorMessage || this.translate.instant('directory.exportFailed');
          this.exportMessageOk = false;
          return;
        }
        if (attempt > 80) {
          this.exportMessage = this.translate.instant('directory.exportTimeout');
          this.exportMessageOk = false;
          return;
        }
        setTimeout(() => this.pollExport(jobId, attempt + 1), 1500);
      },
      error: () => {
        this.exportMessage = this.translate.instant('directory.exportFailed');
        this.exportMessageOk = false;
      },
    });
  }

  setStatus(row: OperationalStaffRow, active: boolean): void {
    const action = active ? 'reactivate' : 'deactivate';
    this.confirm
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
        this.operations.updateStaffStatus(row.id, active).subscribe({
          next: () => this.reload(),
          error: (e: Error) => {
            this.loadError = e?.message || this.translate.instant('staff.list.statusError');
            this.cdr.markForCheck();
          },
        });
      });
  }
}
