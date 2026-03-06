import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface AppThemeColor {
  name: string;
  hex: string;
}


export const AVAILABLE_COLORS: AppThemeColor[] = [
  { name: 'Sky', hex: '#38bdf8' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' }
];
@Injectable({
  providedIn: 'root',
})
export class ThemeService {

  // the current state (true = dark, false = light)
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  isDarkMode$ = this.darkModeSubject.asObservable();



  private primaryColorSubject = new BehaviorSubject<string>(AVAILABLE_COLORS[0].hex);
  primaryColor$ = this.primaryColorSubject.asObservable();

  colors = AVAILABLE_COLORS;
  constructor() {
    this.initializeTheme();
  }

  initializeTheme(): void {
    // Check local storage
    const storedTheme = localStorage.getItem('theme');

    // Check OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    //initial state
    const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);


    this.setDarkMode(isDark);

    const storedColor = localStorage.getItem('primaryColor');
    if (storedColor) {
      this.setPrimaryColor(storedColor);
    } else {
      this.setPrimaryColor(AVAILABLE_COLORS[0].hex); // اللون الافتراضي
    }

  }

  toggleTheme(): void {
    console.log("toggle theme");
    this.setDarkMode(!this.darkModeSubject.value);
  }


  private setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
  setPrimaryColor(hexColor: string): void {

    this.primaryColorSubject.next(hexColor);


    localStorage.setItem('primaryColor', hexColor);


    document.documentElement.style.setProperty('--brand-primary', hexColor);
  }
}
