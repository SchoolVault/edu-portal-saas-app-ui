import {
  AfterViewInit,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import type { Options as FlatpickrOptions } from 'flatpickr/dist/types/options';

/**
 * Theme-aware date field + calendar (Flatpickr). Value: ISO `YYYY-MM-DD` or empty string.
 * Replace native `<input type="date">` for consistent light/dark UI.
 */
@Component({
  selector: 'app-erp-date-picker',
  standalone: true,
  template: `
    <input
      #host
      type="text"
      class="erp-input erp-date-picker__native flatpickr-input"
      [attr.id]="inputId || null"
      [attr.name]="nameAttr || null"
      [attr.data-testid]="dataTestId || null"
      [placeholder]="placeholder"
      [disabled]="isDisabled"
      readonly
      autocomplete="off"
      spellcheck="false"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ErpDatePickerComponent),
      multi: true,
    },
  ],
})
export class ErpDatePickerComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() inputId = '';
  @Input() nameAttr = '';
  @Input() dataTestId = '';
  @Input() placeholder = 'Select date';
  @Input() minDate: string | Date | undefined;
  @Input() maxDate: string | Date | undefined;

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLInputElement>;

  isDisabled = false;
  private fp: FlatpickrInstance | null = null;
  private value = '';
  private onChange: (v: string) => void = () => void 0;
  private onTouched: () => void = () => void 0;

  ngAfterViewInit(): void {
    const el = this.hostRef.nativeElement;
    const opts: Partial<FlatpickrOptions> = {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      altInputClass: 'erp-input erp-date-picker__visible',
      allowInput: false,
      clickOpens: !this.isDisabled,
      disableMobile: true,
      monthSelectorType: 'static',
      defaultDate: this.value || undefined,
      minDate: this.minDate,
      maxDate: this.maxDate,
      onChange: (_dates, dateStr) => {
        this.value = dateStr;
        this.onChange(dateStr);
      },
      onOpen: () => this.onTouched(),
      onReady: (_d, _s, inst) => this.attachFooter(inst),
    };
    this.fp = flatpickr(el, opts);
  }

  ngOnDestroy(): void {
    this.fp?.destroy();
    this.fp = null;
  }

  writeValue(obj: string | null): void {
    this.value = obj ?? '';
    if (this.fp) {
      if (this.value) {
        this.fp.setDate(this.value, false);
      } else {
        this.fp.clear();
      }
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (!this.fp) return;
    this.fp.set('clickOpens', !isDisabled);
    const main = this.fp.input;
    if (main) {
      if (isDisabled) main.setAttribute('disabled', 'disabled');
      else main.removeAttribute('disabled');
    }
    const alt = this.fp.altInput;
    if (alt) {
      alt.toggleAttribute('disabled', isDisabled);
      alt.classList.toggle('erp-date-picker--disabled', isDisabled);
    }
  }

  private attachFooter(inst: FlatpickrInstance): void {
    const cal = inst.calendarContainer;
    if (!cal || cal.querySelector('.erp-fp-footer')) return;
    const foot = document.createElement('div');
    foot.className = 'erp-fp-footer';
    foot.innerHTML =
      '<button type="button" class="erp-fp-footer__btn" data-act="clear">Clear</button>' +
      '<button type="button" class="erp-fp-footer__btn erp-fp-footer__btn--primary" data-act="today">Today</button>';
    foot.addEventListener('click', ev => {
      const t = ev.target as HTMLElement;
      const act = t.closest('[data-act]')?.getAttribute('data-act');
      if (act === 'clear') {
        inst.clear();
        this.value = '';
        this.onChange('');
        inst.close();
      }
      if (act === 'today') {
        inst.setDate(new Date(), true);
        inst.close();
      }
    });
    cal.appendChild(foot);
  }
}
