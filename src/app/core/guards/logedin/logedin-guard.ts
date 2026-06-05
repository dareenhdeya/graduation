import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { CookieService } from 'ngx-cookie-service';

export const logedinGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const cookieService = inject(CookieService);

  // If there's no refresh token cookie at all, don't even try to hit the backend
  // because it will 401, trigger the refresh interceptor, fail, redirect here, and infinite loop.
  const hasToken = cookieService.check('refreshToken');
  if (!hasToken) {
    return of(true);
  }

  return auth.getProfile().pipe(
    map((res) => {
      const role = res.data.role;

      auth.setRole(role);

      switch (role) {
        case 'Admin':
          return router.createUrlTree(['/admin/dashboard']);

        case 'Teacher':
          return router.createUrlTree(['/teacher/dashboard']);

        case 'Student':
          return router.createUrlTree(['/student/dashboard']);

        case 'Parent':
          return router.createUrlTree(['/parent/dashboard']);

        default:
          return router.createUrlTree(['/home']);
      }
    }),
    catchError(() => of(true))
  );
};
