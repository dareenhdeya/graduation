import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { interval, take } from 'rxjs';
import { IRegisterResponse } from '../interfaces/IRegisterResponse';
import { AuthService } from '../services/auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  //Inject Services
  private readonly authSirvec = inject(AuthService);
  private router = inject(Router);

  // Variables
  errorMessage?: string; //for error response message
  successMessage?: string; //for success response message
  isLoading: boolean = false; // track the request
  timer: number = 3;
  ngOnInit() {
    // this.registerForm.setValue({
    //   name: "mohammed",
    //   email: "mohamed20@gmail.com",
    //   password: "123456789@Ab",
    //   rePassword: "123456789@Ab",
    //   phone: "01091215398",
    // })
  }

  registerForm = new FormGroup(
    {
      fName: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
      ]),

      lName: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
      ]),

      email: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ]),

      password: new FormControl('', [Validators.required]),

      rePassword: new FormControl('', [Validators.required]),

      phoneNumber: new FormControl('', [
        Validators.required,
        Validators.pattern(/^01[0-2,5][0-9]{8}$/),
      ]),

      role: new FormControl(2, [Validators.required]), // Assuming default role is '2' (Parent)

      address: new FormControl('', [Validators.required]), // Added required for 'address'

      job: new FormControl(''),
    },
    {
      validators: this.passMissMatch,
    }
  );
  onSubmit() {
    console.log(this.registerForm);
    if (this.registerForm.valid) {
      this.handleBeforeSubmit();

      const userData = this.registerForm.value;
      this.authSirvec.signUp(userData).subscribe({
        next: (response) => {
          this.handleAfterSucces(response);
        },
        error: (err: HttpErrorResponse) => {
          this.handleErrorResponse(err);
        },
      });
    }
    console.log(this.registerForm.value);
  }
  handleBeforeSubmit(): void {
    this.registerForm.markAllAsTouched();
    this.errorMessage = undefined;
    this.isLoading = true;
  }
  handleAfterSucces(response: IRegisterResponse): void {
    this.isLoading = false;
    this.errorMessage = undefined;
    console.log(response);
    console.log('after success');
    this.successMessage = response.message;
    this.registerForm.reset();
    interval(1000)
      .pipe(take(3))
      .subscribe(() => {
        console.log('interval');
        this.timer--;
        if (this.timer === 0) this.redirectTo('/login');
      });
  }

  handleErrorResponse(error: HttpErrorResponse) {
    console.log(error.error);
    this.errorMessage = error.error.message;
    this.isLoading = false;
  }
  redirectTo(url: string) {
    this.router.navigateByUrl(url);
  }
  passMissMatch(FormGroup: any) {
    return FormGroup.get('rePassword').value === FormGroup.get('password').value
      ? null
      : { missMatch: true };
  }
}
