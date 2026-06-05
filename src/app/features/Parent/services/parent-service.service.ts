import { APP_APIs } from './../../../core/constants/appAPIs';
import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { HttpHeaders } from '@angular/common/http';
import { IRegStudResponse } from '../interfaces/IRegStudResponse';
import { IChildren, IViewChildrenResponse } from '../interfaces/IViewChildrenResponse';
import { IViewChildProfile } from '../interfaces/IViewChildProfile';
import { IViewStudentSubjectsResponse } from '../interfaces/IViewStudentSubjects.interface';
import { IViewSubjectReportResponse } from '../interfaces/IViewSubjectReport.interface';

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

viewStudentSubjects(sid: string) {
  return this.get<IViewStudentSubjectsResponse>(
    APP_APIs.parentViewStudentSubjects,
    {},
    { headers: new HttpHeaders({ sid }) }
  );
}

viewSubjectReport(sid: string, studentId: string) {
  return this.get<IViewSubjectReportResponse>(
    APP_APIs.parentViewSubjectReport,
    {},
    { headers: new HttpHeaders({ sid, studentId }) }
  );
}

deleteStudent(child: IChildren) {
  return this.deleteWithBody<{ message: string }>(
    APP_APIs.parentDeleteStudent,
    child
  );
}
}
