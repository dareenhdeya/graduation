import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Params } from '@angular/router';

export abstract class baseHttp {
  protected readonly http = inject(HttpClient);

  protected post<T>(url: string, data: {}, headers?: {}) {
    return this.http.post<T>(url, data, { headers: headers });
  }
  protected get<T>(url: string, filters?: Params, headers?: {}) {
    return this.http.get<T>(url, {
      params: filters,
      headers: headers,
    });
  }
  protected delete<T>(url: string, headers?: {}) {
    return this.http.delete<T>(url, { headers: headers });
  }
  protected put<T>(url: string, data?: {}, headers?: {}) {
    return this.http.put<T>(url, data, { headers: headers });
  }
}
