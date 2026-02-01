import { Component, inject, OnInit } from '@angular/core';
import { LettersComponent } from '../../shared/components/letters/letters.component';
import { RoleActionsComponent } from '../role-actions/role-actions.component';
import { AuthService } from '../../core/auth/services/auth.service';

type BgLetter = {
  id: number;
  char: string;
  left: number;
  top: number;
  size: number;
  dur: number;
  delay: number;
  color: string;
};

@Component({
  selector: 'app-home',
  imports: [LettersComponent, RoleActionsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private auth = inject(AuthService);

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (res) => {
        console.log('=======profile:==========', res);
        const role = res.data.role;
        this.auth.setRole(role);
      },
      error: (err) => console.error('Failed to get profile', err),
    });
  }

  bgLetters: BgLetter[] = [];

  constructor() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const count = 40;

    const pastel = [
      '#F59E0B',
      '#EF4444',
      '#22C55E',
      '#3B82F6',
      '#A855F7',
      '#EC4899',
      '#06B6D4',
      '#10B981',
    ];

    for (let i = 0; i < count; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const color = pastel[Math.floor(Math.random() * pastel.length)];

      this.bgLetters.push({
        id: i,
        char,
        left: Math.floor(Math.random() * 100),
        top: Math.floor(Math.random() * 100),
        size: 12 + Math.floor(Math.random() * 16),
        dur: 6 + Math.floor(Math.random() * 8),
        delay: Math.floor(Math.random() * 6),
        color,
      });
    }
  }
}
