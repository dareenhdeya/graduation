import { environment } from '../../../environments/environment';

export const APP_APIs = {
  // Authentication
  register: `${environment.apiUrl}Auth/sign-Up`,
  login: `${environment.apiUrl}Auth/sign-in`,
  forgotPassword: `${environment.apiUrl}Auth/Request-Password-change`,
  changePassword: `${environment.apiUrl}Auth/Change-password`,
  resetPassword: `${environment.apiUrl}Auth/reset-password`,
};
