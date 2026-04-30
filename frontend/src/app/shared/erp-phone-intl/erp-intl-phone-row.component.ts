import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { buildCanonicalIntlPhone, splitCanonicalIntlPhone } from '../../core/validation/phone.validation';

export interface ErpCountryDialOption {
  dial: string;
  labelKey: string;
}

@Component({
  selector: 'erp-intl-phone-row',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="erp-intl-phone-row" [class.erp-intl-phone-row--disabled]="disabled">
      <div class="erp-intl-phone-row__field">
        <label class="erp-label" [attr.for]="idPrefix + '-cc'">{{ 'phoneIntl.countryCode' | translate }}</label>
        <select
          class="erp-select"
          [id]="idPrefix + '-cc'"
          [name]="namePrefix + 'Dial'"
          [(ngModel)]="dialCode"
          (ngModelChange)="onChange()"
          [disabled]="disabled"
          [attr.data-testid]="testIdPrefix + '-dial'"
        >
          <option *ngFor="let o of countryOptions" [value]="o.dial">{{ o.labelKey | translate }}</option>
        </select>
      </div>
      <div class="erp-intl-phone-row__field erp-intl-phone-row__field--grow">
        <label class="erp-label" [attr.for]="idPrefix + '-nat'">{{ 'phoneIntl.mobileNumber' | translate }}</label>
        <input
          [id]="idPrefix + '-nat'"
          type="tel"
          class="erp-input"
          [name]="namePrefix + 'National'"
          [(ngModel)]="nationalDigits"
          (ngModelChange)="onChange()"
          [disabled]="disabled"
          inputmode="numeric"
          autocomplete="tel-national"
          maxlength="10"
          [attr.placeholder]="'phoneIntl.mobilePlaceholder' | translate"
          [attr.data-testid]="testIdPrefix + '-national'"
        />
      </div>
    </div>
    <p class="erp-intl-phone-row__preview text-muted small mb-0 mt-1" *ngIf="preview">
      {{ 'phoneIntl.willSendAs' | translate }} <strong>{{ preview }}</strong>
    </p>
  `,
  styles: [
    `
      .erp-intl-phone-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: flex-end;
      }
      .erp-intl-phone-row--disabled {
        opacity: 0.65;
        pointer-events: none;
      }
      .erp-intl-phone-row__field {
        flex: 0 0 auto;
        min-width: 120px;
      }
      .erp-intl-phone-row__field--grow {
        flex: 1 1 180px;
        min-width: 0;
      }
      .erp-intl-phone-row__preview strong {
        font-weight: 700;
        color: var(--clr-text-secondary);
        letter-spacing: 0.02em;
      }
    `
  ]
})
export class ErpIntlPhoneRowComponent {
  /** Stable ids for a11y when multiple rows exist on a page */
  @Input() idPrefix = 'intl-phone';
  @Input() namePrefix = 'intlPhone';
  @Input() testIdPrefix = 'intl-phone';
  @Input() disabled = false;
  /** Canonical {@code +CC-nnn} from parent */
  @Input()
  set canonicalPhone(v: string | null | undefined) {
    const next = (v ?? '').trim();
    if (next === this.lastEmitted) {
      return;
    }
    const split = splitCanonicalIntlPhone(next);
    this.dialCode = split.dial || '91';
    this.nationalDigits = split.national;
    this.refreshPreview();
  }

  @Output() canonicalPhoneChange = new EventEmitter<string>();

  readonly countryOptions: ErpCountryDialOption[] = [
    { dial: '91', labelKey: 'phoneIntl.country.in' },
    { dial: '1', labelKey: 'phoneIntl.country.us' }
  ];

  dialCode = '91';
  nationalDigits = '';
  preview = '';
  private lastEmitted = '';

  onChange(): void {
    const canonical = buildCanonicalIntlPhone(this.dialCode, this.nationalDigits);
    this.refreshPreview();
    this.lastEmitted = canonical;
    this.canonicalPhoneChange.emit(canonical);
  }

  private refreshPreview(): void {
    const c = buildCanonicalIntlPhone(this.dialCode, this.nationalDigits);
    this.preview = c || '';
  }
}
