import { APP_APIs } from './../../../core/constants/appAPIs';
import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { IRegStudResponse } from '../interfaces/IRegStudResponse';
import { IViewChildrenResponse } from '../interfaces/IViewChildrenResponse';
import { IViewChildProfile } from '../interfaces/IViewChildProfile';

@Injectable({
  providedIn: 'root',
})
export class ParentServiceService extends baseHttp {
  registerStudent(data: FormData) {
    return this.http.post<IRegStudResponse>(APP_APIs.parentRegisterStudent, data);
  }
  activateStudent() {
  }
  showChildren() {
    return this.get<IViewChildrenResponse>(APP_APIs.parentShowChildren, {});
  }
  viewChildProfile(id: string) {
    return this.get<IViewChildProfile>(APP_APIs.parentViewChildProfile(id), {});
  }
}
