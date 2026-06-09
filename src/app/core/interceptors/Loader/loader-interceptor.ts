// import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { NgxSpinnerService } from 'ngx-spinner';
// import { finalize, catchError, throwError } from 'rxjs';

// let activeRequests = 0;

// export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
//   const loader = inject(NgxSpinnerService);

//   if (activeRequests === 0) {
//     loader.show();
//   }

//   activeRequests++;

//   return next(req).pipe(
//     catchError((error: HttpErrorResponse) => {
//       console.error('Request failed!', error);
//       return throwError(() => error);
//     }),
//     finalize(() => {
//       activeRequests--;

//       if (activeRequests === 0) {
//         setTimeout(() => {
//           if (activeRequests === 0) {
//             loader.hide();
//           }
//         }, 800);
//       }
//     })
//   );
// };

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize, catchError, throwError } from 'rxjs';

const SILENT_URLS = ['/predict'];

let activeRequests = 0;

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(NgxSpinnerService);

  const isSilent = SILENT_URLS.some((url) => req.url.includes(url));

  if (!isSilent) {
    if (activeRequests === 0) {
      loader.show();
    }
    activeRequests++;
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Request failed!', error);
      return throwError(() => error);
    }),
    finalize(() => {
      if (!isSilent) {
        activeRequests--;
        if (activeRequests === 0) {
          setTimeout(() => {
            if (activeRequests === 0) {
              loader.hide();
            }
          }, 800);
        }
      }
    })
  );
};
