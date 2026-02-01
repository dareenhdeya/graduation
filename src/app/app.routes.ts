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

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login, title: 'login page' },
      { path: 'register', component: SignUp, title: 'register page' },
      {
        path: 'forgotpass',
        component: ForgotpassComponent,
        title: 'forgot pass page',
      },
    ],
  },
  {
    path: '',
    component: MainLayout,
    children: [{ path: 'home', component: HomeComponent, title: 'home page' },
      { path: 'profile', component: ProfileComponent, title: 'profile page' },
      
      //ADMIN
      { path: 'admin/users', component: UserCrudComponent, title: 'users' },
      { path: 'admin/users/:id', component: UserDetailsComponent, title: 'user details page' },
    ],
  },
  // {
  //   path: '**',
  //   component: NotfoundComponent,
  //   title: 'not found page',
  // },
];
