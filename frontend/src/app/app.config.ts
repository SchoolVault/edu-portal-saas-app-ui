import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { traceResponseInterceptor } from './core/interceptors/trace-response.interceptor';
import { loadPublicAppConfig } from './core/config/load-public-app-config.factory';
import { UserLocaleService } from './core/i18n/user-locale.service';

export function httpTranslateLoader(http: HttpClient, platformLocation: PlatformLocation): TranslateHttpLoader {
  const base = platformLocation.getBaseHrefFromDOM();
  const prefix = `${base.endsWith('/') ? base : base + '/'}assets/i18n/`;
  return new TranslateHttpLoader(http, prefix, '.json');
}

export function translateBootstrapFactory(translate: TranslateService, userLocale: UserLocaleService): () => Promise<void> {
  return () => userLocale.primeFromBootstrap(translate);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: loadPublicAppConfig
    },
    provideHttpClient(withInterceptors([jwtInterceptor, traceResponseInterceptor, httpErrorInterceptor])),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpTranslateLoader,
          deps: [HttpClient, PlatformLocation],
        },
        defaultLanguage: 'en',
      })
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: translateBootstrapFactory,
      deps: [TranslateService, UserLocaleService],
    },
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
  ]
};
