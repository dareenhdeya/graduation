export interface Student {
	id: string;
	name: string;
	email: string;
	parentInfo?: any;
}

export interface IGetTeacherStudents {
	message: string;
	result: Student[];
}