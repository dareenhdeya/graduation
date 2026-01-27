// import { Injectable, inject } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { STORED_KEYS } from '../../constants/storedKeys';

// @Injectable({ providedIn: 'root' })
// export class TokenStorageService {
//   private cookie = inject(CookieService);

//   setAccessToken(token: string) {
//     this.cookie.set(STORED_KEYS.token, token);
//   }
//   getAccessToken(): string {
//     return this.cookie.get(STORED_KEYS.token);
//   }
//   hasAccessToken(): boolean {
//     return this.cookie.check(STORED_KEYS.token);
//   }

//   setRefreshToken(token: string) {
//     this.cookie.set(STORED_KEYS.refreshToken, token);
//   }
//   getRefreshToken(): string {
//     return this.cookie.get(STORED_KEYS.refreshToken);
//   }
//   hasRefreshToken(): boolean {
//     return this.cookie.check(STORED_KEYS.refreshToken);
//   }

//   clear() {
//     this.cookie.delete(STORED_KEYS.token);
//     this.cookie.delete(STORED_KEYS.refreshToken);
//     this.cookie.delete(STORED_KEYS.userId);
//   }

//   /** لو التوكن جاي "Bearer xxx" نخليه جاهز */
//   toBearer(token: string) {
//     if (!token) return '';
//     return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
//   }
// }
