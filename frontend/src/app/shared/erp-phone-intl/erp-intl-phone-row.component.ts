import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { digitsOnlyIndiaMobile, displayIndiaMobileTenFromApi } from '../../core/validation/phone.validation';

/**
 * Single-field India mobile (10 digits). Emits national digits only — no country code in the model.
 * Optional legacy {@code +91-…} in {@link phone10} input is shown as 10 digits.
 */
@Component({
  selector: 'erp-intl-phone-row',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="erp-india-mobile" [class.erp-india-mobile--disabled]="disabled">
      <div class="erp-india-mobile__field">
        <label class="erp-label" [attr.for]="idPrefix + '-mob'">{{ 'phoneIntl.mobileNumber' | translate }}</label>
        <input
          [id]="idPrefix + '-mob'"
          type="tel"
          class="erp-input"
          [name]="namePrefix + 'Mobile'"
          [(ngModel)]="nationalDigits"
          (ngModelChange)="onDigitsChange($event)"
          [disabled]="disabled"
          inputmode="numeric"
          autocomplete="tel-national"
          maxlength="10"
          [attr.placeholder]="'phoneIntl.mobilePlaceholder' | translate"
          [attr.data-testid]="testIdPrefix + '-national'"
        />
      </div>
      <p class="text-muted small mb-0 mt-1">{{ 'auth.phoneIndiaTenDigitHint' | translate }}</p>
    </div>
  `,
  styles: [
    `
      .erp-india-mobile__field {
        max-width: 320px;
      }
      .erp-india-mobile--disabled {
        opacity: 0.65;
        pointer-events: none;
      }
    `
  ]
})
export class ErpIntlPhoneRowComponent {
  @Input() idPrefix = 'in-phone';
  @Input() namePrefix = 'inPhone';
  @Input() testIdPrefix = 'in-phone';
  @Input() disabled = false;

  /** 10-digit national, or legacy {@code +91-…} from API — normalized for display. */
  @Input()
  set phone10(v: string | null | undefined) {
    const shown = displayIndiaMobileTenFromApi(v ?? '');
    if (shown === this.nationalDigits) {
      return;
    }
    this.nationalDigits = shown;
    this.lastEmitted = shown.length === 10 ? shown : '';
  }

  @Output() phone10Change = new EventEmitter<string>();

  nationalDigits = '';
  private lastEmitted = '';

  onDigitsChange(raw: string): void {
    const d = digitsOnlyIndiaMobile(raw);
    this.nationalDigits = d;
    const next = d.length === 10 ? d : '';
    if (next === this.lastEmitted) {
      return;
    }
    this.lastEmitted = next;
    this.phone10Change.emit(next);
  }
}
