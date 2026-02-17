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
  adminListSubjects: `${environment.apiUrl}Admin/List-Subjects`,
  adminViewSubject: (sid: string) => `${environment.apiUrl}Admin/View-Subject/${sid}`,
  adminAddSubject: `${environment.apiUrl}Admin/Add-Subject`,

  //  * Teacher
  teacherGetStudents: `${environment.apiUrl}Teacher/get-students`,
  teacherGetLessons: `${environment.apiUrl}Teacher/get-lessons`,
  teacherAddLesson: `${environment.apiUrl}Teacher/Add-lesson`,
  teacherEditLesson: (id: string) => `${environment.apiUrl}Teacher/Edit-Lesson/${id}`,
  teacherRemoveLesson: (id: string) => `${environment.apiUrl}Teacher/Remove-Lesson/${id}`,

  teacherAddWordAttachment: `${environment.apiUrl}Teacher/Add-words-to-Dictionary`,

  //* Student
  studentGetAllSubjects: `${environment.apiUrl}Student/View-Subjects`,
  studentGetSubjectDetails: (id: string) => `${environment.apiUrl}Student/View-Subject/${id}`,
  studentGetLessons: (id: string) => `${environment.apiUrl}Student/View-Lessons/${id}`,
  studentEnrollSubject: (id: string) => `${environment.apiUrl}Student/Enroll-subject/${id}`,
  studentViewEnrolledSubjects: `${environment.apiUrl}Student/View-Enrolled-Subjects`,



  // * Parent
  parentRegisterStudent: `${environment.apiUrl}Parent/register-student`,
  parentShowChildren: `${environment.apiUrl}Parent/Show-children`,
  parentViewChildProfile: (id: string) => `${environment.apiUrl}Parent/View-Profile/${id}`,
};
