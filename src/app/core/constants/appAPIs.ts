import { environment } from '../../../environments/environment';

export const APP_APIs = {
  //* Auth
  register: `${environment.apiUrl}Auth/Sign-UP`,
  login: `${environment.apiUrl}Auth/sign-in`,

  forgotPassword: `${environment.apiUrl}Auth/Request-Password-change`,
  verifyOtp: `${environment.apiUrl}Auth/Verify-OTP`,
  resetPassword: `${environment.apiUrl}Auth/reset-password`,

  changePassword: `${environment.apiUrl}Auth/change-password`,

  logout: `${environment.apiUrl}Auth/logout`,

  refreshToken: `${environment.apiUrl}Auth/Refresh-Token`,

  getProfile: `${environment.apiUrl}Auth/view-profile`,
  editProfile: `${environment.apiUrl}Auth/Edit-profile`,

  //* Admin
  adminShowUsers: `${environment.apiUrl}Admin/Show-Users`,
  adminViewUser: (id: string) => `${environment.apiUrl}Admin/view-user/${id}`,
  adminEndSession: (id: string) => `${environment.apiUrl}Admin/End-Session/${id}`,
  adminBlockUser: (id: string) => `${environment.apiUrl}Admin/Toggle-Ban-User/${id}`,
  adminDeleteUser: `${environment.apiUrl}Admin/delete-user`,
  adminListSubjects: `${environment.apiUrl}Admin/List-Subjects`,
  adminViewSubject: (sid: string) => `${environment.apiUrl}Admin/View-Subject/${sid}`,
  adminAddSubject: `${environment.apiUrl}Admin/Add-Subject`,
  adminAproveTeacher: `${environment.apiUrl}Admin/Approve-teacher`,
  adminRemoveSubject: `${environment.apiUrl}Admin/Remove-Subject`,

  //  * Teacher
  teacherViewSubjects: `${environment.apiUrl}Teacher/Home`,
  teacherGetStudents: (sid: string) => `${environment.apiUrl}Teacher/get-students/${sid}`,
  teacherGetLessons: (sid: string) => `${environment.apiUrl}Teacher/get-lessons/${sid}`,
  teacherAddLesson: `${environment.apiUrl}Teacher/Add-lesson`,
  teacherEditLesson: `${environment.apiUrl}Teacher/Edit-Lesson`,
  teacherRemoveLesson: `${environment.apiUrl}Teacher/Remove-Lesson`,
  teacherViewLesson: (sid: string, lid: string) =>
    `${environment.apiUrl}Teacher/View-Lesson/${sid}/${lid}`,
  teacherUploadVideo: `${environment.apiUrl}Teacher/Upload-Video`,
  teacherRemoveVideo: `${environment.apiUrl}Teacher/Delete-Video`,
  teacherAddWordAttachment: (sid: string) =>
    `${environment.apiUrl}Teacher/Add-words-to-Dictionary/${sid}`,
  teacherCreateExercise: `${environment.apiUrl}Teacher/Create-Exercise`,
  teacherGetQuizzes: (sid: string) => `${environment.apiUrl}Teacher/List-Quizes/${sid}`,
  teacherViewQuiz: (sid: string, qid: string) =>
    `${environment.apiUrl}Teacher/subjects/${sid}/levels/${qid}`,
  teacherViewLessonQuiz: (sid: string, lid: string, qid: string) =>
    `${environment.apiUrl}Teacher/subjects/${sid}/lessons/${lid}/levels/${qid}`,
  teacherEditQuiz: `${environment.apiUrl}Teacher/Edit-Level`,
  teacherListPrerequisites: `${environment.apiUrl}Teacher/list-Perquisites`,
  teacherDeleteLevel: `${environment.apiUrl}Teacher/Delete-Level`,
  teacherUpdateCv: `${environment.apiUrl}Teacher/Update-CV`,
  teacherGetStudentProgress: (sid: string, stdID: string) => 
    `${environment.apiUrl}Teacher/Get-Student-Progress/${sid}/${stdID}`,
  teacherGetAllStudentsProgress: (sid: string) =>
    `${environment.apiUrl}Teacher/Get-students-progress/${sid}`,

  //* Student
  studentGetAllSubjects: `${environment.apiUrl}Student/View-Subjects`,
  studentGetSubjectDetails: (id: string) => `${environment.apiUrl}Student/View-Subject/${id}`,
  studentGetLessons: (id: string) => `${environment.apiUrl}Student/View-Lessons/${id}`,
  studentGetLessonDetails: (sid: string, lid: string) =>
    `${environment.apiUrl}Student/View-lesson/${sid}/${lid}`,
  studentCompleteLesson: `${environment.apiUrl}Student/Complete-lesson`,
  studentEnrollSubject: (id: string) => `${environment.apiUrl}Student/Enroll-subject/${id}`,
  studentViewEnrolledSubjects: `${environment.apiUrl}Student/View-Enrolled-Subjects`,
  studentCompleteLesseon: `${environment.apiUrl}Student/Complete-lesson`,
  studentStartQuiz: `${environment.apiUrl}Student/Start-Quiz`,
  studentViewExercise: `${environment.apiUrl}Student/View-Exercise`,
  studentSubmitAnswers: `${environment.apiUrl}Student/Submit-Answers`,
  studentViewSubmissions: `${environment.apiUrl}Student/View-Submissions`,

  // * Parent
  parentRegisterStudent: `${environment.apiUrl}Parent/register-student`,
  parentShowChildren: `${environment.apiUrl}Parent/Show-children`,
  parentViewChildProfile: (id: string) => `${environment.apiUrl}Parent/View-Profile/${id}`,
  parentViewStudentSubjects: `${environment.apiUrl}Parent/View-Student-Subjects`,
  parentViewSubjectReport: `${environment.apiUrl}Parent/view-subject-report`,
  parentDeleteStudent: `${environment.apiUrl}Parent/Delete-Student`,
};
