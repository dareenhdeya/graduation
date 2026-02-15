import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  role: string;
  birthDate?: string | null;
  pfpURL?: string | null;
  teaches?: string | null;
  job?: string | null;
};

type ViewProfileResponse = {
  message: string;
  data: ProfileData;
};
@Component({
  selector: 'app-profile',
  imports: [ClipboardModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private clipboard = inject(Clipboard);

  loading = true;
  error = '';
  profile: ProfileData | null = null;

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (res: ViewProfileResponse) => {
        console.log('====profile=====' + res);

        this.profile = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load profile';
        this.loading = false;
      },
    });
  }

  copyEmail(email: string | null | undefined) {
    if (!email) return;
    const ok = this.clipboard.copy(email);
    console.log('copied?', ok);
  }
}
