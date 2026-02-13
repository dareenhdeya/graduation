export interface StudLesson {
	id: string;
	title: string;
	description: string;
	videoFile?: any;
	videoUrl?: any;
	releaseDate: string;
}

export interface IStudViewLesson {
	message: string;
	result: StudLesson[];
}