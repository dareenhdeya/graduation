import { Router, RouterLink } from '@angular/router';
import { AuthService } from './../../../core/auth/services/auth.service';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
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
  firstLetter: string = 'U';
  profileImage: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  isMenuOpen = false; //* For mobile menu toggle

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
    this.authService.profile$.subscribe(data => {
      if (!data) return;
  
      this.firstLetter = data.fName?.charAt(0).toUpperCase() ?? 'U';
      this.profileImage = data.pfpURL ?? null;
    });
  
    this.authService.refreshProfile(); // initial load
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
