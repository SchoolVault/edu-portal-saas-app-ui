import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { DEFAULT_INBOX_FILTER_STATE, InboxFeedKindFilter, InboxFilterState } from '../../core/models/inbox-filter.model';
import {
  allowedInboxAudiencePresetValues,
  inboxAudiencePresetOptionsForRole,
  sanitizeInboxAudienceTokens,
} from '../../core/utils/inbox-audience-visibility';
import { ErpMonthPickerComponent } from '../../shared/erp-month-picker/erp-month-picker.component';

/** Compact toolbar filters (same interaction model as student list selects). */
@Component({
  selector: 'app-inbox-filters-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpMonthPickerComponent],
  template: `
    <div class="inbox-toolbar-filters d-flex flex-wrap align-items-end gap-2">
      <select
        class="erp-select inbox-toolbar-select"
        [(ngModel)]="draft.feedKind"
        (ngModelChange)="onFeedKindChange($event)"
        [attr.aria-label]="'inbox.filters.toolbarType' | translate">
        <option value="ALL">{{ 'inbox.filters.typeAll' | translate }}</option>
        <option value="ANNOUNCEMENT">{{ 'inbox.filters.typeNotices' | translate }}</option>
        <option value="NOTIFICATION">{{ 'inbox.filters.typeAlerts' | translate }}</option>
      </select>
      <div class="inbox-toolbar-month-wrap">
        <app-erp-month-picker
          class="inbox-toolbar-month-picker"
          dataTestId="inbox-filter-month"
          placeholderI18nKey="inbox.filters.monthAny"
          yearNavMode="plain"
          [(ngModel)]="draft.yearMonth"
          (ngModelChange)="emitDraft()"
          [maxYm]="maxYmInbox"
          [minYm]="minYmInbox"
          [attr.aria-label]="'inbox.filters.toolbarMonth' | translate"
        />
      </div>
      <select
        class="erp-select inbox-toolbar-select inbox-toolbar-select--aud"
        [(ngModel)]="audiencePreset"
        [disabled]="draft.feedKind === 'NOTIFICATION'"
        (ngModelChange)="emitDraft()"
        [attr.aria-label]="'inbox.filters.toolbarAudience' | translate">
        <option *ngFor="let o of audiencePresetOptions" [value]="o.value">{{ o.labelKey | translate }}</option>
      </select>
      <button
        *ngIf="hasNonDefault"
        type="button"
        class="btn-outline-erp inbox-toolbar-clear"
        (click)="emitClear()">
        {{ 'inbox.filters.clearShort' | translate }}
      </button>
    </div>
  `,
  styles: [
    `
      .inbox-toolbar-filters {
        flex: 1 1 auto;
        justify-content: flex-end;
        min-width: 0;
      }
      .inbox-toolbar-select {
        width: 122px;
        min-height: 40px;
      }
      .inbox-toolbar-month-wrap {
        width: min(176px, 44vw);
        min-width: 152px;
        flex: 0 0 auto;
      }
      .inbox-toolbar-month-picker {
        width: 100%;
      }
      .inbox-toolbar-select--aud {
        width: min(200px, 48vw);
        min-width: 148px;
      }
      .inbox-toolbar-clear {
        white-space: nowrap;
        padding: 10px 18px;
        min-height: 42px;
        font-size: 14px;
        font-weight: 600;
        align-self: flex-end;
      }
    `,
  ],
})
export class InboxFiltersPanelComponent implements OnInit {
  private readonly auth = inject(AuthService);

  @Output() apply = new EventEmitter<InboxFilterState>();
  @Output() clear = new EventEmitter<void>();

  draft: InboxFilterState = { ...DEFAULT_INBOX_FILTER_STATE, audienceTokens: [] };
  /** Single-select mapping to {@link InboxFilterState#audienceTokens}. */
  audiencePreset = '';

  /** Inclusive upper bound (current calendar month). */
  get maxYmInbox(): string {
    return InboxFiltersPanelComponent.toYm(new Date());
  }

  /** Allow same rolling window as the previous long dropdown (36 months). */
  get minYmInbox(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 35);
    return InboxFiltersPanelComponent.toYm(d);
  }

  get hasNonDefault(): boolean {
    return (
      this.draft.feedKind !== 'ALL' || !!this.draft.yearMonth?.trim() || !!this.audiencePreset.trim()
    );
  }

  get audiencePresetOptions(): { value: string; labelKey: string }[] {
    return inboxAudiencePresetOptionsForRole(this.auth.getNormalizedRole());
  }

  ngOnInit(): void {
    const allowed = allowedInboxAudiencePresetValues(this.auth.getNormalizedRole());
    if (this.audiencePreset && !allowed.has(this.audiencePreset)) {
      this.audiencePreset = '';
    }
  }

  private static toYm(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  onFeedKindChange(kind: InboxFeedKindFilter | string): void {
    if (kind === 'NOTIFICATION') {
      this.audiencePreset = '';
    }
    this.emitDraft();
  }

  emitDraft(): void {
    const role = this.auth.getNormalizedRole();
    const raw = this.tokensFromAudiencePreset(this.audiencePreset);
    const tokens = sanitizeInboxAudienceTokens(role, raw);
    this.apply.emit({
      feedKind: this.draft.feedKind,
      audienceTokens: tokens,
      yearMonth: (this.draft.yearMonth || '').trim(),
    });
  }

  emitClear(): void {
    this.draft = { ...DEFAULT_INBOX_FILTER_STATE, audienceTokens: [] };
    this.audiencePreset = '';
    this.clear.emit();
  }

  private tokensFromAudiencePreset(preset: string): string[] {
    if (this.draft.feedKind === 'NOTIFICATION') {
      return [];
    }
    const t = (preset || '').trim();
    if (!t) {
      return [];
    }
    if (t.includes(',')) {
      return t.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    return [t.toUpperCase()];
  }
}
