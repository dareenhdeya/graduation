export interface Student {
  id: string;
  name: string;
  email: string;
  parent: boolean;
}

export interface IGetTeacherStudents {
  message: string;
  data: Student[];
}
