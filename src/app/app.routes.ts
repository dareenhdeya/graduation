import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { Login } from './core/auth/login/login';
import { SignUp } from './core/auth/sign-up/sign-up';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { HomeComponent } from './features/home/home.component';
import { ForgotpassComponent } from './core/auth/forgotpass/forgotpass.component';
import { ProfileComponent } from './features/profile/profile.component';
import { UserCrudComponent } from './features/Admin/admin-actions/controlUsers/user-crud/user-crud.component';
import { UserDetailsComponent } from './features/Admin/admin-actions/controlUsers/user-details/user-details.component';
import { TeacherActionsComponent } from './features/Teacher/teacher-actions/teacher-actions.component';
import { GetTeacherLessonsComponent } from './features/Teacher/teacher-actions/get-teacher-lessons/get-teacher-lessons.component';
import { AddLessonComponent } from './features/Teacher/teacher-actions/add-lesson/add-lesson.component';
import { GetTeacherStudentsComponent } from './features/Teacher/teacher-actions/get-teacher-students/get-teacher-students.component';
import { StudentActionsComponent } from './features/Student/student-actions/student-actions.component';
import { SubjectDetailsComponent } from './features/Student/student-actions/subject-details/subject-details.component';
import { ViewAllSubjectsComponent } from './features/Student/student-actions/view-all-subjects/view-all-subjects.component';
import { ViewLessonsComponent } from './features/Student/student-actions/view-lessons/view-lessons.component';
import { ViewEnrolledSubjectsComponent } from './features/Student/student-actions/view-enrolled-subjects/view-enrolled-subjects.component';
import { authGuard } from './core/guards/auth/auth-guard';
import { logedinGuard } from './core/guards/logedin/logedin-guard';
import { roleGuard } from './core/guards/role/role-guard';
import { NotFoundComponent } from './core/not-found/not-found.component';
import { SubjectCrudComponent } from './features/Admin/admin-actions/controlSubjects/subject-crud/subject-crud.component';
import { AdminSubjectDetailsComponent } from './features/Admin/admin-actions/controlSubjects/admin-subject-details/admin-subject-details.component';
import { AdminDashboardComponent } from './features/Admin/admin-dashboard/admin-dashboard.component';
import { PendingTeachersComponent } from './features/Admin/admin-actions/controlUsers/pending-teachers/pending-teachers.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login, title: 'login page', canActivate: [logedinGuard] },
      { path: 'register', component: SignUp, title: 'register page', canActivate: [logedinGuard] },
      { path: 'forgotpass', component: ForgotpassComponent, title: 'forgot pass page' },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent, title: 'Home' },
      { path: 'profile', component: ProfileComponent, title: 'Profile' },

      // --- ADMIN ROUTES ---
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        children: [
          // { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: AdminDashboardComponent, title: 'Admin Dashboard' },
          { path: 'users', component: UserCrudComponent, title: 'Users' },
          {
            path: 'pending-teachers',
            component: PendingTeachersComponent,
            title: 'Pending Teachers',
          },
          { path: 'users/:id', component: UserDetailsComponent, title: 'User Details' },

          { path: 'subjects', component: SubjectCrudComponent, title: 'Subjects' },
          {
            path: 'subjects/:sid',
            component: AdminSubjectDetailsComponent,
            title: 'Subject Details',
          },
        ],
      },

      // --- TEACHER ROUTES ---
      {
        path: 'teacher',
        canActivate: [roleGuard],
        data: { roles: ['Teacher'] },
        children: [
          { path: 'dashboard', component: TeacherActionsComponent, title: 'Teacher Dashboard' },
          { path: 'lessons', component: GetTeacherLessonsComponent, title: 'My Lessons' },
          { path: 'add-lesson', component: AddLessonComponent, title: 'Add Lesson' },
          { path: 'students', component: GetTeacherStudentsComponent, title: 'My Students' },
        ],
      },
      // --- STUDENT ROUTES ---
      {
        path: 'student',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        children: [
          { path: 'dashboard', component: StudentActionsComponent, title: 'Student Dashboard' },

          { path: 'all-subjects', component: ViewAllSubjectsComponent, title: 'All Subjects' },

          { path: 'subject/:id', component: SubjectDetailsComponent, title: 'Subject Details' },
          {
            path: 'subject-lessons/:id',
            component: ViewLessonsComponent,
            title: 'Subject Lessons',
          },
          {
            path: 'my-subjects',
            component: ViewEnrolledSubjectsComponent,
            title: 'My Enrolled Subjects',
          },
        ],
      },
    ],
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'not found page',
  },
];
