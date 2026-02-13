import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { IGetTeacherStudents } from '../interfaces/IGetTeacherStudents';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { IGetTeacherLessons } from '../interfaces/IGetTeacherLessons';

@Injectable({
  providedIn: 'root',
})
export class TeacherServiceService extends baseHttp {
  getStudents() {
    return this.get<IGetTeacherStudents>(APP_APIs.teacherGetStudents, {});
  }
  getLessons() {
    return this.get<IGetTeacherLessons>(APP_APIs.teacherGetLessons, {});
  }
  addLesson(lessonData: FormData) {
    return this.post(APP_APIs.teacherAddLesson, lessonData);
  }
}
