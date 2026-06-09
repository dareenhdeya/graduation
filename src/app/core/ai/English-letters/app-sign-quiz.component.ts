// //
// import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

// @Component({
//   selector: 'app-sign-quiz',
//   templateUrl: './sign-quiz.component.html',
//   styleUrls: ['./app-sign.component.css']
// })
// export class SignQuizComponent implements AfterViewInit {
//   @ViewChild("video") video!: ElementRef;
//   @ViewChild("canvas") canvas!: ElementRef;

//   alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
//   currentIndex = 0;
//   currentLetter = this.alphabet[this.currentIndex];
//   result = "Ready?";

//   // This stores the results locally in case you want to show a list later
//   history: any[] = [];

//   ngAfterViewInit() {
//     navigator.mediaDevices.getUserMedia({ video: true })
//       .then(stream => {
//         this.video.nativeElement.srcObject = stream;
//         this.startCameraLoop();
//       });
//   }

//   startCameraLoop() {
//     const ctx = this.canvas.nativeElement.getContext('2d');
//     const width = 640;
//     const height = 480;

//     const render = () => {
//       // Draw normally (No scale/translate)
//       // This ensures the AI data is NOT flipped
//       ctx.drawImage(this.video.nativeElement, 0, 0, width, height);

//       // Draw Green Target Box
//       ctx.strokeStyle = "#00FF00";
//       ctx.lineWidth = 5;
//       ctx.strokeRect(220, 140, 200, 200);

//       requestAnimationFrame(render);
//     };
//     render();
//   }

//   nextLetter() {
//     if (this.currentIndex < this.alphabet.length - 1) {
//       this.currentIndex++;
//       this.currentLetter = this.alphabet[this.currentIndex];
//       this.result = "Try the next one!";
//     }
//   }

//   capture() {
//     this.result = "Checking...";
//     const tempCanvas = document.createElement("canvas");
//     tempCanvas.width = 64;
//     tempCanvas.height = 64;
//     const tempCtx = tempCanvas.getContext("2d");

//     // Capture from the "Normal" (unflipped) canvas pixels
//     tempCtx!.drawImage(this.canvas.nativeElement, 220, 140, 200, 200, 0, 0, 64, 64);

//     const imgData = tempCanvas.toDataURL("image/jpeg");

//     // 1. TALK TO PYTHON AI
//     fetch("http://127.0.0.1:8000/predict", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ image: imgData })
//     })
//     .then(res => res.json())
//     .then(data => {
//       const isCorrect = (data.letter === this.currentLetter);

//       // RESTORED: Now it shows both the status and the actual AI detection
//       if (isCorrect) {
//         this.result = `Correct! ✅ AI saw: ${data.letter}`;
//       } else {
//         this.result = `Wrong! AI detected: ${data.letter}`;
//       }

//       // 2. TALK TO .NET BACKEND
//       this.saveToDotNet(this.currentLetter, isCorrect);
//     })
//     .catch(() => this.result = "Server Error: Python Offline");
//   }

//   saveToDotNet(letter: string, correct: boolean) {
//     const payload = { letter: letter, correct: correct };

//     fetch("http://localhost:5283/api/Quiz", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload)
//     })
//     .then(res => {
//       if (res.ok) console.log("Saved to .NET History");
//     })
//     .catch(err => console.error("Dotnet Error:", err));
//   }
// }
//=======================================================RF=====================================================
// import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// type QuizState = 'waiting' | 'correct' | 'wrong' | 'finished';

// @Component({
//   selector: 'app-sign-quiz',
//   templateUrl: './sign-quiz.component.html',
//   styleUrls: ['./app-sign.component.css']
// })
// export class SignQuizComponent implements AfterViewInit, OnDestroy {

//   @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
//   @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

//   readonly TOTAL_ROUNDS = 10;
//   readonly CORRECT_HOLD_MS = 1200;
//   readonly CONFIDENCE_THRESHOLD = 0.6; // 🔥 زودناها عشان accuracy
//   readonly FRAMES_TO_CONFIRM = 6;

//   alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

//   currentLetter = '';
//   score = 0;
//   round = 0;
//   state: QuizState = 'waiting';
//   prediction = '';
//   confidence = 0;
//   feedback = '';
//   correctStreak = 0;

//   lastLandmarks: number[] = [];

//   private hands!: Hands;
//   private stream!: MediaStream;
//   private animFrame = 0;
//   private sendingPrediction = false;
//   private lastSentTime = 0; // 🔥 throttle

//   constructor(private http: HttpClient) {}

//   ngAfterViewInit() {
//     this.pickLetter();
//     this.initMediaPipe();
//     this.initCamera();
//   }

//   ngOnDestroy() {
//     cancelAnimationFrame(this.animFrame);
//     this.stream?.getTracks().forEach(t => t.stop());
//   }

//   private pickLetter() {
//     this.currentLetter = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
//     this.correctStreak = 0;
//     this.prediction = '';
//     this.state = 'waiting';
//   }

//   private initMediaPipe() {
//     this.hands = new Hands({
//       locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
//     });

//     this.hands.setOptions({
//       maxNumHands: 1,
//       modelComplexity: 1,
//       minDetectionConfidence: 0.7,
//       minTrackingConfidence: 0.6
//     });

//     this.hands.onResults((r: Results) => {
//       this.onHandResults(r);
//       this.drawCanvas(r); // 🔥 رسم الإيد
//     });
//   }

//   private initCamera() {
//     navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
//       .then(stream => {
//         this.stream = stream;
//         const v = this.video.nativeElement;
//         v.srcObject = stream;

//         v.onloadedmetadata = () => {
//           v.play();
//           this.startLoop();
//         };
//       })
//       .catch(() => { this.feedback = 'Camera access denied.'; });
//   }

//   private startLoop() {
//     const loop = async () => {
//       const v = this.video.nativeElement;

//       if (v.readyState >= 2) {
//         await this.hands.send({ image: v });
//       }

//       this.animFrame = requestAnimationFrame(loop);
//     };

//     loop();
//   }

//   private onHandResults(results: Results) {
//     if (this.state === 'finished') return;

//     if (!results.multiHandLandmarks?.length) {
//       this.lastLandmarks = [];
//       this.correctStreak = 0;
//       return;
//     }

//     const lm = results.multiHandLandmarks[0];
//     const wx = lm[0].x, wy = lm[0].y;

//     const pts: number[] = [];

//     for (const p of lm) {
//       pts.push(
//         +(p.x - wx).toFixed(6),
//         +(p.y - wy).toFixed(6),
//         +p.z.toFixed(6)
//       );
//     }

//     if (pts.length === 63) {
//       this.lastLandmarks = pts;
//       this.sendPrediction();
//     }
//   }

//   private sendPrediction() {
//     const now = Date.now();

//     // 🔥 تقليل عدد الريكوستات (كل 150ms)
//     if (now - this.lastSentTime < 150) return;

//     if (this.sendingPrediction || this.lastLandmarks.length !== 63) return;
//     if (this.state === 'finished') return;

//     this.lastSentTime = now;
//     this.sendingPrediction = true;

//     this.http.post<any>('http://127.0.0.1:8000/predict', {
//       landmarks: this.lastLandmarks
//     }).subscribe({
//       next: res => {
//         this.sendingPrediction = false;

//         this.confidence = res.confidence;

//         // 🔥 ignore low confidence
//         if (res.confidence < this.CONFIDENCE_THRESHOLD) {
//           this.prediction = '...';
//           this.correctStreak = 0;
//           return;
//         }

//         this.prediction = res.letter;

//         if (res.letter === this.currentLetter) {
//           this.correctStreak++;

//           if (this.correctStreak >= this.FRAMES_TO_CONFIRM) {
//             this.handleCorrect();
//           }
//         } else {
//           this.correctStreak = 0;
//         }
//       },
//       error: () => {
//         this.sendingPrediction = false;
//       }
//     });
//   }

//   private handleCorrect() {
//     if (this.state === 'correct') return;

//     this.state = 'correct';
//     this.score++;
//     this.round++;

//     setTimeout(() => {
//       if (this.round >= this.TOTAL_ROUNDS) {
//         this.state = 'finished';
//         this.saveResult();
//       } else {
//         this.pickLetter();
//       }
//     }, this.CORRECT_HOLD_MS);
//   }

//   private saveResult() {
//     this.http.post('http://localhost:5283/api/Quiz', {
//       score: this.score,
//       total: this.TOTAL_ROUNDS,
//       percentage: Math.round((this.score / this.TOTAL_ROUNDS) * 100),
//       completedAt: new Date().toISOString()
//     }).subscribe();
//   }

//   // 🔥🔥🔥 أهم تعديل هنا (رسم الإيد)
//   private drawCanvas(results?: Results) {
//     const canvas = this.canvas.nativeElement;
//     const ctx = canvas.getContext('2d')!;
//     const v = this.video.nativeElement;

//     // ❗ متغيرناش المراية
//     ctx.save();
//     ctx.scale(-1, 1);
//     ctx.drawImage(v, -640, 0, 640, 480);
//     ctx.restore();

//     // ✋ رسم landmarks
//     if (results?.multiHandLandmarks) {
//       for (const landmarks of results.multiHandLandmarks) {
//         drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
//           color: '#00FF00',
//           lineWidth: 2
//         });
//         drawLandmarks(ctx, landmarks, {
//           color: '#FF0000',
//           lineWidth: 1
//         });
//       }
//     }

//     // المربع (زي ما هو)
//     ctx.strokeStyle = this.state === 'correct' ? '#00ff88' : '#ffffff';
//     ctx.lineWidth = 3;
//     ctx.setLineDash([10, 6]);
//     ctx.strokeRect(200, 100, 240, 280);
//     ctx.setLineDash([]);

//     const corners = [[200,100],[440,100],[200,380],[440,380]];
//     ctx.strokeStyle = this.state === 'correct' ? '#00ff88' : '#7c6ef7';
//     ctx.lineWidth = 5;

//     for (const [cx, cy] of corners) {
//       const dx = cx === 200 ? 1 : -1;
//       const dy = cy === 100 ? 1 : -1;
//       ctx.beginPath();
//       ctx.moveTo(cx + dx * 20, cy);
//       ctx.lineTo(cx, cy);
//       ctx.lineTo(cx, cy + dy * 20);
//       ctx.stroke();
//     }
//   }

//   skipLetter() {
//     if (this.state === 'finished') return;
//     this.round++;

//     if (this.round >= this.TOTAL_ROUNDS) {
//       this.state = 'finished';
//       this.saveResult();
//     } else {
//       this.pickLetter();
//     }
//   }

//   restart() {
//     this.score = 0;
//     this.round = 0;
//     this.correctStreak = 0;
//     this.pickLetter();
//   }

//   get progressPercent() {
//     return Math.round((this.round / this.TOTAL_ROUNDS) * 100);
//   }

//   get confidencePercent() {
//     return Math.round(this.confidence * 100);
//   }

//   readonly Math = Math;
// }
//===============================================================================
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { CelebrationService } from '../celebration.service';
type QuizState = 'waiting' | 'correct' | 'wrong' | 'finished';

@Component({
  selector: 'app-sign-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sign-quiz.component.html',
  styleUrls: ['./app-sign.component.css'],
})
export class SignQuizComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() aiLetters?: Record<string, number>;
  @Output() scoreSubmitted = new EventEmitter<number>();

  returnUrl?: string;
  exerciseIndex?: number;

  readonly Math = Math;
  totalRounds = 5;
  readonly CORRECT_HOLD_MS = 1000;
  readonly CONFIDENCE_THRESHOLD = 0.6;
  readonly FRAMES_TO_CONFIRM = 6;
  readonly STABILITY_THRESHOLD = 0.7;

  private exerciseQueue: string[] = [];
  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  currentLetter = '';
  score = 0;
  round = 0;
  state: QuizState = 'waiting';
  prediction = '';
  confidence = 0;
  feedback = '';
  correctStreak = 0;

  lastLandmarks: number[] = [];
  prevLandmarks: number[] = [];

  private hands!: Hands;
  private stream!: MediaStream;
  private animFrame = 0;
  private sendingPrediction = false;
  private lastSentTime = 0;
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
    this.initMediaPipe();
    this.initCamera();
    if (this.exerciseQueue.length > 0) {
      this.pickLetter();
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrame);
    this.stream?.getTracks().forEach((t) => t.stop());
  }

  // ───────────────── Quiz logic ─────────────────
  private buildQueue() {
    this.exerciseQueue = [];
    if (!this.aiLetters) return;

    for (const [letter, rounds] of Object.entries(this.aiLetters)) {
      const upper = letter.toUpperCase();
      if (this.alphabet.includes(upper)) {
        for (let i = 0; i < (rounds as number); i++) {
          this.exerciseQueue.push(upper);
        }
      }
    }
    this.totalRounds = this.exerciseQueue.length || 5;
  }

  pickLetter() {
    if (this.exerciseQueue.length === 0) {
      this.state = 'finished';
      this.emitScore();
      return;
    }

    this.currentLetter = this.exerciseQueue.shift()!;
    this.correctStreak = 0;
    this.prevLandmarks = [];
    this.prediction = '';
    this.state = 'waiting';
  }

  // ───────────────── Stability check ─────────────────
  private isStable(): boolean {
    if (this.prevLandmarks.length !== 63) return false;
    let diff = 0;
    for (let i = 0; i < 63; i++) {
      diff += Math.abs(this.lastLandmarks[i] - this.prevLandmarks[i]);
    }
    return diff < this.STABILITY_THRESHOLD;
  }

  // ───────────────── MediaPipe ─────────────────
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
    this.hands.onResults((results: Results) => {
      this.lastResults = results;
      this.onHandResults(results);
    });
  }

  // ───────────────── Camera ─────────────────
  private initCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        this.stream = stream;
        const v = this.video.nativeElement;
        v.srcObject = stream;
        v.muted = true;
        v.onloadedmetadata = () => {
          v.play();
          this.startLoop();
        };
      })
      .catch(() => {
        this.feedback = 'Camera access denied.';
      });
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

  // ───────────────── Draw ─────────────────
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

  // ───────────────── Hand tracking ─────────────────
  private onHandResults(results: Results) {
    if (this.state === 'finished') return;

    if (!results.multiHandLandmarks?.length) {
      this.prevLandmarks = [];
      this.lastLandmarks = [];
      this.correctStreak = 0;
      return;
    }

    const lm = results.multiHandLandmarks[0];
    const baseX = lm[0].x,
      baseY = lm[0].y;
    const pts: number[] = [];

    for (const p of lm) {
      pts.push(+(p.x - baseX).toFixed(6), +(p.y - baseY).toFixed(6), +p.z.toFixed(6));
    }

    if (pts.length === 63) {
      this.prevLandmarks = this.lastLandmarks;
      this.lastLandmarks = pts;
      if (this.isStable()) {
        this.sendPrediction();
      } else {
        this.correctStreak = 0;
      }
    }
  }

  // ───────────────── Prediction ─────────────────
  private sendPrediction() {
    const now = Date.now();
    if (now - this.lastSentTime < 150) return;
    if (this.sendingPrediction) return;
    if (this.lastLandmarks.length !== 63) return;
    if (this.state === 'finished') return;

    this.lastSentTime = now;
    this.sendingPrediction = true;

    this.http
      .post<any>('http://127.0.0.1:8000/predict', {
        landmarks: this.lastLandmarks,
      })
      .subscribe({
        next: (res) => {
          if (this.state === 'finished') {
            this.sendingPrediction = false;
            return;
          }
          this.sendingPrediction = false;
          this.confidence = res.confidence;

          if (res.confidence < this.CONFIDENCE_THRESHOLD) {
            this.prediction = '...';
            this.correctStreak = 0;
            return;
          }

          this.prediction = res.letter;
          if (res.letter === this.currentLetter) {
            this.correctStreak++;
            if (this.correctStreak >= this.FRAMES_TO_CONFIRM) this.handleCorrect();
          } else {
            this.correctStreak = 0;
          }
        },
        error: () => {
          this.sendingPrediction = false;
        },
      });
  }

  // ───────────────── Correct ─────────────────
  private handleCorrect() {
    if (this.state === 'correct' || this.state === 'finished') return;

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
    }, this.CORRECT_HOLD_MS);
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

  // ───────────────── Controls ─────────────────
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
    this.buildQueue();
    this.pickLetter();
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
