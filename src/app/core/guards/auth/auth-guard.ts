import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getProfile().pipe(
    tap((res) => {
      auth.setRole(res.data.role);
    }),
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login']) as UrlTree))
  );
};
