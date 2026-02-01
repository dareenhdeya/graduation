import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { ShowUsersResponse, ViewUserResponse } from '../interfaces/iadmin.interface';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { Params } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AdminServiceService extends baseHttp {
  showUsers() {
    return this.get<ShowUsersResponse>(APP_APIs.adminShowUsers, undefined);
  }

  viewUserById(id: string, role?: number) {
    const params: Params = role !== undefined ? { role } : {};
    return this.get<ViewUserResponse>(APP_APIs.adminViewUser(id), params);
  }

  endSession(id: string) {
    return this.patch<any>(APP_APIs.adminEndSession(id), {});
  }

  blockUser(id: string) {
    return this.patch<any>(APP_APIs.adminBlockUser(id), {});
  }

  listSubjects() {}

  viewSubject() {}

  addSubject() {}

  approveTeacher() {}
}
