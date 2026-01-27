import { environment } from '../../../environments/environment';

export const APP_APIs = {
  // Auth
  register: `${environment.apiUrl}Auth/Sign-UP`,
  login: `${environment.apiUrl}Auth/sign-in`,

  forgotPassword: `${environment.apiUrl}Auth/Request-Password-change`,
  verifyOtp: `${environment.apiUrl}Auth/Verify-OTP`,
  resetPassword: `${environment.apiUrl}Auth/reset-password`,

  changePassword: `${environment.apiUrl}Auth/change-password`,

  logout: `${environment.apiUrl}Auth/logout`,

  refreshToken: `${environment.apiUrl}Auth/Refresh-Token`,
};
