import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal, DOCUMENT } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly SUPPORTED_LANGS: AppLanguage[] = ['en', 'ar'];
  readonly DEFAULT_LANG: AppLanguage = 'en';
  private readonly STORAGE_KEY = 'app_lang';

  /** Signal holding the currently active language code */
  readonly currentLang = signal<AppLanguage>(this.DEFAULT_LANG);

  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.translate.addLangs(this.SUPPORTED_LANGS);
    this.translate.setDefaultLang(this.DEFAULT_LANG);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Call once in AppComponent.ngOnInit().
   * Reads the persisted preference (or defaults to 'en') and activates it.
   */
  initLanguage(): void {
    let lang: AppLanguage = this.DEFAULT_LANG;
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.STORAGE_KEY) as AppLanguage | null;
      if (saved && this.SUPPORTED_LANGS.includes(saved)) {
        lang = saved;
      }
    }
    this.setLanguage(lang);
  }

  /**
   * Switch to the given language, persist the choice, and update the DOM.
   */
  setLanguage(lang: AppLanguage): void {
    if (!this.SUPPORTED_LANGS.includes(lang)) return;

    this.translate.use(lang);
    this.currentLang.set(lang);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }

    // Update <html> dir and lang attributes for RTL/LTR layout
    const html = this.document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  /** Toggle between 'en' and 'ar'. */
  toggleLanguage(): void {
    const next: AppLanguage = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(next);
  }

  /** Returns true when the current language is Arabic (RTL). */
  get isRtl(): boolean {
    return this.currentLang() === 'ar';
  }
}
