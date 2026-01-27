// import { HttpClient } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { Params } from '@angular/router';

// export abstract class baseHttp {
//   protected readonly http = inject(HttpClient);

//   protected get<T>(url: string, filters?: Params, headers?: {}) {
//     return this.http.get<T>(url, {
//       params: filters,
//       headers: headers,
//     });
//   }

//   protected post<T>(url: string, data: {}, headers?: {}) {
//     return this.http.post<T>(url, data, { headers: headers });
//   }

//   protected put<T>(url: string, data?: {}, headers?: {}) {
//     return this.http.put<T>(url, data, { headers: headers });
//   }

//   protected patch<T>(url: string, data?: {}, headers?: {}) {
//     return this.http.patch<T>(url, data, { headers: headers });
//   }

//   protected delete<T>(url: string, headers?: {}) {
//     return this.http.delete<T>(url, { headers: headers });
//   }
// }


import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Params } from '@angular/router';

export abstract class baseHttp {
  protected readonly http = inject(HttpClient);

  private normalizeOptions(headersOrOptions?: any, filters?: Params) {
    const looksLikeOptions =
      headersOrOptions &&
      typeof headersOrOptions === 'object' &&
      ('headers' in headersOrOptions ||
        'responseType' in headersOrOptions ||
        'withCredentials' in headersOrOptions ||
        'observe' in headersOrOptions ||
        'params' in headersOrOptions);

    if (looksLikeOptions) {
      return {
        ...(filters ? { params: filters } : {}),
        ...headersOrOptions,
      };
    }

    return {
      ...(filters ? { params: filters } : {}),
      ...(headersOrOptions ? { headers: headersOrOptions } : {}),
    };
  }

  protected get<T>(url: string, filters?: Params, headersOrOptions?: {}) {
    return this.http.get<T>(url, this.normalizeOptions(headersOrOptions, filters));
  }

  protected put<T>(url: string, data?: {}, headersOrOptions?: {}) {
    return this.http.put<T>(url, data, this.normalizeOptions(headersOrOptions));
  }

  protected post<T>(url: string, data: {}, headersOrOptions?: {}) {
    return this.http.post<T>(url, data, this.normalizeOptions(headersOrOptions));
  }

  protected patch<T>(url: string, data?: {}, headersOrOptions?: {}) {
    return this.http.patch<T>(url, data, this.normalizeOptions(headersOrOptions));
  }

  protected delete<T>(url: string, headersOrOptions?: {}) {
    return this.http.delete<T>(url, this.normalizeOptions(headersOrOptions));
  }
}
