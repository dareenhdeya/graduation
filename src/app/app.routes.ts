import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { Login } from './core/auth/login/login';
import { SignUp } from './core/auth/sign-up/sign-up';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { HomeComponent } from './features/home/home.component';
import { ForgotpassComponent } from './core/auth/forgotpass/forgotpass.component';

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
    children: [{ path: 'home', component: HomeComponent, title: 'home page' }],
  },
  // {
  //   path: '**',
  //   component: NotfoundComponent,
  //   title: 'not found page',
  // },
];
