import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export const logedinGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getProfile().pipe(
    map(() => router.createUrlTree(['/home']) as UrlTree),
    catchError(() => of(true)) // لو مش logged in سيبيه يدخل login/register
  );
};
