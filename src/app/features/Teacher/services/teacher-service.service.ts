import { Injectable } from '@angular/core';
import { baseHttp } from '../../../core/services/base';
import { IGetTeacherStudents } from '../interfaces/IGetTeacherStudents';
import { APP_APIs } from '../../../core/constants/appAPIs';
import { IGetTeacherLessons } from '../interfaces/IGetTeacherLessons';
import { IWordAttachment } from '../interfaces/IWordAttachment';
import { IAddToDictionaryResponse } from '../interfaces/IAddToDictionaryResponse';

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
  addDictionary(word: string, file: File) {
    const formData = new FormData();
    
    formData.append('word', word);

    formData.append('files', file);

    return this.post<IAddToDictionaryResponse>(APP_APIs.teacherAddWordAttachment, formData);
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
