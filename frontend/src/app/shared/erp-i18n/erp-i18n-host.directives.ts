import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/**
 * Sets {@code placeholder} from a static ngx-translate key (attribute value).
 * Prefer this over {@code [placeholder]="'key' | translate"} on search fields: some CD /
 * binding paths surface the raw key; this path always uses {@link TranslateService.instant}
 * and refreshes on language or bundle changes.
 */
@Directive({
  selector: 'input[erpI18nPh],textarea[erpI18nPh]',
  standalone: true,
})
export class ErpI18nPhDirective implements OnInit, OnChanges, OnDestroy {
  @Input({ alias: 'erpI18nPh' }) key = '';
  private readonly el = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private readonly translate = inject(TranslateService);
  private subs = new Subscription();

  ngOnInit(): void {
    const run = () => this.apply();
    run();
    this.subs.add(this.translate.onLangChange.subscribe(run));
    this.subs.add(this.translate.onTranslationChange.subscribe(run));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['key'] && !changes['key'].firstChange) {
      this.apply();
    }
  }

  private apply(): void {
    const k = (this.key || '').trim();
    const el = this.el.nativeElement;
    if (!k || !el) {
      return;
    }
    el.placeholder = this.translate.instant(k);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}

/**
 * Sets element {@code textContent} from a static ngx-translate key (for labels without inner markup).
 */
@Directive({
  selector: '[erpI18nText]',
  standalone: true,
})
export class ErpI18nTextDirective implements OnInit, OnChanges, OnDestroy {
  @Input({ alias: 'erpI18nText' }) key = '';
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly translate = inject(TranslateService);
  private subs = new Subscription();

  ngOnInit(): void {
    const run = () => this.apply();
    run();
    this.subs.add(this.translate.onLangChange.subscribe(run));
    this.subs.add(this.translate.onTranslationChange.subscribe(run));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['key'] && !changes['key'].firstChange) {
      this.apply();
    }
  }

  private apply(): void {
    const k = (this.key || '').trim();
    if (!k) {
      return;
    }
    this.el.nativeElement.textContent = this.translate.instant(k);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
