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
  submitted = false;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      usernameorEmail: [null, [Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
          ),
        ],
      ],
    });
  }

  submitLogin(): void {
    this.submitted = true;

    if (this.loginForm.valid) {
      this.subscription.unsubscribe();
      this.isLoading = true;
      this.errMsg = '';

      this.subscription = this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          console.log('login res:', res);
          this.router.navigate(['/home']);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;

          console.log('login err:', err);
          const rawMsg = err.error?.message || err.userMessage || 'Login failed';

          if (typeof rawMsg === 'object') {
            this.errMsg = rawMsg.message;
          } else {
            this.errMsg = rawMsg;
          }
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
