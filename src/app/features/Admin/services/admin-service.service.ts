import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { IADMIN, ShowUsersResponse, ViewUserResponse } from '../interfaces/iadmin.interface';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { Params } from '@angular/router';
import {
  AddSubjectBody,
  AddSubjectResponse,
  IAproveResponse,
  IAproveTeacher,
  ListSubjectsResponse,
  ViewSubjectResponse,
} from '../interfaces/IAdminSubject.interface';

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

  deleteUser(user: IADMIN, all: boolean = false) {
    return this.http.delete<any>(APP_APIs.adminDeleteUser, {
      headers: { all: String(all) },
      body: user,
      observe: 'body',
      responseType: 'json',
    });
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

  removeSubject(sid: string) {
    return this.http.delete<any>(APP_APIs.adminRemoveSubject, {
      headers: { sid },
      observe: 'body',
      responseType: 'json',
    });
  }

  approveTeacher(body: IAproveTeacher) {
    return this.patch<IAproveResponse>(APP_APIs.adminAproveTeacher, body);
  }
}
