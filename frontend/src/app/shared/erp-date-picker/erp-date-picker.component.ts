import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import type { Options as FlatpickrOptions } from 'flatpickr/dist/types/options';

/**
 * Theme-aware date field + calendar (Flatpickr). Value: ISO `YYYY-MM-DD` or empty string.
 * Replace native `<input type="date">` for consistent light/dark UI.
 *
 * Use {@link placeholderI18nKey} instead of `[placeholder]="'key' | translate"` so placeholders
 * resolve reliably and refresh on language change (including Flatpickr alt input).
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
      [placeholder]="displayPlaceholder"
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
export class ErpDatePickerComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy, OnInit, OnChanges
{
  @Input() inputId = '';
  @Input() nameAttr = '';
  @Input() dataTestId = '';
  @Input() placeholder = 'Select date';
  /** When set, resolved with TranslateService and kept in sync on lang / bundle changes. */
  @Input() placeholderI18nKey = '';
  @Input() minDate: string | Date | undefined;
  @Input() maxDate: string | Date | undefined;

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLInputElement>;

  displayPlaceholder = 'Select date';

  isDisabled = false;
  private fp: FlatpickrInstance | null = null;
  private value = '';
  private onChange: (v: string) => void = () => void 0;
  private onTouched: () => void = () => void 0;

  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langSubs = new Subscription();

  ngOnInit(): void {
    this.refreshDisplayPlaceholder();
    this.langSubs.add(this.translate.onLangChange.subscribe(() => this.refreshDisplayPlaceholder()));
    this.langSubs.add(this.translate.onTranslationChange.subscribe(() => this.refreshDisplayPlaceholder()));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['placeholder'] || changes['placeholderI18nKey']) {
      this.refreshDisplayPlaceholder();
    }
  }

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
    this.syncFlatpickrPlaceholders();
  }

  ngOnDestroy(): void {
    this.langSubs.unsubscribe();
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

  private refreshDisplayPlaceholder(): void {
    const k = (this.placeholderI18nKey || '').trim();
    this.displayPlaceholder = k ? this.translate.instant(k) : this.placeholder || 'Select date';
    this.cdr.markForCheck();
    this.syncFlatpickrPlaceholders();
  }

  private syncFlatpickrPlaceholders(): void {
    if (!this.fp) return;
    const ph = this.displayPlaceholder;
    const main = this.fp.input;
    if (main) main.setAttribute('placeholder', ph);
    const alt = this.fp.altInput;
    if (alt) alt.setAttribute('placeholder', ph);
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
