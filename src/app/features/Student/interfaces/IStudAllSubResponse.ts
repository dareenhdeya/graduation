export interface StudentAllSubject {
	subjectId: string;
	subjectName: string;
	studentsCount: number;
	teachersCount: number;
	deaf_mute: boolean;
	lessonsCount: number;
	levelsCount: number;
}

export interface IStudAllSubResponse {
	message: string;
	result: StudentAllSubject[];
}