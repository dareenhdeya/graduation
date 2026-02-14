export interface IAdminSubject {
  subjectId: string;
  subjectName: string;
  studentsCount: number;
  teachersCount: number;
  deaf_mute: boolean;
  lessonsCount: number;
  levelsCount: number;
}

export interface ListSubjectsResponse {
  message: string;
  data: IAdminSubject[];
}

export interface ViewSubjectResponse {
  message: string;
  data: IAdminSubject;
}

export interface AddSubjectBody {
  subjectName: string;
  deaf_mute: boolean;
}

export interface AddSubjectResponse {
  message: string;
  data: any;
}
