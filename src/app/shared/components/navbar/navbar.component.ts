import { AuthService } from './../../../core/auth/services/auth.service';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  firstLetter: string = 'D';
  // *Inject Services
  private readonly authService = inject(AuthService);

  constructor() {
    // const username = localStorage.getItem("username") || "D"
    // this.firstLetter = username.charAt(0).toUpperCase()
  }

  logOut() {
    this.authService.logoutAndRedirect();
  }
}
