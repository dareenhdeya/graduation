export interface TeacherSubject {
  subjectId: string;
  subjectName: string;
  deaf_mute: boolean;
  studentsCount?: number;
  teachersCount?: number;
  lessonsCount?: number;
  levelsCount?: number;
}

export interface ITeacherSubjectsResponse {
  message: string;
  result: TeacherSubject[];
}

