export interface Submission {
    subjectName: string;
    levelName: string;
    subjectFK: string;
    levelFK: string;
    lessonID: string | null;
    percentage: number;
    highestPercentage: number;
    attemptsUsed: number;
    retakesRemaining: number;
    timeTakenInMinutes: number;
    submittedAt: string;
  }
  
  export interface IStudSubmissionsResponse {
    message: string;
    result: Submission[];
  }