import { isPlatformBrowser } from '@angular/common';
import { inject, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  /** The two supported language codes */
  readonly SUPPORTED_LANGS: AppLanguage[] = ['en', 'ar'];
  readonly DEFAULT_LANG: AppLanguage = 'en';

  private _currentLang = new BehaviorSubject<AppLanguage>(this.DEFAULT_LANG);
  /** Observable stream of the active language code */
  currentLang$ = this._currentLang.asObservable();
  private translate = inject(TranslateService);


  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Register supported languages and set the fallback (v17 API)
    this.translate.addLangs(this.SUPPORTED_LANGS);
    this.translate.setFallbackLang(this.DEFAULT_LANG); // replaces deprecated setDefaultLang()

    // Only read localStorage / touch the DOM in a browser context.
    // The SSR server has neither localStorage nor a real document.
    if (isPlatformBrowser(this.platformId)) {
      this.initLanguage();
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Switch to the given language and persist the choice. */
  switchLanguage(lang: AppLanguage): void {
    if (!this.SUPPORTED_LANGS.includes(lang)) return;
    this.translate.use(lang);
    this._currentLang.next(lang);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('appLang', lang);
      this.applyDocumentAttributes(lang);
    }
  }

  /** Toggle between 'en' and 'ar'. */
  toggleLanguage(): void {
    const next = this._currentLang.value === 'en' ? 'ar' : 'en';
    this.switchLanguage(next);
  }

  /** Returns true when the current language is Arabic (RTL). */
  get isRtl(): boolean {
    return this._currentLang.value === 'ar';
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Read the persisted preference (or fall back to DEFAULT_LANG)
   * and activate the language at start-up.
   */
  private initLanguage(): void {
    const saved = localStorage.getItem('appLang') as AppLanguage | null;
    const lang: AppLanguage =
      saved && this.SUPPORTED_LANGS.includes(saved) ? saved : this.DEFAULT_LANG;

    this.translate.use(lang);
    this._currentLang.next(lang);
    this.applyDocumentAttributes(lang);
  }

  /**
   * Flip the `<html>` element's `dir` and `lang` attributes.
   * This single change is enough for Tailwind CSS's RTL variant
   * (driven by `dir="rtl"` on <html>) to automatically mirror the layout.
   */
  private applyDocumentAttributes(lang: AppLanguage): void {
    const html = document.documentElement; // the <html> element
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
}
