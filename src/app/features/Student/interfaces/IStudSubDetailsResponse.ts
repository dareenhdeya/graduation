export interface StudentSubject {
	subjectId: string;
	subjectName: string;
	studentsCount: number;
	teachersCount: number;
	deaf_mute: boolean;
	lessonsCount: number;
	levelsCount: number;
}

export interface IStudSubDetailsResponse {
	message: string;
	result: StudentSubject;
}