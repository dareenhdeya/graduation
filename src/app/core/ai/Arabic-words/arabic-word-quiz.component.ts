import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { CelebrationService } from '../celebration.service';

type WordState = 'signing' | 'correct' | 'finished';

interface ArabicWord {
  display: string;
  letters: string[];
}

@Component({
  selector: 'app-arabic-word-quiz',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './arabic-word-quiz.component.html',
  styleUrls: ['./arabic-word-quiz.component.css']
})
export class ArabicWordQuizComponent implements AfterViewInit, OnDestroy {

  @ViewChild('video')          video!:          ElementRef<HTMLVideoElement>;
  @ViewChild('canvas')         canvas!:         ElementRef<HTMLCanvasElement>;
  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;

  readonly Math = Math;
  readonly API  = 'http://127.0.0.1:8000';
  readonly SESSION = 'ar-' + Math.random().toString(36).slice(2);
  readonly TOTAL_WORDS   = 5;
  readonly FRAMES_NEEDED = 8;

  // كلمات مش هتتكرر
  private usedWords: Set<string> = new Set();

  readonly LETTER_MAP: Record<string, string> = {
    aleff: 'ا', bb: 'ب', taa: 'ت', thaa: 'ث', jeem: 'ج',
    haa: 'ح', khaa: 'خ', dal: 'د', thal: 'ذ', ra: 'ر',
    zay: 'ز', seen: 'س', sheen: 'ش', saad: 'ص', dhad: 'ض',
    ta: 'ط', dha: 'ظ', ain: 'ع', ghain: 'غ', fa: 'ف',
    gaaf: 'ق', kaaf: 'ك', laam: 'ل', meem: 'م', nun: 'ن',
    ha: 'ه', waw: 'و', ya: 'ي', la: 'لا', al: 'ال',
    toot: 'ة', alef_maqsura: 'ى', ta_marbuta: 'ة'
  };

  words:         ArabicWord[] = [];
  currentWord!:  ArabicWord;
  letterIndex:   number    = 0;
  score:         number    = 0;
  wordsDone:     number    = 0;
  state:         WordState = 'signing';
  prediction:    string    = '';
  confidence:    number    = 0;
  correctStreak: number    = 0;
  lastLandmarks: number[]  = [];

  private sending   = false;
  private hands!:   Hands;
  private stream!:  MediaStream;
  private animFrame = 0;

  constructor(private http: HttpClient, private celebration: CelebrationService) {}

  ngAfterViewInit() {
    this.http.get<any>(`${this.API}/words/arabic`).subscribe(res => {
      this.words = res.words;
      this.pickWord();
    });
    this.initMediaPipe();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrame);
    this.stream?.getTracks().forEach(t => t.stop());
  }

  private pickWord() {
    //reset
    if (this.usedWords.size >= this.words.length) {
      this.usedWords.clear();
    }
    const pool = this.words.filter(w => !this.usedWords.has(w.display));
    this.currentWord   = pool[Math.floor(Math.random() * pool.length)];
    this.usedWords.add(this.currentWord.display);
    this.letterIndex   = 0;
    this.correctStreak = 0;
    this.prediction    = '';
    this.state         = 'signing';
  }

  get currentTargetLetter(): string {
    return this.currentWord?.letters[this.letterIndex] ?? '';
  }

  get currentTargetLabel(): string {
    return this.LETTER_MAP[this.currentTargetLetter] ?? this.currentTargetLetter;
  }

  get progressPct()   { return Math.round((this.wordsDone / this.TOTAL_WORDS) * 100); }
  get streakPct()     { return Math.round((this.correctStreak / this.FRAMES_NEEDED) * 100); }
  get confidencePct() { return Math.round(this.confidence * 100); }

  private initMediaPipe() {
    this.hands = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
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
      this.stream.getTracks().forEach(t => t.stop());
    }

    navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' }
    })
    .then(stream => {
      this.stream = stream;
      const v = this.video.nativeElement;
      v.srcObject = stream;
      v.muted = true;
      v.onloadedmetadata = () => {
        v.play().then(() => {
          console.log('▶️ playing, dims:', v.videoWidth, v.videoHeight);
          this.startLoop();
        }).catch(e => console.error('play failed:', e));
      };
    })
    .catch(err => console.error('❌ Camera error:', err.name, err.message));
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
    const wx = lm[0].x, wy = lm[0].y;
    const pts: number[] = [];
    for (const p of lm) pts.push(
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

    this.http.post<any>(`${this.API}/words/arabic/predict`, {
      landmarks: this.lastLandmarks,
      session_id: this.SESSION
    }).subscribe({
      next: res => {
        this.sending = false;
        this.prediction = res.letter;
        this.confidence = res.confidence;

        const letterName: string = res.letter_name;
        if (letterName === '...') { this.correctStreak = 0; return; }

        if (letterName === this.currentTargetLetter) {
          this.correctStreak++;
          if (this.correctStreak >= this.FRAMES_NEEDED) this.handleLetterCorrect();
        } else {
          this.correctStreak = 0;
        }
      },
      error: () => { this.sending = false; }
    });
  }

  private handleLetterCorrect() {
    this.correctStreak = 0;
    this.letterIndex++;

    if (this.letterIndex >= this.currentWord.letters.length) {
      this.state = 'correct';
      this.score++;
      this.wordsDone++;
      this.celebration.playClap();
      this.celebration.launchConfetti(this.confettiCanvas.nativeElement);

      setTimeout(() => {
        if (this.wordsDone >= this.TOTAL_WORDS) {
          this.state = 'finished';
          this.saveResult();
        } else {
          this.pickWord();
        }
      }, 1800);
    }
  }

  private saveResult() {
    this.http.post('http://localhost:7168/api/Quiz', {
      quizType:    'arabic-words',
      score:       this.score,
      total:       this.TOTAL_WORDS,
      percentage:  Math.round((this.score / this.TOTAL_WORDS) * 100),
      completedAt: new Date().toISOString()
    }).subscribe({
      next: () => console.log('✅ Result saved'),
      error: e  => console.warn('⚠️ Backend not running on :7168', e)
    });
  }

  private drawCanvas(results: Results) {
    const canvas = this.canvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;
    const v      = this.video.nativeElement;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(v, -640, 0, 640, 480);
    ctx.restore();

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        const mirrored = landmarks.map(p => ({ ...p, x: 1 - p.x }));

        drawConnectors(ctx, mirrored, HAND_CONNECTIONS, {
          color: this.state === 'correct' ? '#00ff88' : '#7c6ef7',
          lineWidth: 2
        });
        drawLandmarks(ctx, mirrored, {
          color: this.state === 'correct' ? '#00ff88' : '#fff',
          lineWidth: 1
        });
      }
    }

    const ok = this.state === 'correct';
    ctx.strokeStyle = ok ? '#00ff88' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(200, 100, 240, 280);
    ctx.setLineDash([]);

    const corners = [[200,100],[440,100],[200,380],[440,380]] as [number,number][];
    ctx.strokeStyle = ok ? '#00ff88' : '#7c6ef7';
    ctx.lineWidth = 5;
    for (const [cx, cy] of corners) {
      const dx = cx === 200 ? 1 : -1;
      const dy = cy === 100 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + dx * 20, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * 20);
      ctx.stroke();
    }
  }

  skipWord() {
    this.wordsDone++;
    if (this.wordsDone >= this.TOTAL_WORDS) { this.state = 'finished'; this.saveResult(); }
    else this.pickWord();
  }

  restart() { this.score = 0; this.wordsDone = 0; this.usedWords.clear(); this.pickWord(); }
}