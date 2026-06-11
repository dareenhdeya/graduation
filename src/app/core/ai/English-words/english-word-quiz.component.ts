import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { CelebrationService } from '../celebration.service';

type WordState = 'signing' | 'correct' | 'finished';

@Component({
  selector: 'app-english-word-quiz',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './english-word-quiz.component.html',
  styleUrls: ['./english-word-quiz.component.css'],
})
export class EnglishWordQuizComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() aiLetters?: Record<string, number>;
  @Output() scoreSubmitted = new EventEmitter<number>();

  returnUrl?: string;
  exerciseIndex?: number;

  readonly Math = Math;
  readonly API = 'http://127.0.0.1:8000';
  readonly SESSION = 'en-' + Math.random().toString(36).slice(2);
  totalWords = 5;
  readonly FRAMES_NEEDED = 8;

  private exerciseQueue: string[] = [];

  words: string[] = [];
  currentWord: string = '';
  letterIndex: number = 0;
  score: number = 0;
  wordsDone: number = 0;
  state: WordState = 'signing';
  prediction: string = '';
  confidence: number = 0;
  correctStreak: number = 0;
  lastLandmarks: number[] = [];

  private sending = false;
  private hands!: Hands;
  private stream!: MediaStream;
  private animFrame = 0;

  constructor(private http: HttpClient, private celebration: CelebrationService, private router: Router) { }

  ngOnInit() {
    const state = history.state ?? {};
    this.aiLetters = state.aiLetters ?? this.aiLetters;
    console.log('EnglishWordQuizComponent aiLetters:', this.aiLetters);
    this.returnUrl = state.returnUrl;
    this.exerciseIndex = state.exerciseIndex;
    this.buildQueue();
  }

  ngAfterViewInit() {
    this.initMediaPipe();
    if (this.exerciseQueue.length > 0) {
      this.pickWord();
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrame);
    this.stream?.getTracks().forEach((t) => t.stop());
  }

  private buildQueue() {
    this.exerciseQueue = [];
    if (!this.aiLetters) return;

    for (const [word, rounds] of Object.entries(this.aiLetters)) {
      const upper = word.toUpperCase();
      // user requested 1 round per word coming from AI_WORD
      for (let i = 0; i < (rounds as number); i++) {
        this.exerciseQueue.push(upper);
      }
    }
    console.log('Generated exerciseQueue:', this.exerciseQueue);
    this.totalWords = this.exerciseQueue.length || 5;
  }

  private pickWord() {
    if (this.exerciseQueue.length === 0) {
      this.state = 'finished';
      this.emitScore();
      return;
    }

    this.currentWord = this.exerciseQueue.shift()!;
    console.log('Picked new word:', this.currentWord);
    this.letterIndex = 0;
    this.correctStreak = 0;
    this.prediction = '';
    this.state = 'signing';
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

  get currentTargetLetter() {
    return this.currentWord[this.letterIndex] ?? '';
  }
  get progressPct() {
    if (this.state === 'finished') return 100;
    return Math.round(((this.wordsDone + 1) / this.totalWords) * 100);
  }
  get streakPct() {
    return Math.round((this.correctStreak / this.FRAMES_NEEDED) * 100);
  }
  get confidencePct() {
    return Math.round(this.confidence * 100);
  }

  private initMediaPipe() {
    this.hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`,
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((r: Results) => {
      this.drawCanvas(r);
      this.onHandResults(r);
    });

    this.hands.initialize().then(() => {
      console.log('✅ MediaPipe ready');
      this.initCamera();
    });
  }

  private initCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      .then((stream) => {
        this.stream = stream;
        const v = this.video.nativeElement;
        v.srcObject = stream;
        v.muted = true;
        v.onloadedmetadata = () => {
          v.play()
            .then(() => {
              console.log('▶️ playing, dims:', v.videoWidth, v.videoHeight);
              this.startLoop();
            })
            .catch((e) => console.error('play failed:', e));
        };
      })
      .catch((err) => console.error('❌ Camera error:', err.name, err.message));
  }

  private startLoop() {
    const loop = async () => {
      const v = this.video.nativeElement;
      if (v.readyState >= 2) {
        const canvas = this.canvas.nativeElement;
        const ctx = canvas.getContext('2d')!;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(v, -640, 0, 640, 480);
        ctx.restore();

        await this.hands.send({ image: v });
      }
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  private onHandResults(results: Results) {
    if (this.state === 'finished') return;

    if (!results.multiHandLandmarks?.length) {
      this.lastLandmarks = [];
      this.correctStreak = 0;
      return;
    }

    const lm = results.multiHandLandmarks[0];
    const wx = lm[0].x,
      wy = lm[0].y;
    const pts: number[] = [];
    for (const p of lm)
      pts.push(
        parseFloat((p.x - wx).toFixed(6)),
        parseFloat((p.y - wy).toFixed(6)),
        parseFloat(p.z.toFixed(6))
      );

    if (pts.length === 63) {
      this.lastLandmarks = pts;
      this.sendPrediction();
    }
  }

  private sendPrediction() {
    if (this.sending || this.lastLandmarks.length !== 63 || this.state !== 'signing') return;
    this.sending = true;
    this.http
      .post<any>(`${this.API}/words/english/predict`, {
        landmarks: this.lastLandmarks,
        session_id: this.SESSION,
      })
      .subscribe({
        next: (res) => {
          this.sending = false;
          this.prediction = res.letter;
          this.confidence = res.confidence;
          console.log('English Word Prediction:', res);
          if (res.letter === '...') {
            this.correctStreak = 0;
            return;
          }

          if (res.letter === this.currentTargetLetter) {
            this.correctStreak++;
            if (this.correctStreak >= this.FRAMES_NEEDED) this.handleLetterCorrect();
          } else {
            this.correctStreak = 0;
          }
        },
        error: () => {
          this.sending = false;
        },
      });
  }

  private handleLetterCorrect() {
    this.correctStreak = 0;
    this.letterIndex++;

    if (this.letterIndex >= this.currentWord.length) {
      this.state = 'correct';
      this.score++;
      this.wordsDone++;
      this.celebration.playClap();
      this.celebration.launchConfetti(this.confettiCanvas.nativeElement);

      setTimeout(() => {
        if (this.wordsDone >= this.totalWords) {
          this.state = 'finished';
          this.emitScore();
        } else {
          this.pickWord();
        }
      }, 1800);
    }
  }

  private drawCanvas(results: Results) {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const v = this.video.nativeElement;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(v, -640, 0, 640, 480);
    ctx.restore();

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        const mirrored = landmarks.map((p) => ({ ...p, x: 1 - p.x }));

        drawConnectors(ctx, mirrored, HAND_CONNECTIONS, {
          color: this.state === 'correct' ? '#00ff88' : '#7c6ef7',
          lineWidth: 2,
        });
        drawLandmarks(ctx, mirrored, {
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

  skipWord() {
    this.wordsDone++;
    if (this.wordsDone >= this.totalWords) {
      this.state = 'finished';
      this.emitScore();
    } else this.pickWord();
  }

  restart() {
    this.score = 0;
    this.wordsDone = 0;
    this.buildQueue();
    this.pickWord();
  }

  get TOTAL_WORDS() {
    return this.totalWords;
  }
}
