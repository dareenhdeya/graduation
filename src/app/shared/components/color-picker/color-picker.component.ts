import { CommonModule } from '@angular/common';
import { ThemeService } from './../../../core/services/theme.service';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.css',
})
export class ColorPickerComponent {
  themeService = inject(ThemeService);


  isOpen = false;

  togglePanel() {
    this.isOpen = !this.isOpen;
  }
}
