import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);
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
      usernameorEmail: [null, [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-])[A-Za-z\d@$!%*?&#^()_+\-]{8,}$/
          ),
        ],
      ],
    });
  }

  isInvalid(controlName: string): boolean {
    const c = this.loginForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  submitLogin(): void {
    this.submitted = true;

    if (this.loginForm.valid) {
      this.subscription.unsubscribe();
      this.isLoading = true;
      this.errMsg = '';

      this.subscription = this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.authService.getProfile().subscribe({
            next: (res) => {
              const role = res.data.role;
              setTimeout(() => {
                this.toastrService.success('Login successful');
              }, 850);
              this.authService.setRole(role);
              setTimeout(() => {
                this.authService.redirectByRole(role);
              }, 1000);

              console.log('login res:', res);
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
              this.errMsg = 'Failed to load profile';
            },
          });
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
          setTimeout(() => {
            this.toastrService.error(this.errMsg, 'Error');
          }, 850);
        },
      });
    } else {
      this.toastrService.warning('Please fill in all required fields correctly.', 'Warning');
      this.loginForm.markAllAsTouched();
    }
  }
}
