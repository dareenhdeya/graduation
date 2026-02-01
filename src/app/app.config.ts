import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { errorsInterceptor } from './core/interceptors/errors/errors-interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh/auth-refresh-interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials/credentials-interceptor-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([credentialsInterceptor, authRefreshInterceptor, errorsInterceptor])
    ),
    // importProvidersFrom(CookieService),
  ],
};
