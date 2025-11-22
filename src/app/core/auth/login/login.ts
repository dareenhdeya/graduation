import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cookieService = inject(CookieService);

  subscription: Subscription = new Subscription();
  errMsg: string = '';
  isLoading: boolean = false;
  showPass: boolean = false;
  loginForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      usernameorEmail: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
    });
  }

  submitLogin(): void {
    if (this.loginForm.valid) {
      console.log(this.loginForm);

      this.subscription.unsubscribe();
      this.isLoading = true;
      this.errMsg = '';

      this.subscription = this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          console.log(res);
          if (res.message === 'Logined Successfully') {
            this.cookieService.set('token', res.data.accessToken);
            this.router.navigate(['home']);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errMsg = err.error.message;
          this.isLoading = false;
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
