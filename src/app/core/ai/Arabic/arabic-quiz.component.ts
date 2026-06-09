import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { CelebrationService } from '../celebration.service';

type QuizState = 'waiting' | 'correct' | 'finished';

interface ArabicLetter {
  name: string;
  arabic: string;
}

@Component({
  selector: 'app-arabic-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arabic-quiz.component.html',
  styleUrls: ['./arabic-quiz.component.css'],
})
export class ArabicQuizComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() aiLetters?: Record<string, number>; // e.g., { 'ا': 2, 'ب': 3 }
  @Output() scoreSubmitted = new EventEmitter<number>();

  returnUrl?: string;
  exerciseIndex?: number;

  readonly Math = Math;
  totalRounds = 5;
  readonly FRAMES_TO_CONFIRM = 8;
  readonly SESSION = 'ar-' + Math.random().toString(36).slice(2);

  readonly LETTERS: ArabicLetter[] = [
    { name: 'alef', arabic: 'ا' },
    { name: 'ba', arabic: 'ب' },
    { name: 'ta', arabic: 'ت' },
    { name: 'thaa', arabic: 'ث' },
    { name: 'jeem', arabic: 'ج' },
    { name: 'haa', arabic: 'ح' },
    { name: 'khaa', arabic: 'خ' },
    { name: 'dal', arabic: 'د' },
    { name: 'thal', arabic: 'ذ' },
    { name: 'ra', arabic: 'ر' },
    { name: 'zay', arabic: 'ز' },
    { name: 'seen', arabic: 'س' },
    { name: 'sheen', arabic: 'ش' },
    { name: 'saad', arabic: 'ص' },
    { name: 'dhad', arabic: 'ض' },
    { name: 'taa', arabic: 'ط' },
    { name: 'dha', arabic: 'ظ' },
    { name: 'ain', arabic: 'ع' },
    { name: 'ghain', arabic: 'غ' },
    { name: 'fa', arabic: 'ف' },
    { name: 'gaaf', arabic: 'ق' },
    { name: 'kaaf', arabic: 'ك' },
    { name: 'laam', arabic: 'ل' },
    { name: 'meem', arabic: 'م' },
    { name: 'noon', arabic: 'ن' },
    { name: 'ha', arabic: 'ه' },
    { name: 'waw', arabic: 'و' },
    { name: 'ya', arabic: 'ي' },
    { name: 'ta_marbuta', arabic: 'ة' },
  ];

  // Filtered letters based on exercise configuration
  // private allowedLetters: ArabicLetter[] = [];
  private exerciseQueue: ArabicLetter[] = [];

  // // no repetition
  // private usedLetters: Set<string> = new Set();

  currentLetter!: ArabicLetter;
  score = 0;
  round = 0;
  state: QuizState = 'waiting';
  prediction = '';
  confidence = 0;
  correctStreak = 0;
  lastLandmarks: number[] = [];

  private sending = false;
  private hands!: Hands;
  private stream!: MediaStream;
  private animFrame = 0;
  private lastResults?: Results;

  constructor(
    private http: HttpClient,
    private celebration: CelebrationService,
    private router: Router
  ) {}

  ngOnInit() {
    const state = history.state ?? {};
    this.aiLetters = state.aiLetters ?? this.aiLetters;
    this.returnUrl = state.returnUrl;
    this.exerciseIndex = state.exerciseIndex;
    this.buildQueue();
  }

  ngAfterViewInit() {
    this.initHands();
    this.initCamera();
    if (this.exerciseQueue.length > 0) {
      this.pickLetter();
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrame);
    this.stream?.getTracks().forEach((t) => t.stop());
  }

  private initHands() {
    this.hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    this.hands.onResults((res: Results) => {
      this.lastResults = res;
      this.processLandmarks(res);
    });
  }

  private initCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        this.stream = stream;
        const v = this.video.nativeElement;
        v.srcObject = stream;
        v.onloadedmetadata = () => {
          v.play();
          this.startLoop();
        };
      })
      .catch((err) => console.error('Camera error:', err));
  }

  private startLoop() {
    const loop = async () => {
      const v = this.video.nativeElement;
      if (v.readyState >= 2) await this.hands.send({ image: v });
      this.draw();
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  private draw() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const v = this.video.nativeElement;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1);
    ctx.drawImage(v, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (this.lastResults?.multiHandLandmarks?.length) {
      for (const lm of this.lastResults.multiHandLandmarks) {
        const flipped = lm.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
        drawConnectors(ctx, flipped, HAND_CONNECTIONS, {
          color: this.state === 'correct' ? '#00ff88' : '#7c6ef7',
          lineWidth: 2,
        });
        drawLandmarks(ctx, flipped, {
          color: this.state === 'correct' ? '#00ff88' : '#fff',
          lineWidth: 1,
        });
      }
    }

    const ok = this.state === 'correct';
    ctx.strokeStyle = ok ? '#00ff88' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(200, 100, 240, 280);
    ctx.setLineDash([]);

    const corners = [
      [200, 100],
      [440, 100],
      [200, 380],
      [440, 380],
    ] as [number, number][];
    ctx.strokeStyle = ok ? '#00ff88' : '#7c6ef7';
    ctx.lineWidth = 5;
    for (const [cx, cy] of corners) {
      const dx = cx === 200 ? 1 : -1;
      const dy = cy === 100 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + dx * 20, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * 20);
      ctx.stroke();
    }
  }

  private processLandmarks(results: Results) {
    if (this.state === 'finished' || this.state === 'correct') return;

    if (!results.multiHandLandmarks?.length) {
      this.correctStreak = 0;
      this.lastLandmarks = [];
      this.prediction = '';
      return;
    }

    const lm = results.multiHandLandmarks[0];
    const wx = lm[0].x,
      wy = lm[0].y;
    const features: number[] = [];

    for (const p of lm) {
      features.push(
        parseFloat((p.x - wx).toFixed(6)),
        parseFloat((p.y - wy).toFixed(6)),
        parseFloat(p.z.toFixed(6))
      );
    }

    if (features.length !== 63 || this.sending) return;
    this.lastLandmarks = features;
    this.sending = true;

    this.http
      .post<any>('http://127.0.0.1:8000/predict/arabic', {
        landmarks: features,
        session_id: this.SESSION,
      })
      .subscribe({
        next: (res) => {
          this.sending = false;
          this.confidence = res.confidence;

          const LETTER_MAP: Record<string, string> = {
            aleff: 'ا',
            ba: 'ب',
            taa: 'ت',
            thaa: 'ث',
            jeem: 'ج',
            haa: 'ح',
            khaa: 'خ',
            dal: 'د',
            thal: 'ذ',
            ra: 'ر',
            zay: 'ز',
            seen: 'س',
            sheen: 'ش',
            saad: 'ص',
            dhad: 'ض',
            ta: 'ط',
            dha: 'ظ',
            ain: 'ع',
            ghain: 'غ',
            fa: 'ف',
            gaaf: 'ق',
            kaaf: 'ك',
            laam: 'ل',
            meem: 'م',
            nun: 'ن',
            ha: 'ه',
            waw: 'و',
            ya: 'ي',
            ta_marbuta: 'ة',
          };

          if (res.letter === '...') {
            this.prediction = '';
            this.correctStreak = 0;
            return;
          }

          this.prediction = LETTER_MAP[res.letter_name] ?? res.letter ?? res.letter_name;

          const matched =
            res.letter_name === this.currentLetter.name || res.letter === this.currentLetter.arabic;

          if (matched) {
            this.correctStreak++;
            if (this.correctStreak >= this.FRAMES_TO_CONFIRM) this.handleCorrect();
          } else {
            this.correctStreak = 0;
          }
        },
        error: () => {
          this.sending = false;
        },
      });
  }

  private handleCorrect() {
    if (this.state === 'correct') return;
    this.state = 'correct';
    this.score++;
    this.round++;

    this.celebration.playClap();
    this.celebration.launchConfetti(this.confettiCanvas.nativeElement);

    setTimeout(() => {
      if (this.round >= this.totalRounds) {
        this.state = 'finished';
        this.emitScore();
      } else {
        this.pickLetter();
      }
    }, 1800);
  }

  private emitScore() {
    this.scoreSubmitted.emit(this.score);
  }

  returnToQuiz() {
    if (!this.returnUrl) return;
    this.router.navigateByUrl(this.returnUrl, {
      state: { aiScore: this.score, exerciseIndex: this.exerciseIndex },
    });
  }

  pickLetter() {

    if (this.exerciseQueue.length === 0) {

        this.state = 'finished';

        this.emitScore();

        return;
    }

    this.currentLetter = { ...this.exerciseQueue.shift()! };

    this.correctStreak = 0;

    this.prediction = '';

    this.state = 'waiting';
  }

  skipLetter() {
    if (this.state === 'finished') return;
    this.round++;
    if (this.round >= this.totalRounds) {
      this.state = 'finished';
      this.emitScore();
    } else this.pickLetter();
  }

 restart() {
  this.score = 0;
  this.round = 0;
  this.correctStreak = 0;
  this.prediction = '';
  this.state = 'waiting';

  this.buildQueue();   // 🔥 IMPORTANT
  this.pickLetter();
  }



  private normalizeAiLetters(raw: any): Record<string, number> {
    const src = raw ?? {};
    if (Array.isArray(src)) {
      return Object.fromEntries(
        src.map((item: any) => [
          item.key ?? item.Key,
          Number(item.value ?? item.Value ?? 1),
        ])
      );
    }

    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(src)) {
      if (value != null && typeof value === 'object') {
        const item = value as { key?: string; Key?: string; value?: number; Value?: number };
        const letter = item.key ?? item.Key ?? key;
        result[letter] = Number(item.value ?? item.Value ?? 1);
      } else {
        result[key] = Number(value);
      }
    }
    return result;
  }

  /** Map teacher/UI variants (e.g. أ) to quiz letter forms (e.g. ا). */
  private resolveLetter(key: string): ArabicLetter | undefined {
    const aliases: Record<string, string> = {
      'أ': 'ا',
      'إ': 'ا',
      'آ': 'ا',
    };
    const arabic = aliases[key] ?? key;

    return this.LETTERS.find(
      (l) => l.arabic === arabic || l.arabic === key || l.name === key
    );
  }

  private buildQueue() {
    this.exerciseQueue = [];

    if (!this.aiLetters) return;

    const letters = this.normalizeAiLetters(this.aiLetters);

    for (const [letter, rounds] of Object.entries(letters)) {
      const found = this.resolveLetter(letter);
      const count = Math.max(0, Number(rounds) || 0);

      if (found && count > 0) {
        for (let i = 0; i < count; i++) {
          this.exerciseQueue.push(found);
        }
      }
    }

    this.shuffleQueue();
    this.totalRounds = this.exerciseQueue.length || 5;
  }

  private shuffleQueue() {
    for (let i = this.exerciseQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.exerciseQueue[i], this.exerciseQueue[j]] = [
        this.exerciseQueue[j],
        this.exerciseQueue[i],
      ];
    }
  }

  get TOTAL_ROUNDS() {
    return this.totalRounds;
  }

  get progressPercent() {
    if (this.state === 'finished') return 100;
    return Math.round(((this.round + 1) / this.totalRounds) * 100);
  }
  get confidencePercent() {
    return Math.round(this.confidence * 100);
  }
  get streakPercent() {
    return Math.round((this.correctStreak / this.FRAMES_TO_CONFIRM) * 100);
  }
}
