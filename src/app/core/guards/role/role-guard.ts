import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

type Role = 'Admin' | 'Parent' | 'Teacher' | 'Student';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];

  // helper: check role snapshot
  const hasAccess = (role: Role | null) => !!role && allowed.includes(role);

  const currentRole = auth.getRoleSnapshot();
  if (currentRole) {
    return hasAccess(currentRole) ? true : router.createUrlTree(['/home']);
  }

  // لو role مش متخزّن لسه، هاتيه من profile
  return auth.getProfile().pipe(
    tap((res) => auth.setRole(res.data.role)),
    map((res) => (hasAccess(res.data.role) ? true : (router.createUrlTree(['/home']) as UrlTree))),
    catchError(() => of(router.createUrlTree(['/login']) as UrlTree))
  );
};
