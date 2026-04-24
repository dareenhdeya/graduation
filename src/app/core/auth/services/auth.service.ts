import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { baseHttp } from '../../services/base';
import { APP_APIs } from '../../constants/appAPIs';
import { ILoginResponse } from '../interfaces/ILoginResponse';
import { IRegisterResponse } from '../interfaces/IRegisterResponse';
import { ProfileData, ViewProfileResponse } from '../interfaces/IProfileResponse';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, map, tap } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

export interface IVerifyOtpBody {
  emailOrUserName: string;
  otp: string;
}

type Role = 'Admin' | 'Parent' | 'Teacher' | 'Student';

@Injectable({ providedIn: 'root' })
export class AuthService extends baseHttp {
  private readonly router = inject(Router);

  private roleSubject = new BehaviorSubject<Role | null>(null);
  role$ = this.roleSubject.asObservable();

  private profileSubject = new BehaviorSubject<ProfileData | null>(null);
  profile$ = this.profileSubject.asObservable();
  
  loadProfile() {
    return this.getProfile().pipe(
      tap((res: ViewProfileResponse) => {
        this.profileSubject.next(res.data);
      })
    );
  }
  
  refreshProfile() {
    this.getProfile().subscribe(res => {
      this.profileSubject.next(res.data);
    });
  }


  setRole(role: Role | null) {
    this.roleSubject.next(role);
  }

  getRoleSnapshot() {
    return this.roleSubject.value;
  }

  getProfile() {
    return this.get<ViewProfileResponse>(APP_APIs.getProfile);
  }

  editProfile(formData: FormData) {
    return this.patch<any>(APP_APIs.editProfile, formData);
  }  

  signUp(userData: any) {
    return this.post<IRegisterResponse>(APP_APIs.register, userData);
  }

  login(userData: any) {
    return this.postText(APP_APIs.login, userData);
  }

  requestPasswordChange(emailOrUserName: string) {
    const value = emailOrUserName.trim();
    const safe = encodeURIComponent(value);

    return this.post<any>(
      `${APP_APIs.forgotPassword}/${safe}`,
      {},
      {
        headers: {
          EmailorUserName: value,
          Email: value,
        },
      }
    );
  }

  verifyOtp(body: IVerifyOtpBody) {
    return this.postText(APP_APIs.verifyOtp, body);
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
    return this.post<any>(APP_APIs.logout, {});
  }

  private readonly cookieService = inject(CookieService);

  logoutAndRedirect() {
    this.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.router.navigateByUrl('/login');
      },
    });
  }

   redirectLogin() {
    this.roleSubject.next(null);
    this.profileSubject.next(null);
    
    // Clear cookies so the loggedinGuard knows we are truly logged out
    this.cookieService.delete('refreshToken', '/');
    this.cookieService.delete('refreshToken');
    
    this.router.navigateByUrl('/login');
  }
  redirectByRole(role: Role) {
    const map: Record<Role, string> = {
      Admin: '/admin/dashboard',
      Teacher: '/teacher/dashboard',
      Student: '/student/dashboard',
      Parent: '/parent/dashboard',
    };
  
    this.router.navigate([map[role]]);
  }
  
}
