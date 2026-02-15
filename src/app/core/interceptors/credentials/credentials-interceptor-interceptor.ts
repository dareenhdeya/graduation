import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.startsWith(environment.apiUrl);
  if (!isApi) return next(req);

  return next(req.clone({ withCredentials: true }));
};
