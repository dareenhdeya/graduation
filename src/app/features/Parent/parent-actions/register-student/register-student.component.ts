import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ParentServiceService } from '../../services/parent-service.service';
import { ToastrService } from 'ngx-toastr';

type GenderId = 1 | 2;

@Component({
  selector: 'app-register-student',
  standalone: true,
  imports: [ReactiveFormsModule], // RouterLink not needed if inside parent dashboard
  templateUrl: './register-student.component.html',
  styleUrl: './register-student.component.css',
})
export class RegisterStudentComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly parentService = inject(ParentServiceService);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);

  isLoading = false;
  showPass: boolean = false;
  errMsg = '';
  fileErrMsg = '';

  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  showAvatarPicker = false;
  selectedAvatarSrc: string | null = null;

  // Dropdown Data
  Disability: { id: number; label: string }[] = [
    { id: 0, label: 'None' },
    { id: 1, label: 'Hearing' },
    { id: 2, label: 'Speech' },
  ];

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

  // Logic to determine what image to show
  get avatarPreview(): string | null {
    if (this.selectedAvatarSrc) return this.selectedAvatarSrc;
    if (this.filePreviewUrl) return this.filePreviewUrl;
    return null;
  }

  // Form definition - Removed Role, Job, SubjectID
  signUpForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)],
    ],
    Gender: ['', [Validators.required]],
    FName: ['', [Validators.required]],
    LName: ['', [Validators.required]],
    Address: ['', [Validators.required]],
    BirthDate: ['', [Validators.required]], // Made required for student
    Disability: [0 as any],
  });

  // --- Avatar / File Logic ---
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

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;
    this.fileErrMsg = '';
    this.selectedAvatarSrc = null;
    if (this.filePreviewUrl) URL.revokeObjectURL(this.filePreviewUrl);
    this.filePreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  // --- Submit Logic ---
  async submit() {
    if (this.signUpForm.invalid) {
      this.toastrService.warning('Please fill in all required fields correctly.', 'Warning');
      this.signUpForm.markAllAsTouched();
      return;
    }

    const v = this.signUpForm.value;
    const gender = Number(v.Gender) as GenderId;

    if (![1, 2].includes(gender)) {
      this.signUpForm.get('Gender')?.setErrors({ required: true });
      return;
    }

    this.isLoading = true;
    this.errMsg = '';
    this.fileErrMsg = '';

    // Convert Avatar URL to File object if no manual upload
    if (!this.selectedFile && this.selectedAvatarSrc) {
      try {
        const res = await fetch(this.selectedAvatarSrc);
        const blob = await res.blob();
        this.selectedFile = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
      } catch (e) {
        console.error('Error converting avatar to file', e);
      }
    }

    const fd = new FormData();
    if (this.selectedFile) fd.append('file', this.selectedFile);

    // Append Standard Fields
    fd.append('email', String(v.email || ''));
    fd.append('password', String(v.password || ''));
    fd.append('role', '1'); // <--- HARDCODED STUDENT ROLE
    fd.append('Gender', String(gender));
    fd.append('FName', String(v.FName || ''));
    fd.append('LName', String(v.LName || ''));
    fd.append('Address', String(v.Address || ''));
    fd.append('BirthDate', String(v.BirthDate || ''));
    fd.append('Disability', String(v.Disability || 0));

    // Send to ParentService (Assuming registerStudent or similar method exists)
    // If your service method is still generic, use that.
    this.parentService.registerStudent(fd).subscribe({
      next: () => {
        this.isLoading = false;

        this.toastrService.success('Student registered successfully');

        setTimeout(() => {
          this.router.navigateByUrl('/parent/dashboard');
        }, 1000);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        const e: any = err.error;
        const errorsObj = e?.errors;
        const firstField = errorsObj ? Object.keys(errorsObj)[0] : null;
        const firstMsg =
          (firstField && Array.isArray(errorsObj[firstField]) && errorsObj[firstField][0]) ||
          e?.message ||
          e?.title ||
          'Registration failed';

        this.errMsg = firstMsg;
        this.toastrService.error(this.errMsg, 'Error');
      },
    });
  }

  ngOnDestroy() {
    if (this.filePreviewUrl) URL.revokeObjectURL(this.filePreviewUrl);
  }
}
