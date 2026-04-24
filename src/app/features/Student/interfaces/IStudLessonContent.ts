export interface IStudVideo {
  vId: string;
  lId: string;
  subjectID: string;
  title: string;
  description: string;
  uploaded_by?: string;
  videoUrl?: string;
  releaseDate?: string;
}

export interface IStudLessonContentResult {
  id: string;
  subjectId: string;
  title: string;
  videosCount: number;
  videos: IStudVideo[];
  locked?: boolean;
  levels?: any;
}

export interface IStudLessonContentResponse {
  message: string;
  result: IStudLessonContentResult;
}

