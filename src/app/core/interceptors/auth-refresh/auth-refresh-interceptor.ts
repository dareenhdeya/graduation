import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

const DONT_RETRY = [
  '/Auth/sign-in',
  '/Auth/Sign-UP',
  '/Auth/Refresh-Token',
  '/Auth/Request-Password-change',
  '/Auth/Verify-OTP',
  '/Auth/reset-password',
  '/Auth/logout',
];

// State variables to handle concurrent refresh requests
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

export const authRefreshInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 1. Pass through if not a 401
      if (err.status !== 401) return throwError(() => err);

      // 2. Pass through if URL is blocklisted (e.g. login/refresh itself)
      const blocked = DONT_RETRY.some((p) => req.url.includes(p));
      if (blocked) return throwError(() => err);

      // 3. Handle 401 with Token Refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(false); // Reset the subject

        return auth.refreshAccessToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshTokenSubject.next(true); // Signal other queued requests to retry
            return next(req); // Retry the original failed request
          }),
          catchError((refreshErr: HttpErrorResponse) => {
            isRefreshing = false;
            // If the refresh token itself expired/failed, log out
            if (refreshErr.status === 401) {
              auth.redirectLogin();
            }
            return throwError(() => refreshErr);
          })
        );
      } else {
        // 4. If token is currently refreshing, queue this request
        return refreshTokenSubject.pipe(
          filter((inProgress) => inProgress === true),
          take(1),
          switchMap(() => next(req)) // Retry once refresh is complete
        );
      }
    })
  );
};
