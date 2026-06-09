export interface IStudentProgressItem {
  subjectName: string;
  levelName: string;
  subjectFK: string;
  levelFK: string;
  lessonID: string;
  percentage: number;
  highestPercentage: number;
  attemptsUsed: number;
  retakesRemaining: number;
  timeTakenInMinutes: number;
  submittedAt: string;
}

export interface StudentProgressResponse {
  message: string;
  result: IStudentProgressItem[];
}
