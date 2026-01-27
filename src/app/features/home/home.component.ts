import { Component } from '@angular/core';
import { LettersComponent } from '../../shared/components/letters/letters.component';

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
  imports: [LettersComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
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
