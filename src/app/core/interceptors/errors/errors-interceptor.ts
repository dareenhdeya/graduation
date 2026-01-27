import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const backend = err.error;

      const msg =
        (typeof backend === 'string' && backend) ||
        backend?.message ||
        backend?.errors?.[0]?.message ||
        err.message ||
        'Something went wrong';

      return throwError(() => ({ ...err, userMessage: msg }));
    })
  );
};
