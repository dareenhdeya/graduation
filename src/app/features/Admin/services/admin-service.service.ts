import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { ShowUsersResponse, ViewUserResponse } from '../interfaces/iadmin.interface';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { Params } from '@angular/router';
import { AddSubjectBody, AddSubjectResponse, ListSubjectsResponse, ViewSubjectResponse } from '../interfaces/IAdminSubject.interface';

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

  listSubjects() {
    return this.get<ListSubjectsResponse>(APP_APIs.adminListSubjects, undefined);
  }

  viewSubject(sid: string) {
    return this.get<ViewSubjectResponse>(APP_APIs.adminViewSubject(sid), undefined);
  }

  addSubject(body: AddSubjectBody) {
    return this.post<AddSubjectResponse>(APP_APIs.adminAddSubject, body);
  }

  approveTeacher() {}
}
