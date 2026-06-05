export interface StudLesson {
	id: string;
	subjectId: string;
	title: string;
	description?: string;
	videosCount: number;
	locked: boolean;
	nlid: string | null;
	next: string;
	nextType: number;
	videos: any[];
	levels: any | null;
	videoFile?: any;
	videoUrl?: any;
	releaseDate?: string;
}

export interface IStudViewLesson {
	message: string;
	result: StudLesson[];
}