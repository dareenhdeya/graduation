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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Params } from '@angular/router';

type JsonOptions = {
  headers?: HttpHeaders | Record<string, string | string[]>;
};

type TextOptions = {
  headers?: HttpHeaders | Record<string, string | string[]>;
};

export abstract class baseHttp {
  protected readonly http = inject(HttpClient);

  protected get<T>(url: string, filters?: Params, options?: JsonOptions) {
    return this.http.get<T>(url, {
      ...(options ?? {}),
      params: filters,
      observe: 'body',
      responseType: 'json',
    });
  }

  protected post<T>(url: string, data: {}, options?: JsonOptions) {
    return this.http.post<T>(url, data, {
      ...(options ?? {}),
      observe: 'body',
      responseType: 'json',
    });
  }

  protected put<T>(url: string, data?: {}, options?: JsonOptions) {
    return this.http.put<T>(url, data, {
      ...(options ?? {}),
      observe: 'body',
      responseType: 'json',
    });
  }

  protected patch<T>(url: string, data?: {}, options?: JsonOptions) {
    return this.http.patch<T>(url, data, {
      ...(options ?? {}),
      observe: 'body',
      responseType: 'json',
    });
  }

  protected delete<T>(url: string, options?: JsonOptions) {
    return this.http.delete<T>(url, {
      ...(options ?? {}),
      observe: 'body',
      responseType: 'json',
    });
  }

  protected deleteWithBody<T>(url: string, body: {}, options?: JsonOptions) {
    return this.http.delete<T>(url, {
      ...(options ?? {}),
      body: body,
      observe: 'body',
      responseType: 'json',
    });
  }

  protected postText(url: string, data: {}, options?: TextOptions) {
    return this.http.post(url, data, { ...(options ?? {}), observe: 'body', responseType: 'text' });
  }
}
