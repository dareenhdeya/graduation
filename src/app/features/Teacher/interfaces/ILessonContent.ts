export interface ITeacherVideo {
  lId: string;
  subjectID: string;
  vId?: string;
  title: string;
  description: string;
  uploaded_by?: string;
  videoFile?: any;
  videoUrl?: string;
  releaseDate?: string;
}

export interface ITeacherLessonContentResult {
  id: string;
  subjectId: string;
  title: string;
  videosCount: number;
  videos: ITeacherVideo[];
}

export interface ITeacherLessonContentResponse {
  message: string;
  result: ITeacherLessonContentResult;
}

