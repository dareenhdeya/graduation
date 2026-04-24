import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgotpass',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgotpass.component.html',
  styleUrls: ['./forgotpass.component.css'],
})
export class ForgotpassComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);
  private toastr = inject(ToastrService);

  currentStep = 1;
  loading = false;
  errMsg = '';

  showNewPass = false;
  showConfirmPass = false;

  steps = [
    { id: 1, label: 'Forgot Password' },
    { id: 2, label: 'Verify OTP' },
    { id: 3, label: 'Reset Password' },
  ];

  emailForm = this.fb.group({
    emailOrUserName: ['', Validators.required, Validators.email],
  });

  otpForm = this.fb.group({
    otp: ['', Validators.required],
  });

  resetForm = this.fb.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-])[A-Za-z\d@$!%*?&#^()_+\-]{8,}$/
          ),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: this.passwordMatchValidator,
    }
  );

  passwordMatchValidator(g: any) {
    const pass = g.get('newPassword').value;
    const confirm = g.get('confirmPassword').value;
    return pass === confirm ? null : { mismatch: true };
  }

  savedUser = '';

  otpVerified = false;

  canGoTo(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return !!this.savedUser;
    if (step === 3) return this.otpVerified;
    return false;
  }

  goTo(step: number) {
    if (!this.canGoTo(step)) return;
    this.errMsg = '';
    this.currentStep = step;
  }

  submitEmail() {
    if (this.emailForm.invalid) {
      this.toastr.warning('Please enter a valid email or username.', 'Warning');
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errMsg = '';

    const user = (this.emailForm.value.emailOrUserName || '').trim();
    this.savedUser = user;

    this.authService.requestPasswordChange(user).subscribe({
      next: () => {
        this.toastr.success('OTP sent successfully.', 'Success');
        this.currentStep = 2;
        this.loading = false;
      },
      error: (err) => {
        this.errMsg = err.userMessage || err.error?.message || 'Failed to send OTP';
        this.toastr.error(this.errMsg, 'Error');
        this.loading = false;
      },
    });
  }

  submitOtp() {
    if (this.otpForm.invalid) {
      this.toastr.warning('Please enter the OTP.', 'Warning');
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errMsg = '';

    const payload = {
      emailOrUserName: this.savedUser,
      otp: (this.otpForm.value.otp || '').trim(),
    };

    this.authService.verifyOtp(payload).subscribe({
      next: () => {
        this.toastr.success('OTP verified successfully.', 'Success');
        this.otpVerified = true;
        this.currentStep = 3;
        this.loading = false;
      },
      error: (err) => {
        this.errMsg = err.userMessage || err.error?.message || 'Invalid OTP';
        this.toastr.error(this.errMsg, 'Error');
        this.loading = false;
      },
    });
  }

  submitReset() {
    if (this.resetForm.invalid) {
      this.toastr.warning('Please fill in password fields correctly.', 'Warning');
      this.resetForm.markAllAsTouched();
      return;
    }

    const newPassword = (this.resetForm.value.newPassword || '').trim();
    const confirmPassword = (this.resetForm.value.confirmPassword || '').trim();

    if (newPassword !== confirmPassword) {
      this.toastr.warning('Passwords do not match.', 'Warning');
      this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    this.loading = true;
    this.errMsg = '';

    this.authService.resetPassword(newPassword).subscribe({
      next: () => {
        this.toastr.success('Password reset successfully.', 'Success');
        this.loading = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errMsg = err.userMessage || err.error?.message || 'Reset password failed';
        this.toastr.error(this.errMsg, 'Error');
        this.loading = false;
      },
    });
  }
}
