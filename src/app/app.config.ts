import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideToastr } from 'ngx-toastr';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { errorsInterceptor } from './core/interceptors/errors/errors-interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh/auth-refresh-interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials/credentials-interceptor-interceptor';
// import { provideServerRendering, withRoutes } from '@angular/ssr';
// import { serverRoutes } from './app.routes.server';
import { NgxSpinnerModule } from 'ngx-spinner';
import { loaderInterceptor } from './core/interceptors/Loader/loader-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(NgxSpinnerModule),
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideToastr(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // provideServerRendering(withRoutes(serverRoutes)),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([credentialsInterceptor, authRefreshInterceptor, errorsInterceptor, loaderInterceptor])
    ),
  ],
};
