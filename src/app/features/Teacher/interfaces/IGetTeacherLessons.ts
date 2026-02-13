export interface IGetTeacherLessons {
    message: string;
    result: ILesson[];
}

export interface ILesson {
	id: string;
	title: string;
	description: string;
	videoFile?: any;
	videoUrl?: any;
	releaseDate: string;
}

