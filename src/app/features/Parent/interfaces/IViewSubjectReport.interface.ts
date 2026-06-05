export interface ISubmission {
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

export interface ISubjectReportData {
  submissionDTOs: ISubmission[];
  avgGrades: number;
  avgAttemptsUsed: number;
}

export interface IViewSubjectReportResponse {
  message: string | null;
  data: ISubjectReportData;
}
