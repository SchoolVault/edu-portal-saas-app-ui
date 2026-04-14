import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { pageButtonIndices } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE, ERP_PAGE_SIZE_OPTIONS } from '../../core/constants/pagination.constants';

@Component({
  selector: 'app-erp-pagination',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  template: `
    <div class="erp-pagination-bar" *ngIf="totalElements > 0">
      <div class="erp-pagination-bar__meta">
        <span *ngIf="totalElements > 0">
          {{
            'pagination.showing'
              | translate
                : {
                    from: displayFrom,
                    to: displayTo,
                    total: totalElements
                  }
          }}
        </span>
      </div>
      <div class="erp-pagination-bar__controls">
        <label *ngIf="showSizeChanger" class="erp-pagination-bar__size">
          <span class="small text-muted me-1">{{ 'pagination.perPage' | translate }}</span>
          <select
            class="erp-select erp-pagination-bar__select"
            [ngModel]="pageSize"
            (ngModelChange)="onSizeChange($event)"
          >
            <option *ngFor="let s of sizeOptions" [ngValue]="s">{{ s }}</option>
          </select>
        </label>
        <div class="pagination-controls" role="navigation" [attr.aria-label]="'pagination.navAria' | translate">
          <button
            type="button"
            class="page-btn"
            [disabled]="pageIndex <= 0"
            (click)="go(pageIndex - 1)"
            [attr.aria-label]="'pagination.prev' | translate"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <button
            *ngFor="let p of buttonPages"
            type="button"
            class="page-btn"
            [class.active]="p === pageIndex"
            (click)="go(p)"
          >
            {{ p + 1 }}
          </button>
          <button
            type="button"
            class="page-btn"
            [disabled]="pageIndex >= totalPages - 1"
            (click)="go(pageIndex + 1)"
            [attr.aria-label]="'pagination.next' | translate"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ErpPaginationComponent {
  @Input() totalElements = 0;
  /** 0-based page index */
  @Input() pageIndex = 0;
  @Input() pageSize = DEFAULT_ERP_PAGE_SIZE;
  @Input() showSizeChanger = true;
  @Input() maxPageButtons = 5;

  @Output() pageIndexChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  readonly sizeOptions = [...ERP_PAGE_SIZE_OPTIONS];

  get totalPages(): number {
    if (this.totalElements <= 0) return 0;
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }

  get displayFrom(): number {
    if (this.totalElements <= 0) return 0;
    return this.pageIndex * this.pageSize + 1;
  }

  get displayTo(): number {
    if (this.totalElements <= 0) return 0;
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }

  get buttonPages(): number[] {
    return pageButtonIndices(this.pageIndex, this.totalPages, this.maxPageButtons);
  }

  go(next: number): void {
    const clamped = Math.min(Math.max(0, next), Math.max(0, this.totalPages - 1));
    if (clamped !== this.pageIndex) {
      this.pageIndexChange.emit(clamped);
    }
  }

  onSizeChange(size: number): void {
    const n = Number(size);
    if (!Number.isFinite(n) || n < 1) return;
    this.pageSizeChange.emit(n);
  }
}
