export interface IEditLessonResponse {
	message: string;
	result?: any;
}
export interface IEditedLesson {
	title: string;
	description: string;
	subjectId: string;
	lid: string;
	perquisiteType?: number;
	perquisite?: string | null;
}