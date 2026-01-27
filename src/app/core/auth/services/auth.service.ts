import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { baseHttp } from '../../services/base';
import { APP_APIs } from '../../constants/appAPIs';
import { ILoginResponse } from '../interfaces/ILoginResponse';
import { IRegisterResponse } from '../interfaces/IRegisterResponse';

export interface IVerifyOtpBody {
  emailOrUserName: string;
  otp: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService extends baseHttp {
  private readonly router = inject(Router);

  signUp(userData: any) {
    return this.post<IRegisterResponse>(APP_APIs.register, userData);
  }

  login(userData: any) {
    return this.post<string>(APP_APIs.login, userData, {
      responseType: 'text' as const,
    });
  }

  requestPasswordChange(emailOrUserName: string) {
    const value = emailOrUserName.trim();
    const safe = encodeURIComponent(value);

    return this.post<any>(
      `${APP_APIs.forgotPassword}/${safe}`,
      {},
      {
        // headers اللي عندك
        headers: {
          EmailorUserName: value,
          Email: value,
        },
      }
    );
  }

  // ✅ هنا أهم تعديل: responseType text
  verifyOtp(body: IVerifyOtpBody) {
    return this.post<string>(APP_APIs.verifyOtp, body, {
      responseType: 'text' as const,
    });
  }

  resetPassword(newPassword: string) {
    return this.patch<any>(APP_APIs.resetPassword, { newPassword });
  }

  changePassword(payload: { oldPassword: string; newPassword: string }) {
    return this.patch<any>(APP_APIs.changePassword, payload);
  }

  refreshAccessToken() {
    return this.post<any>(APP_APIs.refreshToken, {});
  }

  logout() {
    // مفيش body — لازم تبعتي cookies
    return this.post<any>(
      APP_APIs.logout,
      {} // body فاضي
    );
  }

  logoutAndRedirect() {
    this.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        // حتى لو فشل logout (مثلاً cookies expired) رجّعيه login برضه
        this.router.navigateByUrl('/login');
      },
    });
  }
}
