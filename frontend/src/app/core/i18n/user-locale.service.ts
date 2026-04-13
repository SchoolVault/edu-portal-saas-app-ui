import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, tap } from 'rxjs';

export type UiLanguage = 'en' | 'hi';

const STORAGE_KEY = 'erp_interface_locale';

@Injectable({ providedIn: 'root' })
export class UserLocaleService {
  private readonly translate = inject(TranslateService);

  /** BCP-style tags we ship JSON for; extend when adding `assets/i18n/*.json`. */
  readonly supported: { code: UiLanguage; nativeLabel: string }[] = [
    { code: 'en', nativeLabel: 'English' },
    { code: 'hi', nativeLabel: 'हिन्दी' },
  ];

  /** Bound by settings / login preview (kept in sync with ngx-translate). */
  readonly currentLang = signal<UiLanguage>(this.readStored());

  readStored(): UiLanguage {
    if (typeof localStorage === 'undefined') {
      return 'en';
    }
    return localStorage.getItem(STORAGE_KEY) === 'hi' ? 'hi' : 'en';
  }

  /** Applies ngx-translate bundle + persists browser key; call AuthService to persist to API when signed in. */
  useUiLanguage(lang: UiLanguage): Observable<unknown> {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    this.currentLang.set(lang);
    return this.translate.use(lang).pipe(tap(() => this.currentLang.set(lang)));
  }

  normalizeTag(raw: string | null | undefined): UiLanguage {
    if (raw === 'hi') {
      return 'hi';
    }
    return 'en';
  }

  /** Called from {@code APP_INITIALIZER} so the first paint matches stored language. */
  primeFromBootstrap(translate: TranslateService): Promise<void> {
    translate.setDefaultLang('en');
    const lang = this.readStored();
    this.currentLang.set(lang);
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    return firstValueFrom(translate.use(lang)).then(() => undefined);
  }
}
