import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

type RoleId = 0 | 1 | 2 | 3;
type GenderId = 1 | 2;

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private toastr = inject(ToastrService);

  isLoading = false;
  showPass: boolean = false;
  errMsg = '';
  fileErrMsg = '';

  selectedFile: File | null = null;

  roles: { id: RoleId; label: string }[] = [
    { id: 1, label: 'Student' },
    { id: 2, label: 'Parent' },
    { id: 3, label: 'Teacher' },
  ];

  Disability: { id: number; label: string }[] = [
    { id: 1, label: 'None' },
    { id: 2, label: 'Hearing' },
    { id: 3, label: 'Speech' },
  ];

  submitted = false;

  isInvalid(controlName: string): boolean {
    const c = this.signUpForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  avatars = [
    { id: '001-man', src: '/images/pfp/001-man.png' },
    { id: '002-cat', src: '/images/pfp/002-cat.png' },
    { id: '002-man-1', src: '/images/pfp/002-man-1.png' },
    { id: '003-man-2', src: '/images/pfp/003-man-2.png' },
    { id: '003-panda', src: '/images/pfp/003-panda.png' },
    { id: '004-boy', src: '/images/pfp/004-boy.png' },
    { id: '004-rabbit', src: '/images/pfp/004-rabbit.png' },
    { id: '005-dog', src: '/images/pfp/005-dog.png' },
    { id: '005-woman', src: '/images/pfp/005-woman.png' },
    { id: '006-girl', src: '/images/pfp/006-girl.png' },
    { id: '006-lion', src: '/images/pfp/006-lion.png' },
    { id: '007-boy', src: '/images/pfp/007-boy.png' },
    { id: '007-woman-1', src: '/images/pfp/007-woman-1.png' },
    { id: '008-bear', src: '/images/pfp/008-bear.png' },
    { id: '008-woman-2', src: '/images/pfp/008-woman-2.png' },
    { id: '009-chicken', src: '/images/pfp/009-chicken.png' },
    { id: '009-human', src: '/images/pfp/009-human.png' },
    { id: '010-girl', src: '/images/pfp/010-girl.png' },
    { id: '010-woman-3', src: '/images/pfp/010-woman-3.png' },
    { id: '011-profile', src: '/images/pfp/011-profile.png' },
    { id: '012-woman', src: '/images/pfp/012-woman.png' },
    { id: '013-meerkat', src: '/images/pfp/013-meerkat.png' },
  ];

  filePreviewUrl: string | null = null;
  showAvatarPicker = false;
  selectedAvatarSrc: string | null = null;

  get avatarPreview(): string | null {
    if (this.selectedAvatarSrc) return this.selectedAvatarSrc;
    if (this.filePreviewUrl) return this.filePreviewUrl;
    return null;
  }

  selectAvatar(src: string) {
    this.selectedAvatarSrc = src;
    this.selectedFile = null;

    if (this.filePreviewUrl) URL.revokeObjectURL(this.filePreviewUrl);
    this.filePreviewUrl = null;

    this.fileErrMsg = '';
    this.showAvatarPicker = false;
  }

  openAvatarPicker() {
    this.showAvatarPicker = true;
  }

  closeAvatarPicker() {
    this.showAvatarPicker = false;
  }

  signUpForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-])[A-Za-z\d@$!%*?&#^()_+\-]{8,}$/),
      ],
    ],
    role: [1 as any, [Validators.required]],

    Gender: ['', [Validators.required]],

    FName: ['', [Validators.required, Validators.minLength(2), Validators.pattern('^[a-zA-Zء-ي]+$')]],
    LName: ['', [Validators.required, Validators.minLength(2), Validators.pattern('^[a-zA-Zء-ي]+$')]],
    phoneNumber: ['', [Validators.required, Validators.pattern('^0[0-9]{10}$')]],
    Address: ['', [Validators.required, Validators.minLength(10)]],
    BirthDate: ['', [Validators.required]],
    Job: ['', [Validators.required,Validators.minLength(2)]],
    SubjectID: [''],
    Disability: [1 as any],
  });

  ngOnInit(): void {
    this.applyRoleRules(Number(this.signUpForm.get('role')!.value) as RoleId);

    this.signUpForm.get('role')!.valueChanges.subscribe((role) => {
      this.applyRoleRules(Number(role) as RoleId);
      this.fileErrMsg = '';
    });
  }

  private applyRoleRules(role: RoleId) {
    const jobCtrl = this.signUpForm.get('Job')!;
    const subjectCtrl = this.signUpForm.get('SubjectID')!;

    if (role == 2) {
      jobCtrl.setValidators([Validators.required]);
    } else {
      jobCtrl.clearValidators();
      jobCtrl.setValue('');
    }
    jobCtrl.updateValueAndValidity({ emitEvent: false });

    // if (role === 3) {
    //   // subjectCtrl.setValidators([Validators.required]);
    // } else {
    //   subjectCtrl.clearValidators();
    //   subjectCtrl.setValue('');
    // }
    subjectCtrl.updateValueAndValidity({ emitEvent: false });
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.selectedFile = file;
    this.fileErrMsg = '';

    this.selectedAvatarSrc = null;

    if (this.filePreviewUrl) URL.revokeObjectURL(this.filePreviewUrl);
    this.filePreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  // submit() {
  //   if (this.signUpForm.invalid) {
  //     this.signUpForm.markAllAsTouched();
  //     return;
  //   }

  //   const v = this.signUpForm.value;

  //   const role = Number(v.role) as RoleId;
  //   const gender = Number(v.Gender) as GenderId;
  //   if (![1, 2].includes(gender)) {
  //     this.signUpForm.get('Gender')?.setErrors({ required: true });
  //     return;
  //   }

  //   const hasAnyPicture = !!this.selectedFile || !!this.selectedAvatarSrc;

  //   if (role === 2 && !hasAnyPicture) {
  //     this.fileErrMsg = 'Profile picture is required for Parent.';
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.errMsg = '';
  //   this.fileErrMsg = '';

  //   const fd = new FormData();

  //   if (this.selectedFile) fd.append('file', this.selectedFile);

  //   fd.append('email', String(v.email || ''));
  //   fd.append('password', String(v.password || ''));
  //   fd.append('role', String(role));

  //   fd.append('Gender', String(gender));

  //   fd.append('FName', String(v.FName || ''));
  //   fd.append('LName', String(v.LName || ''));
  //   fd.append('phoneNumber', String(v.phoneNumber || ''));
  //   fd.append('Address', String(v.Address || ''));

  //   if (role !== 3) fd.append('Job', String(v.Job || ''));

  //   if (role === 3 && v.SubjectID) fd.append('SubjectID', String(v.SubjectID || ''));

  //   this.authService.signUp(fd).subscribe({
  //     next: () => {
  //       this.isLoading = false;
  //       this.router.navigateByUrl('/login');
  //     },
  //     error: (err) => {
  //       this.errMsg = err?.error?.Message || err?.error?.message || 'Registration failed';
  //       this.isLoading = false;
  //     },
  //   });
  // }

  async submit() {
    console.log(this.signUpForm.value);
    this.submitted = true;

    if (this.signUpForm.invalid) {
      this.toastr.warning('Please fill in all required fields correctly.', 'Warning');
      this.signUpForm.markAllAsTouched();
      return;
    }

    const v = this.signUpForm.value;
    const role = Number(v.role) as RoleId;
    const gender = Number(v.Gender) as GenderId;

    if (![1, 2].includes(gender)) {
      this.toastr.warning('Please select a gender.', 'Warning');
      this.signUpForm.get('Gender')?.setErrors({ required: true });
      return;
    }

    // const hasAnyPicture = !!this.selectedFile || !!this.selectedAvatarSrc;
    // if (role === 2 && !hasAnyPicture) {
    //   this.fileErrMsg = 'Profile picture is required for Parent.';
    //   return;
    // }

    this.isLoading = true;
    this.errMsg = '';
    this.fileErrMsg = '';

    const fd = new FormData();

    if (!this.selectedFile && this.selectedAvatarSrc) {
      const res = await fetch(this.selectedAvatarSrc);
      const blob = await res.blob();
      const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
      this.selectedFile = file;
    }

    if (this.selectedFile) fd.append('file', this.selectedFile);

    fd.append('email', String(v.email || ''));
    fd.append('password', String(v.password || ''));
    fd.append('role', String(role));
    fd.append('Gender', String(gender));
    fd.append('FName', String(v.FName || ''));
    fd.append('LName', String(v.LName || ''));
    fd.append('phoneNumber', String(v.phoneNumber || ''));
    fd.append('Address', String(v.Address || ''));
    fd.append('BirthDate', String(v.BirthDate || ''));
    fd.append('Disability', String(v.Disability || 0));

    if (role !== 3) fd.append('Job', String(v.Job || ''));
    if (role === 3 && v.SubjectID) fd.append('SubjectID', String(v.SubjectID || ''));

    this.authService.signUp(fd).subscribe({
      next: () => {
        this.toastr.success('Registration successful. Please login.', 'Success');
        this.isLoading = false;
        this.router.navigateByUrl('/login');
      },
      error: (err: HttpErrorResponse) => {
        // this.errMsg = err?.error?.Message || err?.error?.message || 'Registration failed';
        this.isLoading = false;
        // console.log(this.errMsg);
        console.log(err.error);
        const e: any = err.error;
        const errorsObj = e?.errors;
        const firstField = errorsObj ? Object.keys(errorsObj)[0] : null;
        const firstMsg =
          (firstField && Array.isArray(errorsObj[firstField]) && errorsObj[firstField][0]) ||
          e?.message ||
          e?.title ||
          'Registration failed';

        this.errMsg = firstMsg;
        this.toastr.error(this.errMsg, 'Error');
      },
    });
  }

  ngOnDestroy() {
    if (this.filePreviewUrl) URL.revokeObjectURL(this.filePreviewUrl);
  }
}
