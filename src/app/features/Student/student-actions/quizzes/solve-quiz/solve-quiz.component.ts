import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { StudentServiceService } from '../../../services/student-service.service';
import { ToastrService } from 'ngx-toastr';
import confetti from 'canvas-confetti';
import { TranslateModule } from '@ngx-translate/core';

interface QuizState {
  status: 'pre-start' | 'in-progress' | 'submitting' | 'completed';
}

interface SvgLine {
  qid: string;
  aid: string;
  d: string;
  color: string;
}

@Component({
  selector: 'app-solve-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './solve-quiz.component.html',
  styleUrl: './solve-quiz.component.css',
})
export class SolveQuizComponent implements OnInit, OnDestroy {
  subjectId = signal<string>('');
  lessonId = signal<string | null>(null);
  quizId = signal<string>('');

  quizData = signal<any>(null);
  isLoading = signal<boolean>(true);
  quizState = signal<QuizState['status']>('pre-start');

  // Timer
  durationMinutes = signal<number>(-1);
  timeLeftSeconds = signal<number>(0);
  timerInterval: any;

  // Form
  quizForm!: FormGroup;

  toastTimeout: any;

  // ── Result modal ───────────────────────────────────────────────
  showResultModal = signal(false);
  resultData = signal<{ percentage: number; passed: boolean; message: string } | null>(null);

  // ── Matching: shuffled display arrays ──────────────────────────
  matchingAnswers: Map<number, any[]> = new Map(); // eIdx → shuffled answers

  // ── Matching: selections & SVG lines ───────────────────────────
  // matchSelections[eIdx] = Map<qid, aid>
  matchSelections: Map<number, Map<string, string>> = new Map();
  svgLines: Map<number, SvgLine[]> = new Map();

  // Line color palette
  readonly LINE_COLORS = [
    '#38bdf8',
    '#fb923c',
    '#818cf8',
    '#34d399',
    '#e879f9',
    '#facc15',
    '#f87171',
  ];

  // ── AI sign quiz scores ────────────────────────────────────────
  aiScores = new Map<number, number>();
  private routerSub?: Subscription;

  // ── Drag-line state ────────────────────────────────────────────
  isDrawingLine = false;
  drawEIdx = -1;
  drawQid: string | null = null;
  drawX1 = 0;
  drawY1 = 0; // anchor on question dot (absolute)
  drawX2 = 0;
  drawY2 = 0; // current mouse (absolute)

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private studentService: StudentServiceService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.quizForm = this.fb.group({ exercises: this.fb.array([]) });
    this.captureAiScoreFromState();
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.captureAiScoreFromState());

    this.route.paramMap.subscribe((params) => {
      const sid = params.get('sid');
      const lid = params.get('lid');
      const qid = params.get('qid');
      if (sid) this.subjectId.set(sid);
      if (lid) this.lessonId.set(lid);
      if (qid) {
        this.quizId.set(qid);
        this.fetchQuizDetails(qid);
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.routerSub?.unsubscribe();
  }

  // ── Getters ────────────────────────────────────────────────────
  get quizTitle(): string {
    const d = this.quizData();
    return d?.name || d?.Name || d?.title || d?.levelName || 'Untitled';
  }

  get quizDifficulty(): string {
    const diff = this.quizData()?.levelDifficulty ?? this.quizData()?.difficulty;
    if (diff === 1) return 'Easy';
    if (diff === 2) return 'Medium';
    if (diff === 3) return 'Hard';
    return 'Medium';
  }

  get exercisesFormArray(): FormArray {
    return this.quizForm.get('exercises') as FormArray;
  }

  get formattedTime(): string {
    const t = this.timeLeftSeconds();
    if (t <= 0) return '00:00';
    return `${Math.floor(t / 60)
      .toString()
      .padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  }

  // ── Data Fetching ──────────────────────────────────────────────
  fetchQuizDetails(qid: string) {
    this.isLoading.set(true);
    const sid = this.subjectId(),
      lid = this.lessonId();
    const sub$ = lid
      ? this.studentService.viewExercise(sid, lid, qid)
      : this.studentService.startQuiz(sid, qid);

    sub$.subscribe({
      next: (res: any) => {
        const data = res?.result || res?.data || res || null;
        this.quizData.set(data);
        this.durationMinutes.set(data?.durationInMinutes ?? data?.DurationInMinutes ?? -1);
        this.initializeForm(data);
        this.captureAiScoreFromState();
        this.tryResumeQuiz();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load. Please try again.', 'Error');
        this.isLoading.set(false);
      },
    });
  }

  // ── Form ───────────────────────────────────────────────────────
  initializeForm(data: any) {
    this.exercisesFormArray.clear();
    this.matchingAnswers.clear();
    this.matchSelections.clear();
    this.svgLines.clear();

    const exercises = this.getExercisesList(data);
    exercises.forEach((ex: any, eIdx: number) => {
      const qList = ex.questions || ex.Questions || [];
      const exType = ex.exerciseType ?? ex.ExerciseType ?? ex.type ?? ex.Type;
      console.log(`Exercise ${eIdx} (Type ${exType}):`, ex);

      const questionsArray = this.fb.array(
        qList.map((q: any) =>
          this.fb.group({
            questionId: [q.Qid || q.qid || q.id || q.Id],
            prompt_text: [q.prompt_text || ''],
            selectedAnswerId: [null],
          })
        )
      );

      const isAiExercise = exType == 3 || exType === '3' || exType === 'AI' || exType == 4 || exType === '4' || exType === 'AI_Word';
      this.exercisesFormArray.push(
        this.fb.group({
          exerciseId: [ex.id || ex.Id],
          exerciseType: [exType],
          questions: questionsArray,
          ...(isAiExercise ? { aiScore: [this.aiScores.get(eIdx) ?? null] } : {}),
        })
      );

      if (exType === 2 || exType === '2' || exType === 'Matching') {
        const answersList = ex.answers || ex.Answers || [];
        this.matchingAnswers.set(eIdx, this.shuffle([...answersList]));
        this.matchSelections.set(eIdx, new Map());
        this.svgLines.set(eIdx, []);
      }
    });
  }

  getExercisesList(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.exercise || data.Exercise || data.exercises || data.Exercises || [];
  }

  // ── Quiz State ─────────────────────────────────────────────────
  startQuiz() {
    this.quizState.set('in-progress');
    this.loadDraft();
    const mins = this.durationMinutes();
    if (mins > 0) {
      this.timeLeftSeconds.set(mins * 60);
      this.timerInterval = setInterval(() => {
        const c = this.timeLeftSeconds();
        if (c <= 1) {
          clearInterval(this.timerInterval);
          this.timeLeftSeconds.set(0);
          this.autoSubmit();
        } else this.timeLeftSeconds.set(c - 1);
      }, 1000);
    }
  }

  get draftKey() {
    return `quiz_draft_${this.quizId()}`;
  }

  private get inProgressKey() {
    return `quiz_in_progress_${this.quizId()}`;
  }

  private tryResumeQuiz() {
    if (sessionStorage.getItem(this.inProgressKey) !== '1') return;
    sessionStorage.removeItem(this.inProgressKey);
    this.quizState.set('in-progress');
    this.loadDraft();
    const mins = this.durationMinutes();
    if (mins > 0) {
      this.timeLeftSeconds.set(mins * 60);
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        const c = this.timeLeftSeconds();
        if (c <= 1) {
          clearInterval(this.timerInterval);
          this.timeLeftSeconds.set(0);
          this.autoSubmit();
        } else this.timeLeftSeconds.set(c - 1);
      }, 1000);
    }
  }

  saveDraft() {
    if (this.quizState() !== 'in-progress') return;
    localStorage.setItem(this.draftKey, JSON.stringify(this.quizForm.value));
    this.toastr.success('Progress saved locally.', 'Saved');
  }

  loadDraft() {
    try {
      const v = localStorage.getItem(this.draftKey);
      if (!v) return;
      const data = JSON.parse(v);
      this.quizForm.patchValue(data);
      data.exercises?.forEach((ex: any, eIdx: number) => {
        if (ex.aiScore != null) this.aiScores.set(eIdx, ex.aiScore);
      });
    } catch { }
  }

  clearDraft() {
    localStorage.removeItem(this.draftKey);
  }

  autoSubmit() {
    this.toastr.error('Time is up! Submitting...', 'Time Up');
    this.submitQuiz();
  }

  submitQuiz() {
    this.quizState.set('submitting');
    if (this.timerInterval) clearInterval(this.timerInterval);

    const sedtos: any[] = [];
    this.quizForm.value.exercises.forEach((ex: any, eIdx: number) => {
      const exType = ex.exerciseType;
      if (exType == 3 || exType === '3' || exType === 'AI' || exType == 4 || exType === '4' || exType === 'AI_Word') {
        const correctRounds = this.aiScores.get(eIdx) ?? ex.aiScore ?? 0;
        sedtos.push({ Eid: ex.exerciseId, Score: correctRounds * 10, SADTO: [] });
      } else {
        const sadtos = ex.questions
          .filter((q: any) => q.selectedAnswerId)
          .map((q: any) => ({ Qid: q.questionId, Aid: q.selectedAnswerId }));
        sedtos.push({ Eid: ex.exerciseId, Score: 0, SADTO: sadtos });
      }
    });

    const payload = {
      SubjectFK: this.subjectId(),
      LevelFK: this.quizId(),
      LessonID: this.lessonId() || null,
      sEDTOs: sedtos,
    };

    this.studentService.submitAnswers(payload).subscribe({
      next: (res: any) => {
        this.clearDraft();
        this.quizState.set('completed');
        // Store result and show modal
        const result = res?.result || res?.data || {};
        this.resultData.set({
          percentage: result.percentage ?? 0,
          passed: result.passed ?? false,
          message: res?.message || (result.passed ? 'Well done! You passed!' : 'Keep practicing!'),
        });
        this.showResultModal.set(true);
        if (result.passed) this.launchConfetti();
      },
      error: () => {
        this.toastr.error('Failed to submit. Save draft and retry.', 'Error');
        this.quizState.set('in-progress');
      },
    });
  }

  navigateAfterResult() {
    this.showResultModal.set(false);
    if (this.lessonId()) {
      this.router.navigate(['/student/subject', this.subjectId(), 'lesson', this.lessonId()]);
    } else {
      this.router.navigate(['/student/subject', this.subjectId()]);
    }
  }

  private launchConfetti() {
    const duration = 3500;
    const end = Date.now() + duration;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...opts,
        origin: { y: 0.6 },
        particleCount: Math.floor(200 * particleRatio),
        disableForReducedMotion: true,
      });
    };

    // Initial big burst
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    // Side cannons for sustained effect
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        disableForReducedMotion: true,
      });
      requestAnimationFrame(frame);
    };
    frame();
  }

  // ── MCQ Helpers ────────────────────────────────────────────────
  getExerciseQuestions(eIdx: number): any[] {
    return this.getExercisesList(this.quizData())[eIdx]?.questions || [];
  }

  getQuestionAnswers(q: any): any[] {
    return q?.answers || q?.Answers || q?.options || [];
  }

  selectAnswer(eIdx: number, qIdx: number, answerId: string) {
    if (this.quizState() !== 'in-progress') return;
    const exArray = this.exercisesFormArray.at(eIdx).get('questions') as FormArray;
    const ctrl = exArray.at(qIdx).get('selectedAnswerId');
    ctrl?.setValue(ctrl.value === answerId ? null : answerId);
  }

  // ── Matching: Display ──────────────────────────────────────────
  getMatchingAnswers(eIdx: number): any[] {
    return this.matchingAnswers.get(eIdx) ?? [];
  }
  getSvgLines(eIdx: number): SvgLine[] {
    return this.svgLines.get(eIdx) ?? [];
  }

  isQuestionMatched(eIdx: number, qid: string): boolean {
    return this.matchSelections.get(eIdx)?.has(qid) ?? false;
  }

  isAnswerMatched(eIdx: number, aid: string): boolean {
    const sels = this.matchSelections.get(eIdx);
    if (!sels) return false;
    for (const v of sels.values()) if (v === aid) return true;
    return false;
  }

  getLineForQuestion(eIdx: number, qid: string): SvgLine | undefined {
    return this.getSvgLines(eIdx).find((l) => l.qid === qid);
  }

  getLineForAnswer(eIdx: number, aid: string): SvgLine | undefined {
    return this.getSvgLines(eIdx).find((l) => l.aid === aid);
  }

  // ── Matching: SVG Line Drawing ─────────────────────────────────

  startDrawingLine(event: MouseEvent, eIdx: number, question: any) {
    event.preventDefault();
    if (this.quizState() !== 'in-progress') return;

    const qid = question.qid || question.Qid || question.id || question.Id;
    const dot = document.getElementById(`q-dot-${eIdx}-${qid}`);
    if (!dot) return;

    const r = dot.getBoundingClientRect();
    this.isDrawingLine = true;
    this.drawEIdx = eIdx;
    this.drawQid = qid;
    this.drawX1 = r.left + r.width / 2;
    this.drawY1 = r.top + r.height / 2;
    this.drawX2 = event.clientX;
    this.drawY2 = event.clientY;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDrawingLine) return;
    this.drawX2 = e.clientX;
    this.drawY2 = e.clientY;
  }

  @HostListener('document:mouseup')
  onDocMouseUp() {
    // Cancel if not completed over an answer
    if (this.isDrawingLine) {
      this.isDrawingLine = false;
      this.drawQid = null;
      this.drawEIdx = -1;
    }
  }

  completeMatch(event: MouseEvent, eIdx: number, answer: any) {
    event.stopPropagation();
    if (!this.isDrawingLine || this.drawEIdx !== eIdx || !this.drawQid) return;

    const aid = answer.id || answer.Id;
    const qid = this.drawQid;

    // Reset drag state FIRST (before mouseup fires)
    this.isDrawingLine = false;
    this.drawQid = null;
    this.drawEIdx = -1;

    if (this.quizState() !== 'in-progress') return;

    const sels = this.matchSelections.get(eIdx) ?? new Map<string, string>();
    // Remove any other question that was matched to this answer
    sels.forEach((v, k) => {
      if (v === aid) sels.delete(k);
    });
    sels.set(qid, aid);
    this.matchSelections.set(eIdx, sels);

    // Sync to reactive form
    const exArray = this.exercisesFormArray.at(eIdx).get('questions') as FormArray;
    for (let i = 0; i < exArray.length; i++) {
      if (exArray.at(i).get('questionId')?.value === qid) {
        exArray.at(i).get('selectedAnswerId')?.setValue(aid);
        break;
      }
    }

    // Recalculate after DOM settles
    setTimeout(() => this.recalculateLines(eIdx), 0);
  }

  clearMatch(eIdx: number, qid: string) {
    const sels = this.matchSelections.get(eIdx);
    if (!sels) return;
    sels.delete(qid);

    const exArray = this.exercisesFormArray.at(eIdx).get('questions') as FormArray;
    for (let i = 0; i < exArray.length; i++) {
      if (exArray.at(i).get('questionId')?.value === qid) {
        exArray.at(i).get('selectedAnswerId')?.setValue(null);
        break;
      }
    }
    this.recalculateLines(eIdx);
  }

  recalculateLines(eIdx: number) {
    const container = document.getElementById(`match-area-${eIdx}`);
    if (!container) return;
    const cr = container.getBoundingClientRect();

    const sels = this.matchSelections.get(eIdx);
    if (!sels) {
      this.svgLines.set(eIdx, []);
      return;
    }

    const lines: SvgLine[] = [];
    let colorIdx = 0;
    sels.forEach((aid, qid) => {
      const qDot = document.getElementById(`q-dot-${eIdx}-${qid}`);
      const aDot = document.getElementById(`a-dot-${eIdx}-${aid}`);
      if (!qDot || !aDot) return;

      const qr = qDot.getBoundingClientRect();
      const ar = aDot.getBoundingClientRect();
      const x1 = qr.left + qr.width / 2 - cr.left;
      const y1 = qr.top + qr.height / 2 - cr.top;
      const x2 = ar.left + ar.width / 2 - cr.left;
      const y2 = ar.top + ar.height / 2 - cr.top;
      console.log('line', {
        qid,
        aid,
        x1,
        y1,
        x2,
        y2,
      });
      const cp = Math.abs(x2 - x1) * 0.5;
      const d = `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
      lines.push({ qid, aid, d, color: this.LINE_COLORS[colorIdx++ % this.LINE_COLORS.length] });
    });
    this.svgLines.set(eIdx, lines);
  }

  getActiveDragPath(eIdx: number): string {
    if (!this.isDrawingLine || this.drawEIdx !== eIdx) return '';
    const container = document.getElementById(`match-area-${eIdx}`);
    if (!container) return '';
    const cr = container.getBoundingClientRect();
    const x1 = this.drawX1 - cr.left,
      y1 = this.drawY1 - cr.top;
    const x2 = this.drawX2 - cr.left,
      y2 = this.drawY2 - cr.top;
    const cp = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }

  @HostListener('window:resize')
  onResize() {
    this.matchSelections.forEach((_, eIdx) => setTimeout(() => this.recalculateLines(eIdx), 50));
  }

  // ── Utils ──────────────────────────────────────────────────────
  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Keep for legacy click-based matching / MCQ
  activeMatchingQuestion = signal<{ eIdx: number; qIdx: number } | null>(null);
  setActiveQuestion(eIdx: number, qIdx: number) {
    this.activeMatchingQuestion.set({ eIdx, qIdx });
  }
  isAnswerMapped(eIdx: number, aid: string) {
    return this.isAnswerMatched(eIdx, aid);
  }
  getMappedAnswerText(eIdx: number, qIdx: number): string {
    return '';
  }
  getExerciseAnswers(eIdx: number): any[] {
    return this.getExercisesList(this.quizData())[eIdx]?.answers || [];
  }

  private normalizeAiLetters(raw: any): Record<string, number> {
    const src = raw ?? {};
    if (Array.isArray(src)) {
      return Object.fromEntries(
        src.map((i: any) => [i.key ?? i.Key, i.value ?? i.Value ?? 1])
      );
    }
    return src;
  }

  private captureAiScoreFromState() {
    const { aiScore, exerciseIndex } = history.state ?? {};
    if (aiScore == null || exerciseIndex == null) return;
    this.aiScores.set(exerciseIndex, aiScore);
    const exCtrl = this.exercisesFormArray.at(exerciseIndex);
    exCtrl?.patchValue({ aiScore });
  }

  getAiTotalRounds(eIdx: number): number {
    const ex = this.getExercisesList(this.quizData())[eIdx];
    const letters = this.normalizeAiLetters(
      ex?.aI_letters ?? ex?.ai_letters ?? ex?.AI_letters ?? {}
    );
    return Object.values(letters).reduce((sum, r) => sum + r, 0);
  }

  getAiScore(eIdx: number): number | null {
    return this.aiScores.get(eIdx) ?? this.exercisesFormArray.at(eIdx)?.get('aiScore')?.value ?? null;
  }

  goToAiQuiz(eIdx: number) {
    const exercises = this.getExercisesList(this.quizData());
    const ex = exercises[eIdx];
    const aiLetters = this.normalizeAiLetters(
      ex?.aI_letters ?? ex?.ai_letters ?? ex?.AI_letters ?? {}
    );
    let subjectName = (this.quizData()?.subjectName ?? '').toLowerCase();

    if (!subjectName) {
      const firstKey = Object.keys(aiLetters)[0] ?? '';
      subjectName = /[\u0600-\u06FF]/.test(firstKey) ? 'arabic' : 'english';
    }

    const route = subjectName === 'arabic' ? '/arabic-quiz' : '/quiz';

    if (this.quizState() === 'in-progress') {
      sessionStorage.setItem(this.inProgressKey, '1');
    }

    this.router.navigate([route], {
      state: { aiLetters, exerciseIndex: eIdx, returnUrl: this.router.url },
    });
  }
  goToAiWordsQuiz(eIdx: number) {
    const exercises = this.getExercisesList(this.quizData());
    const ex = exercises[eIdx];
    console.log('goToAiWordsQuiz - ex:', ex);
    const aiLetters = this.normalizeAiLetters(
      ex?.aI_letters ?? ex?.ai_letters ?? ex?.AI_letters ?? {}
    );
    let subjectName = (this.quizData()?.subjectName ?? '').toLowerCase();

    if (!subjectName) {
      const firstKey = Object.keys(aiLetters)[0] ?? '';
      subjectName = /[\u0600-\u06FF]/.test(firstKey) ? 'arabic' : 'english';
    }

    const route = subjectName === 'arabic' ? '/arabic-words' : '/word-quiz';

    if (this.quizState() === 'in-progress') {
      sessionStorage.setItem(this.inProgressKey, '1');
    }

    this.router.navigate([route], {
      state: { aiLetters, exerciseIndex: eIdx, returnUrl: this.router.url },
    });
  }
}
