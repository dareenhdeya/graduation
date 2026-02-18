import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export const logedinGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // return auth.getProfile().pipe(
  //   map(() => router.createUrlTree(['/home']) as UrlTree),
  //   catchError(() => of(true))
  // );
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
