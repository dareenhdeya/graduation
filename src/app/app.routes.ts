import { Routes } from '@angular/router';



















import { authGuard } from './core/guards/auth/auth-guard';
import { logedinGuard } from './core/guards/logedin/logedin-guard';
import { roleGuard } from './core/guards/role/role-guard';



























export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: [
      { path: 'login', loadComponent: () => import('./core/auth/login/login').then(m => m.Login), title: 'login page', canActivate: [logedinGuard] },
      { path: 'register', loadComponent: () => import('./core/auth/sign-up/sign-up').then(m => m.SignUp), title: 'register page', canActivate: [logedinGuard] },
      { path: 'forgotpass', loadComponent: () => import('./core/auth/forgotpass/forgotpass.component').then(m => m.ForgotpassComponent), title: 'forgot pass page' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent), title: 'Home' },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), title: 'Profile' },

      // --- ADMIN ROUTES ---
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        children: [
          // { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: () => import('./features/Admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), title: 'Admin Dashboard' },
          { path: 'users', loadComponent: () => import('./features/Admin/admin-actions/controlUsers/user-crud/user-crud.component').then(m => m.UserCrudComponent), title: 'Users' },
          {
            path: 'pending-teachers',
            loadComponent: () => import('./features/Admin/admin-actions/controlUsers/pending-teachers/pending-teachers.component').then(m => m.PendingTeachersComponent),
            title: 'Pending Teachers',
          },
          { path: 'users/:id', loadComponent: () => import('./features/Admin/admin-actions/controlUsers/user-details/user-details.component').then(m => m.UserDetailsComponent), title: 'User Details' },

          { path: 'subjects', loadComponent: () => import('./features/Admin/admin-actions/controlSubjects/subject-crud/subject-crud.component').then(m => m.SubjectCrudComponent), title: 'Subjects' },
          {
            path: 'subjects/:sid',
            loadComponent: () => import('./features/Admin/admin-actions/controlSubjects/admin-subject-details/admin-subject-details.component').then(m => m.AdminSubjectDetailsComponent),
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
          { path: 'dashboard', loadComponent: () => import('./features/Teacher/teacher-actions/teacher-actions.component').then(m => m.TeacherActionsComponent), title: 'Teacher Dashboard' },
          {
            path: 'subject/:sid',
            loadComponent: () => import('./features/Teacher/teacher-actions/teacher-subject-dashboard/teacher-subject-dashboard.component').then(m => m.TeacherSubjectDashboardComponent),
            title: 'Manage Subject',
          },
          {
            path: 'subject/:sid/lessons',
            loadComponent: () => import('./features/Teacher/teacher-actions/get-teacher-lessons/get-teacher-lessons.component').then(m => m.GetTeacherLessonsComponent),
            title: 'My Lessons',
          },
          { path: 'subject/:sid/add-lesson', loadComponent: () => import('./features/Teacher/teacher-actions/add-lesson/add-lesson.component').then(m => m.AddLessonComponent), title: 'Add Lesson' },
          {
            path: 'subject/:sid/lesson/:lid/manage',
            loadComponent: () => import('./features/Teacher/teacher-actions/manage-lesson/manage-lesson.component').then(m => m.ManageLessonComponent),
            title: 'Manage Lesson',
          },
          {
            path: 'subject/:sid/students',
            loadComponent: () => import('./features/Teacher/teacher-actions/get-teacher-students/get-teacher-students.component').then(m => m.GetTeacherStudentsComponent),
            title: 'My Students',
          },
          {
            path: 'subject/:sid/add-dictionary',
            loadComponent: () => import('./features/Teacher/teacher-actions/add-dictionary/add-dictionary.component').then(m => m.AddDictionaryComponent),
            title: 'Add Dictionary',
          },
          {
            path: 'subject/:sid/quizzes',
            loadComponent: () => import('./features/Teacher/teacher-actions/teacher-subject-dashboard/quizzes-list/quizzes-list.component').then(m => m.QuizzesListComponent),
            title: 'Subject Quizzes',
          },
          {
            path: 'subject/:sid/quizzes/create',
            loadComponent: () => import('./features/Teacher/teacher-actions/quizzes/create-quiz.component').then(m => m.CreateQuizComponent),
            title: 'Create Quiz',
          },
          {
            path: 'subject/:sid/quizzes/view/:qid',
            loadComponent: () => import('./features/Teacher/teacher-actions/quizzes/view-quiz/view-quiz.component').then(m => m.ViewQuizComponent),
            title: 'View Quiz',
          },
          {
            path: 'subject/:sid/quizzes/edit/:qid',
            loadComponent: () => import('./features/Teacher/teacher-actions/quizzes/edit-quiz/edit-quiz.component').then(m => m.EditQuizComponent),
            title: 'Edit Quiz',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise',
            loadComponent: () => import('./features/Teacher/teacher-actions/quizzes/create-quiz.component').then(m => m.CreateQuizComponent),
            title: 'Add Exercise to Lesson',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise/view/:qid',
            loadComponent: () => import('./features/Teacher/teacher-actions/quizzes/view-quiz/view-quiz.component').then(m => m.ViewQuizComponent),
            title: 'View Exercise',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise/edit/:qid',
            loadComponent: () => import('./features/Teacher/teacher-actions/quizzes/edit-quiz/edit-quiz.component').then(m => m.EditQuizComponent),
            title: 'Edit Exercise',
          },
          {
            path: 'subject/:sid/student/:stdID/progress',
            loadComponent: () => import('./features/Teacher/teacher-actions/student-progress/student-progress.component').then(m => m.StudentProgressComponent),
            title: 'Student Progress',
          },
        ],
      },
      // --- STUDENT ROUTES ---
      {
        path: 'student',
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
        children: [
          { path: 'dashboard', loadComponent: () => import('./features/Student/student-actions/student-actions.component').then(m => m.StudentActionsComponent), title: 'Student Dashboard' },

          { path: 'all-subjects', loadComponent: () => import('./features/Student/student-actions/view-all-subjects/view-all-subjects.component').then(m => m.ViewAllSubjectsComponent), title: 'All Subjects' },

          { path: 'subject/:id', loadComponent: () => import('./features/Student/student-actions/subject-details/subject-details.component').then(m => m.SubjectDetailsComponent), title: 'Subject Details' },
          {
            path: 'subject-lessons/:id',
            loadComponent: () => import('./features/Student/student-actions/view-lessons/view-lessons.component').then(m => m.ViewLessonsComponent),
            title: 'Subject Lessons',
          },
          {
            path: 'subject/:sid/lesson/:lid',
            loadComponent: () => import('./features/Student/student-actions/lesson-details/lesson-details.component').then(m => m.LessonDetailsComponent),
            title: 'Lesson Details',
          },
          {
            path: 'my-subjects',
            loadComponent: () => import('./features/Student/student-actions/view-enrolled-subjects/view-enrolled-subjects.component').then(m => m.ViewEnrolledSubjectsComponent),
            title: 'My Enrolled Subjects',
          },
          {
            path: 'subject/:sid/quizzes/:qid/solve',
            loadComponent: () => import('./features/Student/student-actions/quizzes/solve-quiz/solve-quiz.component').then(m => m.SolveQuizComponent),
            title: 'Solve Quiz',
          },
          {
            path: 'subject/:sid/lesson/:lid/exercise/:qid/solve',
            loadComponent: () => import('./features/Student/student-actions/quizzes/solve-quiz/solve-quiz.component').then(m => m.SolveQuizComponent),
            title: 'Solve Exercise',
          },
          { path: 'progress', loadComponent: () => import('./features/Student/progress/progress.component').then(m => m.ProgressComponent), title: 'My Progress' },
        ],
      },
      // --- PARENT ROUTES ---
      {
        path: 'parent',
        canActivate: [roleGuard],
        data: { roles: ['Parent'] },
        children: [
          { path: 'dashboard', loadComponent: () => import('./features/Parent/parent-actions/parent-actions.component').then(m => m.ParentActionsComponent), title: 'Parent Dashboard' },
          {
            path: 'register-student',
            loadComponent: () => import('./features/Parent/parent-actions/register-student/register-student.component').then(m => m.RegisterStudentComponent),
            title: 'Register Student',
          },
          { path: 'view-children', loadComponent: () => import('./features/Parent/parent-actions/view-children/view-children.component').then(m => m.ViewChildrenComponent), title: 'View Children' },
          { path: 'child-profile/:id', loadComponent: () => import('./features/Parent/parent-actions/child-profile/child-profile.component').then(m => m.ChildProfileComponent), title: 'Child Profile' },
          {
            path: 'student-subjects/:id',
            loadComponent: () => import('./features/Parent/parent-actions/student-subjects/student-subjects.component').then(m => m.StudentSubjectsComponent),
            title: 'Child Subjects',
          },
          {
            path: 'subject-report/:sid/:studentId/:subjectName',
            loadComponent: () => import('./features/Parent/parent-actions/subject-report/subject-report.component').then(m => m.SubjectReportComponent),
            title: 'Subject Report',
          },
        ],
      },

      { path: 'quiz', loadComponent: () => import('./core/ai/English-letters/app-sign-quiz.component').then(m => m.SignQuizComponent) },
      { path: 'arabic-quiz', loadComponent: () => import('./core/ai/Arabic/arabic-quiz.component').then(m => m.ArabicQuizComponent) },
      { path: 'word-quiz', loadComponent: () => import('./core/ai/English-words/english-word-quiz.component').then(m => m.EnglishWordQuizComponent) },
      { path: 'arabic-words', loadComponent: () => import('./core/ai/Arabic-words/arabic-word-quiz.component').then(m => m.ArabicWordQuizComponent) },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./core/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'not found page',
  },
];
