import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgotpass',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './forgotpass.component.html',
  styleUrls: ['./forgotpass.component.css'],
})
export class ForgotpassComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);

  currentStep = 1;
  loading = false;
  errMsg = '';

  steps = [
    { id: 1, label: 'Forgot Password' },
    { id: 2, label: 'Verify OTP' },
    { id: 3, label: 'Reset Password' },
  ];

  emailForm = this.fb.group({
    emailOrUserName: ['', Validators.required],
  });

  otpForm = this.fb.group({
    otp: ['', Validators.required],
  });

  resetForm = this.fb.group({
    newPassword: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });

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
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errMsg = '';

    const user = (this.emailForm.value.emailOrUserName || '').trim();
    this.savedUser = user;

    this.authService.requestPasswordChange(user).subscribe({
      next: () => {
        this.currentStep = 2;
        this.loading = false;
      },
      error: (err) => {
        this.errMsg = err.userMessage || err.error?.message || 'Failed to send OTP';
        this.loading = false;
      },
    });
  }

  submitOtp() {
    if (this.otpForm.invalid) {
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
        this.otpVerified = true;
        this.currentStep = 3;
        this.loading = false;
      },
      error: (err) => {
        this.errMsg = err.userMessage || err.error?.message || 'Invalid OTP';
        this.loading = false;
      },
    });
  }

  submitReset() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const newPassword = (this.resetForm.value.newPassword || '').trim();
    const confirmPassword = (this.resetForm.value.confirmPassword || '').trim();

    if (newPassword !== confirmPassword) {
      this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    this.loading = true;
    this.errMsg = '';

    this.authService.resetPassword(newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errMsg = err.userMessage || err.error?.message || 'Reset password failed';
        this.loading = false;
      },
    });
  }
}
