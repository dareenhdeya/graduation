import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { IStudAllSubResponse } from '../interfaces/IStudAllSubResponse';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { IStudSubDetailsResponse } from '../interfaces/IStudSubDetailsResponse';
import { IStudViewLesson } from '../interfaces/IStudViewLesson';
import { IEnrollSubResponse } from '../interfaces/IEnrollSubResponse';
import { IViewEnrolledSub } from '../interfaces/IViewEnrolledSub';

@Injectable({
  providedIn: 'root',
})
export class StudentServiceService extends baseHttp {


  getAllSubjects() {
    return this.get<IStudAllSubResponse>(APP_APIs.studentGetAllSubjects, {});
  }
  getSubjectDetails(subjectId: string) {
    return this.get<IStudSubDetailsResponse>(APP_APIs.studentGetSubjectDetails(subjectId), {});
  }
  getLessons(subjectId: string) {
    return this.get<IStudViewLesson>(APP_APIs.studentGetLessons(subjectId), {});
  }
  enrollSubject(subjectId: string) {
    return this.post<IEnrollSubResponse>(APP_APIs.studentEnrollSubject(subjectId), {});
  }
  viewEnrolledSubjects() {
    return this.get<IViewEnrolledSub>(APP_APIs.studentViewEnrolledSubjects, {});
  }
}