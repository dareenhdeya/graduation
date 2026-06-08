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
import { LessonDetailsComponent } from './features/Student/student-actions/lesson-details/lesson-details.component';
import { authGuard } from './core/guards/auth/auth-guard';
import { logedinGuard } from './core/guards/logedin/logedin-guard';
import { roleGuard } from './core/guards/role/role-guard';
import { NotFoundComponent } from './core/not-found/not-found.component';
import { SubjectCrudComponent } from './features/Admin/admin-actions/controlSubjects/subject-crud/subject-crud.component';
import { AdminSubjectDetailsComponent } from './features/Admin/admin-actions/controlSubjects/admin-subject-details/admin-subject-details.component';
import { AdminDashboardComponent } from './features/Admin/admin-dashboard/admin-dashboard.component';
import { PendingTeachersComponent } from './features/Admin/admin-actions/controlUsers/pending-teachers/pending-teachers.component';
import { ParentActionsComponent } from './features/Parent/parent-actions/parent-actions.component';
import { RegisterStudentComponent } from './features/Parent/parent-actions/register-student/register-student.component';
import { ViewChildrenComponent } from './features/Parent/parent-actions/view-children/view-children.component';
import { ChildProfileComponent } from './features/Parent/parent-actions/child-profile/child-profile.component';
import { AddDictionaryComponent } from './features/Teacher/teacher-actions/add-dictionary/add-dictionary.component';
import { TeacherSubjectDashboardComponent } from './features/Teacher/teacher-actions/teacher-subject-dashboard/teacher-subject-dashboard.component';
import { ManageLessonComponent } from './features/Teacher/teacher-actions/manage-lesson/manage-lesson.component';

import { CreateQuizComponent } from './features/Teacher/teacher-actions/quizzes/create-quiz.component';
import { EditQuizComponent } from './features/Teacher/teacher-actions/quizzes/edit-quiz/edit-quiz.component';
import { QuizzesListComponent } from './features/Teacher/teacher-actions/teacher-subject-dashboard/quizzes-list/quizzes-list.component';
import { ViewQuizComponent } from './features/Teacher/teacher-actions/quizzes/view-quiz/view-quiz.component';
import { SolveQuizComponent } from './features/Student/student-actions/quizzes/solve-quiz/solve-quiz.component';
import { StudentSubjectsComponent } from './features/Parent/parent-actions/student-subjects/student-subjects.component';
import { SubjectReportComponent } from './features/Parent/parent-actions/subject-report/subject-report.component';
import { ProgressComponent } from './features/Student/progress/progress.component';
import { SignQuizComponent } from './core/ai/English-letters/app-sign-quiz.component';
import { ArabicQuizComponent } from './core/ai/Arabic/arabic-quiz.component';
import { EnglishWordQuizComponent } from './core/ai/English-words/english-word-quiz.component';
import { ArabicWordQuizComponent } from './core/ai/Arabic-words/arabic-word-quiz.component';

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
          {
            path: 'subject/:sid',
            component: TeacherSubjectDashboardComponent,
            title: 'Manage Subject',
          },
          {
            path: 'subject/:sid/lessons',
            component: GetTeacherLessonsComponent,
            title: 'My Lessons',
          },
          { path: 'subject/:sid/add-lesson', component: AddLessonComponent, title: 'Add Lesson' },
          {
            path: 'subject/:sid/lesson/:lid/manage',
            component: ManageLessonComponent,
            title: 'Manage Lesson',
          },
          {
            path: 'subject/:sid/students',
            component: GetTeacherStudentsComponent,
            title: 'My Students',
          },
          {
            path: 'subject/:sid/add-dictionary',
            component: AddDictionaryComponent,
            title: 'Add Dictionary',
          },
          {
            path: 'subject/:sid/quizzes',
            component: QuizzesListComponent,
            title: 'Subject Quizzes',
          },
          {
            path: 'subject/:sid/quizzes/create',
            component: CreateQuizComponent,
            title: 'Create Quiz',
          },
          {
            path: 'subject/:sid/quizzes/view/:qid',
            component: ViewQuizComponent,
            title: 'View Quiz',
          },
          {
            path: 'subject/:sid/quizzes/edit/:qid',
            component: EditQuizComponent,
            title: 'Edit Quiz',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise',
            component: CreateQuizComponent,
            title: 'Add Exercise to Lesson',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise/view/:qid',
            component: ViewQuizComponent,
            title: 'View Exercise',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise/edit/:qid',
            component: EditQuizComponent,
            title: 'Edit Exercise',
          },
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
            path: 'subject/:sid/lesson/:lid',
            component: LessonDetailsComponent,
            title: 'Lesson Details',
          },
          {
            path: 'my-subjects',
            component: ViewEnrolledSubjectsComponent,
            title: 'My Enrolled Subjects',
          },
          {
            path: 'subject/:sid/quizzes/:qid/solve',
            component: SolveQuizComponent,
            title: 'Solve Quiz',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise/:qid/solve',
            component: SolveQuizComponent,
            title: 'Solve Exercise',
          },
          { path: 'progress', component: ProgressComponent, title: 'My Progress' },
        ],
      },
      // --- PARENT ROUTES ---
      {
        path: 'parent',
        canActivate: [roleGuard],
        data: { roles: ['Parent'] },
        children: [
          { path: 'dashboard', component: ParentActionsComponent, title: 'Parent Dashboard' },
          {
            path: 'register-student',
            component: RegisterStudentComponent,
            title: 'Register Student',
          },
          { path: 'view-children', component: ViewChildrenComponent, title: 'View Children' },
          { path: 'child-profile/:id', component: ChildProfileComponent, title: 'Child Profile' },
          {
            path: 'student-subjects/:id',
            component: StudentSubjectsComponent,
            title: 'Child Subjects',
          },
          {
            path: 'subject-report/:sid/:studentId/:subjectName',
            component: SubjectReportComponent,
            title: 'Subject Report',
          },
        ],
      },

      { path: 'quiz', component: SignQuizComponent },
      { path: 'arabic-quiz', component: ArabicQuizComponent },
      { path: 'word-quiz', component: EnglishWordQuizComponent },
      { path: 'arabic-words', component: ArabicWordQuizComponent },
    ],
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'not found page',
  },
];
