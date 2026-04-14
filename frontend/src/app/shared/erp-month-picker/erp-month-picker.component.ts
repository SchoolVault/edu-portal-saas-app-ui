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
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect/index.js';

/**
 * Theme-aligned month picker (Flatpickr monthSelect). Value: `YYYY-MM` or empty.
 * Matches {@link ErpDatePickerComponent} field styling and global Flatpickr tokens.
 */
@Component({
  selector: 'app-erp-month-picker',
  standalone: true,
  template: `
    <input
      #host
      type="text"
      class="erp-input erp-month-picker__native flatpickr-input"
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
      useExisting: forwardRef(() => ErpMonthPickerComponent),
      multi: true,
    },
  ],
})
export class ErpMonthPickerComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy, OnInit, OnChanges
{
  @Input() inputId = '';
  @Input() nameAttr = '';
  @Input() dataTestId = '';
  @Input() placeholder = '';
  /** When set, resolved with TranslateService and kept in sync on lang / bundle changes. */
  @Input() placeholderI18nKey = '';
  /** Inclusive max month `YYYY-MM` (e.g. current month). */
  @Input() maxYm: string | undefined;
  /** Inclusive min month `YYYY-MM` (optional). */
  @Input() minYm: string | undefined;

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLInputElement>;

  displayPlaceholder = '';

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
      allowInput: false,
      clickOpens: !this.isDisabled,
      disableMobile: true,
      enableTime: false,
      /** Static month label path; monthSelect plugin removes the label—year row stays predictable. */
      monthSelectorType: 'static',
      defaultDate: this.parseYmToDate(this.value) ?? undefined,
      minDate:
        this.minYm && /^\d{4}-\d{2}$/.test(this.minYm) ? this.startOfMonthDate(this.minYm) : undefined,
      maxDate: this.endOfMonthDate(this.maxYm),
      plugins: [
        monthSelectPlugin({
          shorthand: true,
          dateFormat: 'Y-m',
          altFormat: 'M Y',
          theme: 'light',
        }),
      ],
      altInput: true,
      altInputClass: 'erp-input erp-month-picker__visible',
      onChange: (_dates, dateStr) => {
        this.value = dateStr ?? '';
        this.onChange(this.value);
      },
      onOpen: () => this.onTouched(),
      onReady: (_d, _s, inst) => {
        inst.calendarContainer?.classList.add('erp-flatpickr-month');
        this.attachFooter(inst);
      },
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
      const d = this.parseYmToDate(this.value);
      if (d) {
        this.fp.setDate(d, false);
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
    if (!this.fp) {
      return;
    }
    this.fp.set('clickOpens', !isDisabled);
    const main = this.fp.input;
    if (main) {
      if (isDisabled) {
        main.setAttribute('disabled', 'disabled');
      } else {
        main.removeAttribute('disabled');
      }
    }
    const alt = this.fp.altInput;
    if (alt) {
      alt.toggleAttribute('disabled', isDisabled);
      alt.classList.toggle('erp-month-picker--disabled', isDisabled);
    }
  }

  private refreshDisplayPlaceholder(): void {
    const k = (this.placeholderI18nKey || '').trim();
    this.displayPlaceholder = k ? this.translate.instant(k) : this.placeholder;
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

  private parseYmToDate(ym: string): Date | null {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      return null;
    }
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }

  /** First instant of calendar month (human month 1–12). */
  private startOfMonthDate(ym: string | undefined): Date | undefined {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      return undefined;
    }
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }

  /** Last calendar day of month for Flatpickr `maxDate` (human month in `ym`). */
  private endOfMonthDate(ym: string | undefined): Date | undefined {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      return undefined;
    }
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0);
  }

  private attachFooter(inst: FlatpickrInstance): void {
    const cal = inst.calendarContainer;
    if (!cal || cal.querySelector('.erp-fp-footer')) {
      return;
    }
    const foot = document.createElement('div');
    foot.className = 'erp-fp-footer erp-fp-footer--month';
    foot.innerHTML =
      '<button type="button" class="erp-fp-footer__btn" data-act="clear">Clear</button>' +
      '<button type="button" class="erp-fp-footer__btn erp-fp-footer__btn--primary" data-act="this-month">This month</button>';
    foot.addEventListener('click', ev => {
      const t = ev.target as HTMLElement;
      const act = t.closest('[data-act]')?.getAttribute('data-act');
      if (act === 'clear') {
        inst.clear();
        this.value = '';
        this.onChange('');
        inst.close();
      }
      if (act === 'this-month') {
        const now = new Date();
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        inst.setDate(d, true);
        inst.close();
      }
    });
    cal.appendChild(foot);
  }
}
