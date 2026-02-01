import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
type ProfileData = {
  id: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  role: string;
  pfpURL?: string | null;
};

type ViewProfileResponse = {
  message: string;
  data: ProfileData;
};
@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);

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
}
