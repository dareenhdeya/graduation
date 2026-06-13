import { TranslateModule } from '@ngx-translate/core';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Footer } from './shared/components/footer/footer';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [TranslateModule, RouterOutlet, Footer, NgxSpinnerModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);
  private loader = inject(NgxSpinnerService);
  loadingVideos = [
    '/images/loader/fen&jake.webm',
    '/images/loader/doraemon(1).webm',
    '/images/loader/little.webm',
    '/images/loader/doraemon(3).webm',
    '/images/loader/bears.webm',
    '/images/loader/doraemon(4).webm',
  ]
  currentVideo = this.loadingVideos[0];
  ngOnInit(): void {
    this.languageService.initLanguage();
    this.loader.spinnerObservable.subscribe((status) => {
      if (status?.show) {
        this.pickRandomVideo();
      }
    });
  }


  pickRandomVideo() {
    const randomIndex = Math.floor(Math.random() * this.loadingVideos.length);
    this.currentVideo = this.loadingVideos[randomIndex];
  }
}
