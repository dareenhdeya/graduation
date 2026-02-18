import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ViewProfileResponse, ProfileData } from '../../core/auth/interfaces/IProfileResponse';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  loadingProfile = true;
  loadingEdit = false;
  error = '';
  editError = '';
  profile: ProfileData | null = null;
  showEditModal = false;
  imagePreview: string | null = null;

  showChangePassModal = false;
  loadingChangePass = false;
  changePassError = '';
  showOldPass = false;
  showNewPass = false;

  changePassForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-])[A-Za-z\d@$!%*?&#^()_+\-]{8,}$/),
      ],
    ],
  });

  editForm = this.fb.group({
    fName: ['', [ Validators.minLength(2), Validators.pattern('^[a-zA-Zء-ي]+$')]],
    lName: ['', [ Validators.minLength(2), Validators.pattern('^[a-zA-Zء-ي]+$')]],
    email: ['', [ Validators.email]],
    address: ['', [Validators.minLength(10)]],
    phone: ['', [Validators.pattern('^0[0-9]{10}$')]],
    job: ['', [Validators.minLength(2)]],
    image: [null as File | null],
  });

  showAvatarPicker = false;
  selectedFile: File | null = null;
  selectedAvatarSrc: string | null = null;
  filePreviewUrl: string | null = null;

  get avatarPreview(): string | null {
    if (this.selectedAvatarSrc) return this.selectedAvatarSrc;
    if (this.filePreviewUrl) return this.filePreviewUrl;
    return null;
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

  ngOnInit() {
    // this.get_profile();
    this.authService.profile$.subscribe((data) => {
      if (!data) return;

      console.log('====profile=====', data);
      this.profile = data;
      this.loadingProfile = false;
    });

    this.authService.refreshProfile();
  }

  // get_profile() {
  //   this.authService.getProfile().subscribe({
  //     next: (res: ViewProfileResponse) => {
  //       console.log('====profile=====', res);

  //       this.profile = res.data;
  //       this.loadingProfile = false;
  //     },
  //     error: (err) => {
  //       this.error = err?.error?.message || 'Failed to load profile';
  //       this.loadingProfile = false;
  //     },
  //   });
  // }

  openEdit() {
    if (!this.profile) return;
    this.imagePreview = this.profile.pfpURL || null;

    this.editForm.patchValue({
      fName: this.profile.fName,
      lName: this.profile.lName,
      email: this.profile.email,
      address: this.profile.address,
      phone: this.profile.phone,
      job: this.profile.job,
    });

    this.showEditModal = true;
  }

  openAvatarPicker() {
    this.showAvatarPicker = true;
  }

  closeAvatarPicker() {
    this.showAvatarPicker = false;
  }

  selectAvatar(src: string) {
    this.imagePreview = src;

    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'avatar.png', { type: blob.type });
        this.editForm.patchValue({ image: file });
        this.showAvatarPicker = false;
      })
      .catch((err) => {
        console.error('Error setting avatar:', err);
        this.showAvatarPicker = false;
      });
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.editForm.patchValue({ image: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  get f() {
    return this.editForm.controls;
  }

  submitEdit() {
    if (this.editForm.invalid) {
      console.log('invalidddddddddddd');
      return;
    }

    this.loadingEdit = true;
    this.error = '';

    const v = this.editForm.value;
    const fd = new FormData();

    const keys = ['fName', 'lName', 'email', 'address', 'phone', 'birthDate', 'teaches', 'job'];
    keys.forEach((key) => {
      const val = (v as any)[key];
      if (val !== null && val !== undefined && val !== '') {
        fd.append(key, val);
      }
    });

    if (v.image) {
      fd.append('image', v.image);
    }

    this.authService.editProfile(fd).subscribe({
      next: (res) => {
        console.log('editttt', res);

        this.showEditModal = false;
        this.authService.refreshProfile();
        this.imagePreview = null;
        this.editError = '';
        this.loadingEdit = false;
      },
      error: (err) => {
        console.log('edit errrrrrrrr', err);
        // this.editError = err?.error?.title || 'Failed to update profile';
        const validationErrors = err?.error?.errors;

        if (validationErrors) {
          this.editError = Object.values(validationErrors).flat().join(', ');
        } else {
          this.editError = err?.error?.title || 'Failed to update profile';
        }
        this.loadingEdit = false;
      },
    });
  }

  changepass() {
    console.log('change');

    this.changePassForm.reset();
    this.changePassError = '';
    this.showChangePassModal = true;
  }

  submitChangePassword() {
    if (this.changePassForm.invalid) return;

    this.loadingChangePass = true;
    this.changePassError = '';

    const payload = this.changePassForm.value as {
      oldPassword: string;
      newPassword: string;
    };

    this.authService.changePassword(payload).subscribe({
      next: () => {
        console.log('save change');

        this.showChangePassModal = false;
        this.loadingChangePass = false;
      },
      error: (err) => {
        this.changePassError = err?.error?.message || 'Failed to change password';
        this.loadingChangePass = false;
      },
    });
  }
}
