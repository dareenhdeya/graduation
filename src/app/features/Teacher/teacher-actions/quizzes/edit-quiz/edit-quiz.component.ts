import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherServiceService } from '../../../services/teacher-service.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

type AnswerType = 'text' | 'image';
type ExerciseType = 'MCQ' | 'Matching' | 'AI';

// Mirrors backend enum: None = 0, Lesson = 1, Quiz = 2
export enum PerquisiteType {
  None = 0,
  Lesson = 1,
}

@Component({
  selector: 'app-edit-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './edit-quiz.component.html',
})
export class EditQuizComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherServiceService);
  private toastr = inject(ToastrService);

  subjectId: string | null = null;
  lessonId: string | null = null;
  quizId: string | null = null;

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  difficulties = ['Easy', 'Medium', 'Hard'];

  /** ─── AI Configs ─── */
  isAISupported = false;
  englishAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  arabicAlphabet = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
  activeAlphabetTabs: Map<number, 'english' | 'arabic'> = new Map();
  aiLettersMaps: Map<number, Map<string, number>> = new Map();

  // ── Prerequisite ──────────────────────────────────────
  isLoadingPrerequisites = false;
  prerequisiteOptions: { id: string; title: string }[] = [];

  readonly perquisiteTypes = [
    { value: PerquisiteType.None, label: 'None' },
    { value: PerquisiteType.Lesson, label: 'Lesson' },
  ];

  // ── Image maps: keys are 'eIdx-qIdx' for question images,
  //               'eIdx-qIdx-aIdx' for MCQ answer images,
  //               'eIdx-qIdx-match' for Matching answer images
  questionImages: Map<string, File> = new Map();
  answerImages: Map<string, File> = new Map();
  matchAnswerImages: Map<string, File> = new Map();

  // Preview Data URLs (generated via FileReader)
  questionPreviews: Map<string, string> = new Map();
  answerPreviews: Map<string, string> = new Map();
  matchAnswerPreviews: Map<string, string> = new Map();

  // Existing Cloudinary URLs loaded from the API (fallback when no FileReader preview)
  existingQuestionImgPaths: Map<string, string> = new Map();
  existingAnswerImgPaths: Map<string, string> = new Map();
  existingMatchImgPaths: Map<string, string> = new Map();

  // Snapshot of original API data for per-exercise reset
  private originalData: any = null;

  // Answer type per MCQ answer: 'eIdx-qIdx-aIdx' → 'text' | 'image'
  answerTypes: Map<string, AnswerType> = new Map();
  // Match answer type per Matching question: 'eIdx-qIdx' → 'text' | 'image'
  matchAnswerTypes: Map<string, AnswerType> = new Map();

  levelForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    passingGradePercentage: [60, [Validators.required, Validators.min(0), Validators.max(100)]],
    levelDifficulty: ['Easy', Validators.required],
    perquisiteType: [PerquisiteType.None],
    perquisiteId: [null],
    exercises: this.fb.array([]),
  });

  // ── Accessors ──────────────────────────────────────────

  get exercises(): FormArray {
    return this.levelForm.get('exercises') as FormArray;
  }

  questions(eIndex: number): FormArray {
    return this.exercises.at(eIndex).get('questions') as FormArray;
  }

  answers(eIndex: number, qIndex: number): FormArray {
    return this.questions(eIndex).at(qIndex).get('answers') as FormArray;
  }

  getExerciseType(eIndex: number): ExerciseType {
    return this.exercises.at(eIndex).get('type')?.value as ExerciseType;
  }

  // ── AI Methods ──

  getAiLettersMap(eIndex: number): Map<string, number> {
    // ensure exercise exists before accessing map
    if (!this.aiLettersMaps.has(eIndex)) {
      this.aiLettersMaps.set(eIndex, new Map());
    }
    return this.aiLettersMaps.get(eIndex)!;
  }

  getAiLettersEntries(eIndex: number): { letter: string; rounds: number }[] {
    return Array.from(this.getAiLettersMap(eIndex).entries()).map(([letter, rounds]) => ({
      letter,
      rounds,
    }));
  }

  getAiTotalRounds(eIndex: number): number {
    let total = 0;
    this.getAiLettersMap(eIndex).forEach((v) => (total += v));
    return total;
  }

  getActiveAlphabetTab(eIndex: number): 'english' | 'arabic' {
    return this.activeAlphabetTabs.get(eIndex) ?? 'english';
  }

  setActiveAlphabetTab(eIndex: number, tab: 'english' | 'arabic'): void {
    this.activeAlphabetTabs.set(eIndex, tab);
  }

  toggleLetter(eIndex: number, letter: string): void {
    const map = this.getAiLettersMap(eIndex);
    if (map.has(letter)) {
      map.delete(letter);
    } else {
      map.set(letter, 1);
    }
  }

  isLetterSelected(eIndex: number, letter: string): boolean {
    return this.getAiLettersMap(eIndex).has(letter);
  }

  setLetterRounds(eIndex: number, letter: string, rounds: number): void {
    if (rounds < 1) rounds = 1;
    if (rounds > 20) rounds = 20;
    this.getAiLettersMap(eIndex).set(letter, rounds);
  }

  removeLetter(eIndex: number, letter: string): void {
    this.getAiLettersMap(eIndex).delete(letter);
  }

  // ── Key helpers ────────────────────────────────────────

  private qImgKey(eIdx: number, qIdx: number): string {
    return `${eIdx}-${qIdx}`;
  }
  private aImgKey(eIdx: number, qIdx: number, aIdx: number): string {
    return `${eIdx}-${qIdx}-${aIdx}`;
  }
  private matchKey(eIdx: number, qIdx: number): string {
    return `${eIdx}-${qIdx}-match`;
  }

  // ── Lifecycle ──────────────────────────────────────────

  // ── Prerequisite helpers ─────────────────────────────

  get selectedPrereqType(): number {
    return this.levelForm.get('perquisiteType')?.value ?? PerquisiteType.None;
  }

  onPrereqTypeChange(): void {
    this.levelForm.get('perquisiteId')?.setValue(null);
    this.prerequisiteOptions = [];

    const type = this.selectedPrereqType;
    if (type !== PerquisiteType.None && this.subjectId) {
      this.isLoadingPrerequisites = true;
      this.teacherService.listPrerequisites(this.subjectId, type).subscribe({
        next: (res: any) => {
          this.prerequisiteOptions = (res?.result ?? []).map((item: any) => ({
            id: item.id ?? item.Id,
            title: item.title ?? item.Title ?? item.name ?? item.Name ?? 'Unnamed',
          }));
          this.isLoadingPrerequisites = false;
        },
        error: (err) => {
          console.error('Error loading prerequisites', err);
          this.isLoadingPrerequisites = false;
        },
      });
    }
  }

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('sid');
    this.lessonId = this.route.snapshot.paramMap.get('lid');
    this.quizId = this.route.snapshot.paramMap.get('qid');

    if (this.subjectId) {
      this.teacherService.getSubjects().subscribe({
        next: (res) => {
          const sid = this.subjectId?.toLowerCase();
          const subject: any = res?.result?.find(
            (s: any) => s.subjectId?.toLowerCase() === sid || s.id?.toLowerCase() === sid
          );
          if (subject) {
            this.isAISupported =
              subject.aI_supported === true ||
              subject.AI_supported === true ||
              subject.aI_Supported === true ||
              subject.ai_supported === true;
          }
        },
      });
    }

    if (this.quizId && this.subjectId) {
      this.teacherService.viewQuiz(this.subjectId, this.quizId, this.lessonId).subscribe({
        next: (res) => {
          const data = res.result || res.data || res;
          this.originalData = data;
          this.populateForm(data);
        },
        error: (err) => {
          console.error(err);
          this.submitError = 'Failed to load quiz data.';
        },
      });
    } else {
      this.addExercise();
    }
  }

  populateForm(data: any): void {
    let name = data.name || data.Name || data.title || data.Title || data.levelName || '';
    if (!name || name.trim() === '') name = 'Untitled Quiz';
    const passingPercentage =
      data.passingPercentage ??
      data.PassingPercentage ??
      data.passingGrade ??
      data.PassingGrade ??
      60;

    let diffStr = 'Medium';
    const diffInt = data.levelDifficulty ?? data.difficulty ?? data.Difficulty;
    if (diffInt === 0) diffStr = 'Easy';
    if (diffInt === 1) diffStr = 'Medium';
    if (diffInt === 2) diffStr = 'Hard';

    this.levelForm.patchValue({
      name,
      passingGradePercentage: passingPercentage,
      levelDifficulty: typeof diffInt === 'string' ? diffInt : diffStr,
    });

    // Prerequisite
    const pType = data.perquisiteType ?? data.PerquisiteType ?? data.prerequisiteType ?? 0;
    const pId =
      data.perquisite ?? data.Perquisite ?? data.prerequisiteId ?? data.PerquisiteId ?? null;
    this.levelForm.patchValue({ perquisiteType: pType, perquisiteId: pId });
    if (pType !== PerquisiteType.None && this.subjectId) {
      this.isLoadingPrerequisites = true;
      this.teacherService.listPrerequisites(this.subjectId, pType).subscribe({
        next: (res: any) => {
          this.prerequisiteOptions = (res?.result ?? []).map((item: any) => ({
            id: item.id ?? item.Id,
            title: item.title ?? item.Title ?? item.name ?? item.Name ?? 'Unnamed',
          }));
          this.isLoadingPrerequisites = false;
          // Re-set the value after options load to ensure it sticks
          if (pId) this.levelForm.get('perquisiteId')?.setValue(pId);
        },
        error: () => {
          this.isLoadingPrerequisites = false;
        },
      });
    }

    const exercises = data.Exercise || data.exercise || data.exercises || data.items || [];

    // Remove default exercise
    while (this.exercises.length) this.exercises.removeAt(0);

    exercises.forEach((ex: any, eIdx: number) => {
      const exTypeInt = ex.type ?? ex.Type ?? ex.exerciseType;
      const exTypeStr: ExerciseType =
        exTypeInt === 3 || exTypeInt === '3' || exTypeInt === 'AI'
          ? 'AI'
          : exTypeInt === 2 || exTypeInt === '2' || exTypeInt === 'Matching'
          ? 'Matching'
          : 'MCQ';
      let exName = ex.name || ex.Name || ex.title || ex.Title || '';
      if (!exName || exName.trim() === '') exName = 'Untitled Exercise';
      const exId = ex.id || ex.Id || null;

      const exGroup = this.fb.group({
        id: [exId],
        name: [exName, [Validators.required, Validators.minLength(3)]],
        type: [exTypeStr],
        questions: this.fb.array([]),
      });
      this.exercises.push(exGroup);

      // ── AI: populate letter map ──
      if (exTypeStr === 'AI') {
        const aiLetters = ex.aI_letters || ex.ai_letters || ex.AI_letters || ex.aiLetters || {};
        const map = this.getAiLettersMap(eIdx);
        if (Array.isArray(aiLetters)) {
          aiLetters.forEach((item: any) =>
            map.set(item.key ?? item.Key, item.value ?? item.Value ?? 1)
          );
        } else {
          Object.entries(aiLetters).forEach(([k, v]) => map.set(k, v as number));
        }
        return; // no questions to populate for AI
      }

      const questionsList = ex.questions || ex.Questions || [];
      questionsList.forEach((q: any, qIdx: number) => {
        let promptText = q.prompt_text || q.prompt || '';
        if (!promptText || promptText.trim() === '') promptText = 'Untitled Question';

        const score = q.score || 10;
        const qId = q.qid || q.Qid || q.id || q.Id || null;

        const qGroup = this.fb.group({
          id: [qId],
          prompt_text: [promptText],
          score: [score, [Validators.required, Validators.min(1)]],
          matchAnswer: [''],
          matchAnswerId: [null], // for matching single answer
          answers: this.fb.array([]), // for MCQ answers
        });
        this.questions(eIdx).push(qGroup);

        // Store existing question image URL from API
        const qImgUrl = q.imgPath || q.ImgPath || q.prompt_image || null;
        if (qImgUrl) {
          this.existingQuestionImgPaths.set(this.qImgKey(eIdx, qIdx), qImgUrl);
        }

        if (exTypeStr === 'MCQ') {
          const mcqAnswers = q.answers || q.Answers || [];

          mcqAnswers.forEach((ans: any, aIdx: number) => {
            const answerVal = ans.answer || ans.Answer || '';
            const isCorrect = ans.isCorrect || ans.IsCorrect || false;
            const aGroup = this.fb.group({
              id: [ans.id || ans.Id || null],
              answer: [answerVal],
              isCorrect: [isCorrect],
            });
            this.answers(eIdx, qIdx).push(aGroup);
            const ansImgUrl = ans.imgPath || ans.ImgPath || null;
            // Image answer: answer text is empty AND backend stored an imgPath
            const isImageAnswer = !answerVal.trim() && !!ansImgUrl;
            if (isImageAnswer) {
              const aKey = this.aImgKey(eIdx, qIdx, aIdx);
              this.existingAnswerImgPaths.set(aKey, ansImgUrl);
              this.answerTypes.set(aKey, 'image');
            } else {
              this.answerTypes.set(this.aImgKey(eIdx, qIdx, aIdx), 'text');
            }
          });
          if (mcqAnswers.length === 0) {
            this.addAnswer(eIdx, qIdx);
            this.addAnswer(eIdx, qIdx);
          }
        } else {
          this.matchAnswerTypes.set(this.matchKey(eIdx, qIdx), 'text');
          let mAnswer = '';
          let mAnswerId = null;
          if (q.answer || q.Answer) {
            const mAnsObj = q.answer || q.Answer;
            mAnswer =
              mAnsObj.answer || mAnsObj.Answer || (typeof mAnsObj === 'string' ? mAnsObj : '');
            mAnswerId = mAnsObj.id || mAnsObj.Id || null;
            // Store existing match answer image URL if present
            const mImgUrl = mAnsObj.imgPath || mAnsObj.ImgPath || null;
            if (mImgUrl) {
              this.existingMatchImgPaths.set(this.matchKey(eIdx, qIdx), mImgUrl);
              this.matchAnswerTypes.set(this.matchKey(eIdx, qIdx), 'image');
            }
          }
          const mGroup = this.questions(eIdx).at(qIdx) as FormGroup;
          if (!mGroup.contains('matchAnswer')) {
            mGroup.addControl('matchAnswer', this.fb.control(mAnswer));
          } else {
            mGroup.get('matchAnswer')?.setValue(mAnswer);
          }
          if (!mGroup.contains('matchAnswerId')) {
            mGroup.addControl('matchAnswerId', this.fb.control(mAnswerId));
          } else {
            mGroup.get('matchAnswerId')?.setValue(mAnswerId);
          }
        }
      });
    });
  }

  // ── Exercise management ────────────────────────────────

  addExercise(): void {
    const group = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['MCQ'],
      questions: this.fb.array([]),
    });
    this.exercises.push(group);
    const eIndex = this.exercises.length - 1;
    this.addQuestion(eIndex);
  }

  removeExercise(eIndex: number): void {
    // Clean up image maps for this exercise
    for (const key of [
      ...this.questionImages.keys(),
      ...this.answerImages.keys(),
      ...this.matchAnswerImages.keys(),
      ...this.matchAnswerTypes.keys(),
      ...this.answerTypes.keys(),
    ]) {
      if (key.startsWith(`${eIndex}-`)) {
        this.questionImages.delete(key);
        this.answerImages.delete(key);
        this.matchAnswerImages.delete(key);
        this.questionPreviews.delete(key);
        this.answerPreviews.delete(key);
        this.matchAnswerPreviews.delete(key);
        this.matchAnswerTypes.delete(key);
        this.answerTypes.delete(key);
      }
    }
    this.exercises.removeAt(eIndex);
  }

  /** Clear all text/image content from an exercise while keeping its structure. */
  clearExercise(eIndex: number): void {
    this.exercises.at(eIndex).get('name')?.setValue('');
    const qs = this.questions(eIndex);
    for (let q = 0; q < qs.length; q++) {
      qs.at(q).get('prompt_text')?.setValue('');
      qs.at(q).get('score')?.setValue(10);
      qs.at(q).get('matchAnswer')?.setValue('');
      const as = this.answers(eIndex, q);
      for (let a = 0; a < as.length; a++) {
        as.at(a).get('answer')?.setValue('');
        const aKey = this.aImgKey(eIndex, q, a);
        this.answerImages.delete(aKey);
        this.answerPreviews.delete(aKey);
      }
      const qKey = this.qImgKey(eIndex, q);
      this.questionImages.delete(qKey);
      this.questionPreviews.delete(qKey);
      const mKey = this.matchKey(eIndex, q);
      this.matchAnswerImages.delete(mKey);
      this.matchAnswerPreviews.delete(mKey);
    }
  }

  /** Reset an exercise back to the originally loaded API data. */
  resetExercise(eIndex: number): void {
    if (!this.originalData) return;
    const exercises =
      this.originalData.Exercise ||
      this.originalData.exercise ||
      this.originalData.exercises ||
      this.originalData.items ||
      [];
    const exData = exercises[eIndex];
    if (!exData) return;

    // Clean up all image/type maps for this exercise
    for (const map of [
      this.questionImages,
      this.answerImages,
      this.matchAnswerImages,
      this.questionPreviews,
      this.answerPreviews,
      this.matchAnswerPreviews,
      this.matchAnswerTypes,
      this.answerTypes,
    ] as Map<string, any>[]) {
      for (const key of [...map.keys()]) {
        if (key.startsWith(`${eIndex}-`)) map.delete(key);
      }
    }

    // Remove existing questions
    const qs = this.questions(eIndex);
    while (qs.length) qs.removeAt(0);

    // Restore exercise-level fields
    const exTypeInt = exData.type ?? exData.Type ?? exData.exerciseType;
    const exTypeStr: ExerciseType =
      exTypeInt === 3 || exTypeInt === '3' || exTypeInt === 'AI'
        ? 'AI'
        : exTypeInt === 2 || exTypeInt === '2' || exTypeInt === 'Matching'
        ? 'Matching'
        : 'MCQ';
    this.exercises
      .at(eIndex)
      .get('name')
      ?.setValue(exData.name || exData.Name || '');
    this.exercises.at(eIndex).get('type')?.setValue(exTypeStr);

    // Restore questions
    const questionsList = exData.questions || exData.Questions || [];
    questionsList.forEach((q: any, qIdx: number) => {
      const promptText = q.prompt_text || q.prompt || '';
      const score = q.score || 10;
      const qId = q.qid || q.Qid || q.id || q.Id || null;
      const qGroup = this.fb.group({
        id: [qId],
        prompt_text: [promptText],
        score: [score, [Validators.required, Validators.min(1)]],
        matchAnswer: [''],
        matchAnswerId: [null],
        answers: this.fb.array([]),
      });
      qs.push(qGroup);
      if (exTypeStr === 'MCQ') {
        const mcqAnswers = q.answers || q.Answers || [];
        mcqAnswers.forEach((ans: any, aIdx: number) => {
          const aGroup = this.fb.group({
            id: [ans.id || ans.Id || null],
            answer: [ans.answer || ans.Answer || ''],
            isCorrect: [ans.isCorrect || ans.IsCorrect || false],
          });
          this.answers(eIndex, qIdx).push(aGroup);
          this.answerTypes.set(this.aImgKey(eIndex, qIdx, aIdx), 'text');
        });
        if (mcqAnswers.length === 0) {
          this.addAnswer(eIndex, qIdx);
          this.addAnswer(eIndex, qIdx);
        }
      } else {
        this.matchAnswerTypes.set(this.matchKey(eIndex, qIdx), 'text');
        const mAnsObj = q.answer || q.Answer;
        const mAnswer = mAnsObj ? mAnsObj.answer || mAnsObj.Answer || '' : '';
        qGroup.get('matchAnswer')?.setValue(mAnswer);
      }
    });
    if (questionsList.length === 0) {
      this.addQuestion(eIndex);
    }
  }

  setExerciseType(eIndex: number, type: ExerciseType): void {
    this.exercises.at(eIndex).get('type')?.setValue(type);
    // Reset questions when switching type
    const qs = this.questions(eIndex);
    while (qs.length) qs.removeAt(0);
    this.aiLettersMaps.delete(eIndex);
    this.activeAlphabetTabs.delete(eIndex);
    if (type !== 'AI') {
      this.addQuestion(eIndex);
    }
  }

  // ── Question management ────────────────────────────────

  addQuestion(eIndex: number): void {
    const questionGroup = this.fb.group({
      id: [null],
      prompt_text: [''],
      score: [10, [Validators.required, Validators.min(1)]],
      matchAnswer: [''], // used only for Matching type
      matchAnswerId: [null],
      answers: this.fb.array([]),
    });
    this.questions(eIndex).push(questionGroup);
    const qIndex = this.questions(eIndex).length - 1;
    // Default to 'text' for matching answer
    this.matchAnswerTypes.set(this.matchKey(eIndex, qIndex), 'text');
    // Add initial MCQ choices
    this.addAnswer(eIndex, qIndex);
    this.addAnswer(eIndex, qIndex);
  }

  removeQuestion(eIndex: number, qIndex: number): void {
    const count = this.answers(eIndex, qIndex).length;
    for (let a = 0; a < count; a++) {
      const key = this.aImgKey(eIndex, qIndex, a);
      this.answerImages.delete(key);
      this.answerTypes.delete(key);
    }
    this.questionImages.delete(this.qImgKey(eIndex, qIndex));
    this.matchAnswerImages.delete(this.matchKey(eIndex, qIndex));
    this.matchAnswerTypes.delete(this.matchKey(eIndex, qIndex));
    this.questions(eIndex).removeAt(qIndex);
  }

  // ── MCQ Answer management ──────────────────────────────

  addAnswer(eIndex: number, qIndex: number): void {
    const answerGroup = this.fb.group({
      id: [null],
      answer: [''],
      isCorrect: [false],
    });
    this.answers(eIndex, qIndex).push(answerGroup);
    const aIndex = this.answers(eIndex, qIndex).length - 1;
    this.answerTypes.set(this.aImgKey(eIndex, qIndex, aIndex), 'text');
  }

  removeAnswer(eIndex: number, qIndex: number, aIndex: number): void {
    const key = this.aImgKey(eIndex, qIndex, aIndex);
    this.answers(eIndex, qIndex).removeAt(aIndex);
    this.answerImages.delete(key);
    this.answerTypes.delete(key);
  }

  toggleCorrect(eIndex: number, qIndex: number, aIndex: number): void {
    this.answers(eIndex, qIndex).controls.forEach((ctrl, i) => {
      ctrl.get('isCorrect')?.setValue(i === aIndex);
    });
  }

  hasCorrectAnswer(eIndex: number, qIndex: number): boolean {
    return this.answers(eIndex, qIndex).controls.some((c) => c.get('isCorrect')?.value === true);
  }

  // ── MCQ Answer type ────────────────────────────────────

  getMcqAnswerType(eIndex: number, qIndex: number, aIndex: number): AnswerType {
    return this.answerTypes.get(this.aImgKey(eIndex, qIndex, aIndex)) ?? 'text';
  }

  setMcqAnswerType(eIndex: number, qIndex: number, aIndex: number, type: AnswerType): void {
    const key = this.aImgKey(eIndex, qIndex, aIndex);
    this.answerTypes.set(key, type);
    if (type === 'text') {
      this.answerImages.delete(key);
    } else {
      this.answers(eIndex, qIndex).at(aIndex).get('answer')?.setValue('');
    }
  }

  // ── Matching Answer type ───────────────────────────────

  getMatchAnswerType(eIndex: number, qIndex: number): AnswerType {
    return this.matchAnswerTypes.get(this.matchKey(eIndex, qIndex)) ?? 'text';
  }

  setMatchAnswerType(eIndex: number, qIndex: number, type: AnswerType): void {
    this.matchAnswerTypes.set(this.matchKey(eIndex, qIndex), type);
    if (type === 'text') {
      this.matchAnswerImages.delete(this.matchKey(eIndex, qIndex));
    }
  }

  // ── File pickers ───────────────────────────────────────

  onQuestionImageSelect(event: Event, eIndex: number, qIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const key = this.qImgKey(eIndex, qIndex);
    this.questionImages.set(key, file);
    const reader = new FileReader();
    reader.onload = (e) => this.questionPreviews.set(key, e.target!.result as string);
    reader.readAsDataURL(file);
  }

  onMcqAnswerImageSelect(event: Event, eIndex: number, qIndex: number, aIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const key = this.aImgKey(eIndex, qIndex, aIndex);
    this.answerImages.set(key, file);
    const reader = new FileReader();
    reader.onload = (e) => this.answerPreviews.set(key, e.target!.result as string);
    reader.readAsDataURL(file);
  }

  onMatchAnswerImageSelect(event: Event, eIndex: number, qIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const key = this.matchKey(eIndex, qIndex);
    this.matchAnswerImages.set(key, file);
    const reader = new FileReader();
    reader.onload = (e) => this.matchAnswerPreviews.set(key, e.target!.result as string);
    reader.readAsDataURL(file);
  }

  getQuestionPreview(eIndex: number, qIndex: number): string {
    const key = this.qImgKey(eIndex, qIndex);
    return this.questionPreviews.get(key) || this.existingQuestionImgPaths.get(key) || '';
  }

  getMcqAnswerPreview(eIndex: number, qIndex: number, aIndex: number): string {
    const key = this.aImgKey(eIndex, qIndex, aIndex);
    return this.answerPreviews.get(key) || this.existingAnswerImgPaths.get(key) || '';
  }

  getMatchAnswerPreview(eIndex: number, qIndex: number): string {
    const key = this.matchKey(eIndex, qIndex);
    return this.matchAnswerPreviews.get(key) || this.existingMatchImgPaths.get(key) || '';
  }

  getQuestionImageName(eIndex: number, qIndex: number): string {
    return this.questionImages.get(this.qImgKey(eIndex, qIndex))?.name ?? '';
  }

  getMcqAnswerImageName(eIndex: number, qIndex: number, aIndex: number): string {
    return this.answerImages.get(this.aImgKey(eIndex, qIndex, aIndex))?.name ?? '';
  }

  getMatchAnswerImageName(eIndex: number, qIndex: number): string {
    return this.matchAnswerImages.get(this.matchKey(eIndex, qIndex))?.name ?? '';
  }

  // ── Validation helpers ─────────────────────────────────

  mcqAnswerHasContent(eIndex: number, qIndex: number, aIndex: number): boolean {
    const type = this.getMcqAnswerType(eIndex, qIndex, aIndex);
    if (type === 'text') {
      const text: string = this.answers(eIndex, qIndex).at(aIndex).get('answer')?.value ?? '';
      return text.trim().length > 0;
    }
    // Image type: accept a newly uploaded file OR an existing Cloudinary URL
    const key = this.aImgKey(eIndex, qIndex, aIndex);
    return this.answerImages.has(key) || this.existingAnswerImgPaths.has(key);
  }

  allMcqAnswersHaveContent(eIndex: number, qIndex: number): boolean {
    const count = this.answers(eIndex, qIndex).length;
    for (let a = 0; a < count; a++) {
      if (!this.mcqAnswerHasContent(eIndex, qIndex, a)) return false;
    }
    return true;
  }

  matchAnswerHasContent(eIndex: number, qIndex: number): boolean {
    const type = this.getMatchAnswerType(eIndex, qIndex);
    if (type === 'text') {
      const val: string = this.questions(eIndex).at(qIndex).get('matchAnswer')?.value ?? '';
      return val.trim().length > 0;
    }
    // Image type: accept a newly uploaded file OR an existing Cloudinary URL
    const key = this.matchKey(eIndex, qIndex);
    return this.matchAnswerImages.has(key) || this.existingMatchImgPaths.has(key);
  }

  // ── Submit ─────────────────────────────────────────────

  onSubmit(): void {
    this.submitError = '';

    if (this.levelForm.invalid) {
      this.levelForm.markAllAsTouched();

      const errs: string[] = [];
      if (this.levelForm.get('name')?.invalid) errs.push('Level Title');
      if (this.levelForm.get('passingGradePercentage')?.invalid) errs.push('Passing Grade');

      for (let e = 0; e < this.exercises.length; e++) {
        const exGrp = this.exercises.at(e);
        if (exGrp.get('name')?.invalid) errs.push(`Exercise ${e + 1} Name`);
        const qs = this.questions(e);
        for (let q = 0; q < qs.length; q++) {
          const qGrp = qs.at(q);

          if (qGrp.get('score')?.invalid) errs.push(`Exercise ${e + 1} Question ${q + 1} Score`);
        }
      }

      this.submitError = 'Invalid fields: ' + errs.join(', ') + '. Please fix them.';
      this.toastr.warning(this.submitError, 'Warning');
      return;
    }

    // Validate each exercise's questions
    for (let e = 0; e < this.exercises.length; e++) {
      const type = this.getExerciseType(e);
      if (type === 'AI') {
        if (this.getAiLettersMap(e).size === 0) {
          this.submitError = `Exercise ${
            e + 1
          }: Select at least one letter for the AI Sign Language test.`;
          return;
        }
        continue;
      }
      const qCount = this.questions(e).length;

      for (let q = 0; q < qCount; q++) {
        if (type === 'MCQ') {
          if (!this.hasCorrectAnswer(e, q)) {
            this.submitError = `Exercise ${e + 1}, Question ${
              q + 1
            }: mark at least one answer as correct.`;
            return;
          }
          if (!this.allMcqAnswersHaveContent(e, q)) {
            this.submitError = `Exercise ${e + 1}, Question ${
              q + 1
            }: all answer choices need content.`;
            return;
          }
        } else {
          if (!this.matchAnswerHasContent(e, q)) {
            this.submitError = `Exercise ${e + 1}, Question ${
              q + 1
            }: provide a correct answer for matching.`;
            return;
          }
        }
      }
    }

    if (!this.subjectId) return;

    this.isSubmitting = true;
    this.submitSuccess = false;

    const formData = new FormData();
    formData.append('Sid', this.subjectId);
    if (this.lessonId) formData.append('Lid', this.lessonId);
    formData.append('Name', this.levelForm.get('name')?.value);
    formData.append(
      'PassingGradePercentage',
      String(this.levelForm.get('passingGradePercentage')?.value)
    );
    formData.append('levelDifficulty', this.levelForm.get('levelDifficulty')?.value);

    if (this.quizId) formData.append('Id', this.quizId);

    // Prerequisite
    const prereqType: number = this.selectedPrereqType;
    const prereqId: string | null = this.levelForm.get('perquisiteId')?.value;
    formData.append('perquisiteType', prereqType.toString());
    if (prereqType !== PerquisiteType.None && prereqId) {
      formData.append('perquisite', prereqId);
    }

    this.exercises.value.forEach((ex: any, eIndex: number) => {
      if (ex.id) formData.append(`ExerciseDTOs[${eIndex}].Id`, ex.id);
      formData.append(`ExerciseDTOs[${eIndex}].Name`, ex.name);
      const typeVal = ex.type === 'AI' ? '3' : ex.type === 'Matching' ? '2' : '1';
      formData.append(`ExerciseDTOs[${eIndex}].Type`, typeVal);

      if (ex.type === 'AI') {
        let idx = 0;
        this.getAiLettersMap(eIndex).forEach((rounds, letter) => {
          formData.append(`ExerciseDTOs[${eIndex}].AI_letters[${idx}].Key`, letter);
          formData.append(`ExerciseDTOs[${eIndex}].AI_letters[${idx}].Value`, String(rounds));
          idx++;
        });
        return;
      }

      ex.questions.forEach((q: any, qIndex: number) => {
        if (q.id) formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Qid`, q.id);
        formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].prompt_text`, q.prompt_text);
        formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].score`, String(q.score));

        const qImg = this.questionImages.get(this.qImgKey(eIndex, qIndex));
        if (qImg)
          formData.append(
            `ExerciseDTOs[${eIndex}].questions[${qIndex}].prompt_image`,
            qImg,
            qImg.name
          );

        if (ex.type === 'MCQ') {
          q.answers.forEach((a: any, aIndex: number) => {
            if (a.id)
              formData.append(
                `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].Id`,
                a.id
              );
            const key = this.aImgKey(eIndex, qIndex, aIndex);
            const ansType = this.answerTypes.get(key) ?? 'text';
            if (ansType === 'text') {
              formData.append(
                `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].answer`,
                a.answer ?? ''
              );
            } else {
              const aImg = this.answerImages.get(key);
              if (aImg)
                formData.append(
                  `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].IMG`,
                  aImg,
                  aImg.name
                );
              formData.append(
                `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].answer`,
                ''
              );
            }
            formData.append(
              `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].isCorrect`,
              String(a.isCorrect)
            );
          });
        } else {
          // Matching: single Answer field
          if (q.matchAnswerId)
            formData.append(
              `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.Id`,
              q.matchAnswerId
            );
          const mKey = this.matchKey(eIndex, qIndex);
          const mType = this.matchAnswerTypes.get(mKey) ?? 'text';
          if (mType === 'text') {
            const mText: string = this.questions(eIndex).at(qIndex).get('matchAnswer')?.value ?? '';
            formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.answer`, mText);
          } else {
            const mImg = this.matchAnswerImages.get(mKey);
            if (mImg)
              formData.append(
                `ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.IMG`,
                mImg,
                mImg.name
              );
            formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.answer`, '');
          }
        }
      });
    });

    this.teacherService.editQuiz(formData).subscribe({
      next: () => {
        setTimeout(() => {
          this.toastr.success('Quiz updated successfully.', 'Success');
        }, 850);
        this.isSubmitting = false;
        this.submitSuccess = true;
        setTimeout(() => {
          if (this.subjectId) {
            if (this.lessonId)
              this.router.navigate([
                '/teacher/subject',
                this.subjectId,
                'lesson',
                this.lessonId,
                'manage',
              ]);
            else this.router.navigate(['/teacher/subject', this.subjectId, 'quizzes']);
          }
        }, 1500);
      },
      error: (err: any) => {
        console.error(err);
        this.submitError = err?.error?.message ?? 'Failed to edit exercise. Please try again.';
        setTimeout(() => {
          this.toastr.error(this.submitError, 'Error');
        }, 850);
        this.isSubmitting = false;
      },
    });
  }

  backUrl(): string[] {
    if (this.lessonId && this.quizId) {
      return [
        '/teacher/subject',
        this.subjectId!,
        'lesson',
        this.lessonId,
        'exercise',
        'view',
        this.quizId,
      ];
    }
    return ['/teacher/subject', this.subjectId!];
  }

  // ── Helper for template: add matchAnswer control lazily ─

  ensureMatchAnswerControl(eIndex: number, qIndex: number): void {
    const qGroup = this.questions(eIndex).at(qIndex) as FormGroup;
    if (!qGroup.contains('matchAnswer')) {
      qGroup.addControl('matchAnswer', this.fb.control(''));
    }
  }
}
