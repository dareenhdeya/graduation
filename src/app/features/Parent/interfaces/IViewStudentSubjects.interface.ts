export interface ISubjectData {
  subjectId: string;
  subjectName: string;
  studentsCount: number;
  teachersCount: number;
  deaf_mute: boolean;
  lessonsCount: number;
  levelsCount: number;
  wordCount: number;
  progress: number;
  averageGrades: number;
  failure_rate: number;
  success_rate: number;
  submissionsCount: number;
}

export interface IViewStudentSubjectsResponse {
  message: string;
  data: ISubjectData | ISubjectData[];
}
