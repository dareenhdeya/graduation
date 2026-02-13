import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

const DONT_RETRY = [
  '/Auth/sign-in',
  '/Auth/Sign-UP',
  '/Auth/Refresh-Token',
  '/Auth/Request-Password-change',
  '/Auth/Verify-OTP',
  '/Auth/reset-password',
  '/Auth/logout',
  '/Auth/view-profile',
];

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      const blocked = DONT_RETRY.some((p) => req.url.includes(p));
      if (blocked) return throwError(() => err);

      return auth.refreshAccessToken().pipe(switchMap(() => next(req)));
    })
  );
};
