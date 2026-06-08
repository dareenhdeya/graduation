import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, AppLanguage } from '../../../core/services/language.service';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      id="lang-switcher-btn"
      (click)="langService.toggleLanguage()"
      [attr.aria-label]="(langService.currentLang$ | async) === 'en' ? 'Switch to Arabic' : 'Switch to English'"
      class="lang-switcher-btn"
      title="Toggle Language"
    >
      <!-- Globe icon -->
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>

      <span class="lang-label">
        {{ (langService.currentLang$ | async) === 'en' ? 'العربية' : 'English' }}
      </span>
    </button>
  `,
  styles: [`
    .lang-switcher-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      border: 1.5px solid var(--brand-primary, #38bdf8);
      background: transparent;
      color: var(--brand-primary, #38bdf8);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
      letter-spacing: 0.03em;
    }

    .lang-switcher-btn:hover {
      background: var(--brand-primary, #38bdf8);
      color: #fff;
      transform: translateY(-1px);
    }

    .lang-switcher-btn:active {
      transform: translateY(0);
    }

    .lang-label {
      font-family: inherit;
    }
  `],
})
export class LangSwitcherComponent {
  protected langService = inject(LanguageService);
}
