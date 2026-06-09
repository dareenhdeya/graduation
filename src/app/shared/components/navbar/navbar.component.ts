import { Router, RouterLink } from '@angular/router';
import { AuthService } from './../../../core/auth/services/auth.service';
import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';
import { NavigationStateService } from '../../../core/auth/services/navigation-state.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  // firstLetter: string = 'D';

  // private readonly authService = inject(AuthService);
  // private readonly router = inject(Router);

  // ngOnInit() {
  //   this.authService.getProfile().subscribe({
  //     next: (res: any) => {
  //       const name = res?.data?.name ;
  //       this.firstLetter = name.charAt(0).toUpperCase();
  //     },
  //   });
  // }

  // goToProfile() {
  //   this.router.navigateByUrl('/profile');
  // }

  // logOut() {
  //   this.authService.logoutAndRedirect();
  // }

  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navState = inject(NavigationStateService);

  firstLetter: string = 'U';
  profileImage: string | null = null;
  isMenuOpen = false; //* For mobile menu toggle
  role: string | null = null;
  // ngOnInit() {
  //   this.authService.getProfile().subscribe({
  //     next: (res: any) => {
  //       console.log('nav', res);

  //       const data = res?.data;

  //       if (data?.fName) {
  //         this.firstLetter = data.fName.charAt(0).toUpperCase();
  //       }

  //       if (data?.pfpURL) {
  //         this.profileImage = data.pfpURL;
  //       }
  //     },
  //   });
  // }

  ngOnInit() {
    this.authService.profile$.subscribe((data) => {
      if (!data) return;

      this.firstLetter = data.fName?.charAt(0).toUpperCase() ?? 'U';
      this.profileImage = data.pfpURL ?? null;
    });

    this.authService.role$.subscribe((role) => {
      this.role = role;
    });

    this.authService.refreshProfile();
  }

  getProgressRoute(): string {
    switch (this.role) {
      case 'Student':
        return '/student/progress';
      case 'Teacher':
        return this.navState.lastTeacherSid
          ? `/teacher/subject/${this.navState.lastTeacherSid}/students`
          : '/teacher/dashboard';
      case 'Admin':
        return '/admin/dashboard';
      case 'Parent':
        return '/parent/view-children';
      default:
        return '/home';
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  logOut() {
    this.authService.logoutAndRedirect();
  }
}
