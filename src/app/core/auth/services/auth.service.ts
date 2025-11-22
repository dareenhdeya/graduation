import { Injectable } from '@angular/core';
import { baseHttp } from '../../services/base';
import { IRegisterResponse } from '../interfaces/IRegisterResponse';
import { ILoginResponse } from '../interfaces/ILoginResponse';
import { APP_APIs } from '../../constants/appAPIs';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends baseHttp {
  signUp(userData: {}) {
    return this.post<IRegisterResponse>(APP_APIs.register, userData);
  }
  login(userData: {}) {
    return this.post<ILoginResponse>(APP_APIs.login, userData);
  }
}
