export interface EnrolledSubject {
    subjectId: string;
    subjectName: string;
    studentsCount: number;
    teachersCount: number;
    deaf_mute: boolean;
    lessonsCount: number;
    levelsCount: number;
}

export interface IViewEnrolledSub {
    message: string;
    result: EnrolledSubject[];
}