import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { IGetTeacherStudents } from '../interfaces/IGetTeacherStudents';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { IGetTeacherLessons } from '../interfaces/IGetTeacherLessons';
import { IAddToDictionaryResponse } from '../interfaces/IAddToDictionaryResponse';
import { IEditedLesson, IEditLessonResponse } from '../interfaces/IEditLessonResponse';
import { ITeacherSubjectsResponse } from '../interfaces/ITeacherSubjects';
import { ITeacherLessonContentResponse } from '../interfaces/ILessonContent';

@Injectable({
  providedIn: 'root',
})
export class TeacherServiceService extends baseHttp {
  getSubjects() {
    return this.get<ITeacherSubjectsResponse>(APP_APIs.teacherViewSubjects, {});
  }

  getStudents(subjectId: string) {
    return this.get<IGetTeacherStudents>(APP_APIs.teacherGetStudents(subjectId), {});
  }

  getLessons(subjectId: string) {
    return this.get<IGetTeacherLessons>(APP_APIs.teacherGetLessons(subjectId), {});
  }
  addLesson(lessonData: FormData) {
    return this.post(APP_APIs.teacherAddLesson, lessonData);
  }
  editLesson(lessonId: string, lessonData: IEditedLesson) {
    return this.patch<IEditLessonResponse>(APP_APIs.teacherEditLesson(lessonId), lessonData);
  }
  removeLesson(lessonId: string) {
    return this.delete(APP_APIs.teacherRemoveLesson(lessonId));
  }

  getLessonDetails(subjectId: string, lessonId: string) {
    return this.get<ITeacherLessonContentResponse>(APP_APIs.teacherViewLesson(subjectId, lessonId), {});
  }

  uploadVideo(formData: FormData) {
    return this.post(APP_APIs.teacherUploadVideo, formData);
  }

  addDictionary(subjectId: string, word: string, file: File) {
    const formData = new FormData();

    formData.append('word', word);

    formData.append('files', file);

    return this.post<IAddToDictionaryResponse>(APP_APIs.teacherAddWordAttachment(subjectId), formData);
  }

  // // Converts Array to FormData
  // private handleDictionaryForm(data: IWordAttachment[]): FormData {
  //   const formData = new FormData();

  //   data.forEach((entry, index) => {


  //     //  use index to tell backend this is a list: entries[0], entries[1]...
  //     formData.append(`entries[${index}].word`, entry.word);
  //     formData.append(`entries[${index}].file`, entry.file);
  //   });

  //   return formData;
  // }
}
