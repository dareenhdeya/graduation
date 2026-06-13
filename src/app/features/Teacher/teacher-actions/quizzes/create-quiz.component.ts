import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

type AnswerType = 'text' | 'image';
type ExerciseType = 'MCQ' | 'Matching' | 'AI' | 'AIWords';

// Mirrors backend enum: None = 0, Lesson = 1, Quiz = 2
export enum PerquisiteType {
  None = 0,
  Lesson = 1,
}

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './create-quiz.component.html',
  styleUrl: './create-quiz.component.css',
})
export class CreateQuizComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherServiceService);
  private toastr = inject(ToastrService);
  readonly Math = Math;
  subjectId: string | null = null;
  lessonId: string | null = null;

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

  // ── Prerequisite ──
  isLoadingPrerequisites = false;
  prerequisiteOptions: { id: string; title: string }[] = [];

  readonly perquisiteTypes = [
    { value: PerquisiteType.None, label: 'None' },
    { value: PerquisiteType.Lesson, label: 'Lesson' },
  ];

  // ── Image maps ──
  questionImages: Map<string, File> = new Map();
  answerImages: Map<string, File> = new Map();
  matchAnswerImages: Map<string, File> = new Map();

  // Preview Data URLs (generated via FileReader)
  questionPreviews: Map<string, string> = new Map();
  answerPreviews: Map<string, string> = new Map();
  matchAnswerPreviews: Map<string, string> = new Map();

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

  // ── Accessors ──

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

  // ── Key helpers ──

  private qImgKey(eIdx: number, qIdx: number): string {
    return `${eIdx}-${qIdx}`;
  }
  private aImgKey(eIdx: number, qIdx: number, aIdx: number): string {
    return `${eIdx}-${qIdx}-${aIdx}`;
  }
  private matchKey(eIdx: number, qIdx: number): string {
    return `${eIdx}-${qIdx}-match`;
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('sid');
    this.lessonId = this.route.snapshot.paramMap.get('lid');

    if (this.subjectId) {
      this.teacherService.getSubjects().subscribe({
        next: (res) => {
          const sid = this.subjectId?.toLowerCase();
          const subject: any = res?.result?.find(
            (s: any) => s.subjectId?.toLowerCase() === sid || s.id?.toLowerCase() === sid
          );
          console.log('Found Subject:', subject);
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

    this.addExercise();
  }

  // ── AI Methods ──

  getAiLettersMap(eIndex: number): Map<string, number> {
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
    if (!letter.trim()) return;
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

  // ── Prerequisite helpers ──

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
          this.isLoadingPrerequisites = false;
        },
      });
    }
  }

  // ── Exercise management ──

  addExercise(): void {
    const group = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['MCQ'],
      aiWordsCount: [1, [Validators.min(1), Validators.max(50)]],
      questions: this.fb.array([]),
    });
    this.exercises.push(group);
    const eIndex = this.exercises.length - 1;
    this.addQuestion(eIndex);
  }

  removeExercise(eIndex: number): void {
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
    this.aiLettersMaps.delete(eIndex);
    this.activeAlphabetTabs.delete(eIndex);
    this.exercises.removeAt(eIndex);
  }

  clearExercise(eIndex: number): void {
    this.exercises.at(eIndex).get('name')?.setValue('');
    this.aiLettersMaps.delete(eIndex);

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

  resetExercise(eIndex: number): void {
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
    this.aiLettersMaps.delete(eIndex);
    this.activeAlphabetTabs.delete(eIndex);

    const qs = this.questions(eIndex);
    while (qs.length) qs.removeAt(0);
    this.exercises.at(eIndex).get('name')?.setValue('');
    this.exercises.at(eIndex).get('type')?.setValue('MCQ');
    this.addQuestion(eIndex);
  }

  setExerciseType(eIndex: number, type: ExerciseType): void {
    this.exercises.at(eIndex).get('type')?.setValue(type);
    const qs = this.questions(eIndex);
    while (qs.length) qs.removeAt(0);

    if (type !== 'AI' && type !== 'AIWords') {
      this.addQuestion(eIndex);
    }
  }

  // ── Question management ──

  addQuestion(eIndex: number): void {
    const questionGroup = this.fb.group({
      prompt_text: [''],
      score: [10, [Validators.required, Validators.min(1)]],
      matchAnswer: [''],
      answers: this.fb.array([]),
    });
    this.questions(eIndex).push(questionGroup);
    const qIndex = this.questions(eIndex).length - 1;
    this.matchAnswerTypes.set(this.matchKey(eIndex, qIndex), 'text');
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

  // ── MCQ Answer management ──

  addAnswer(eIndex: number, qIndex: number): void {
    const answerGroup = this.fb.group({
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

  // ── Matching Answer type ──

  getMatchAnswerType(eIndex: number, qIndex: number): AnswerType {
    return this.matchAnswerTypes.get(this.matchKey(eIndex, qIndex)) ?? 'text';
  }

  setMatchAnswerType(eIndex: number, qIndex: number, type: AnswerType): void {
    this.matchAnswerTypes.set(this.matchKey(eIndex, qIndex), type);
    if (type === 'text') {
      this.matchAnswerImages.delete(this.matchKey(eIndex, qIndex));
    }
  }
  //ai words
  //   getAiWordsCount(eIndex: number): number {
  //     return this.exercises.at(eIndex).get('aiWordsCount')?.value ?? 1;
  //   }

  //   setAiWordsCount(eIndex: number, count: number): void {
  //     const val = Math.min(50, Math.max(1, count || 1));
  //     this.exercises.at(eIndex).get('aiWordsCount')?.setValue(val);
  //   }
  // ── File pickers ──

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
    return this.questionPreviews.get(this.qImgKey(eIndex, qIndex)) ?? '';
  }
  getMcqAnswerPreview(eIndex: number, qIndex: number, aIndex: number): string {
    return this.answerPreviews.get(this.aImgKey(eIndex, qIndex, aIndex)) ?? '';
  }
  getMatchAnswerPreview(eIndex: number, qIndex: number): string {
    return this.matchAnswerPreviews.get(this.matchKey(eIndex, qIndex)) ?? '';
  }

  // ── Validation helpers ──

  mcqAnswerHasContent(eIndex: number, qIndex: number, aIndex: number): boolean {
    const type = this.getMcqAnswerType(eIndex, qIndex, aIndex);
    if (type === 'text') {
      const text: string = this.answers(eIndex, qIndex).at(aIndex).get('answer')?.value ?? '';
      return text.trim().length > 0;
    }
    return this.answerImages.has(this.aImgKey(eIndex, qIndex, aIndex));
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
    return this.matchAnswerImages.has(this.matchKey(eIndex, qIndex));
  }

  // ── Submit ──

  onSubmit(): void {
    this.submitError = '';

    if (!this.subjectId) return;

    if (this.levelForm.invalid) {
      this.toastr.warning('Please fill in all required fields.', 'Warning');
      this.levelForm.markAllAsTouched();
      return;
    }

    for (let e = 0; e < this.exercises.length; e++) {
      const type = this.getExerciseType(e);
      if (type === 'AI') {
        if (this.getAiLettersMap(e).size === 0) {
          this.submitError = `Exercise ${
            e + 1
          }: Select at least one letter for the AI Sign Language test.`;
          return;
        }
      } else if (type !== 'AIWords') {
        for (let q = 0; q < this.questions(e).length; q++) {
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
          } else if (type === 'Matching') {
            if (!this.matchAnswerHasContent(e, q)) {
              this.submitError = `Exercise ${e + 1}, Question ${
                q + 1
              }: provide a correct answer for matching.`;
              return;
            }
          }
        }
      }
    }

    this.isSubmitting = true;
    this.submitSuccess = false;

    const formData = new FormData();
    formData.append('Sid', this.subjectId!);
    if (this.lessonId) formData.append('Lid', this.lessonId);
    formData.append('Name', this.levelForm.get('name')?.value);
    formData.append(
      'PassingGradePercentage',
      String(this.levelForm.get('passingGradePercentage')?.value)
    );
    formData.append('levelDifficulty', this.levelForm.get('levelDifficulty')?.value);

    const prereqType: number = this.selectedPrereqType;
    const prereqId: string | null = this.levelForm.get('perquisiteId')?.value;
    formData.append('PerquisiteType', prereqType.toString());
    if (prereqType !== PerquisiteType.None && prereqId) {
      formData.append('PerquisiteID', prereqId);
    }

    this.exercises.value.forEach((ex: any, eIndex: number) => {
      formData.append(`ExerciseDTOs[${eIndex}].Name`, ex.name);
      const typeVal =
        ex.type === 'MCQ' ? '1' : ex.type === 'Matching' ? '2' : ex.type === 'AI' ? '3' : '4';

      formData.append(`ExerciseDTOs[${eIndex}].Type`, typeVal);

      if (ex.type === 'AI') {
        let idx = 0;
        this.getAiLettersMap(eIndex).forEach((rounds, letter) => {
          formData.append(`ExerciseDTOs[${eIndex}].AI_letters[${idx}].Key`, letter);
          formData.append(`ExerciseDTOs[${eIndex}].AI_letters[${idx}].Value`, String(rounds));
          idx++;
        });
      } else if (ex.type === 'AIWords') {
        formData.append(`ExerciseDTOs[${eIndex}].Round`, String(ex.aiWordsCount));
      } else {
        ex.questions.forEach((q: any, qIndex: number) => {
          formData.append(
            `ExerciseDTOs[${eIndex}].questions[${qIndex}].prompt_text`,
            q.prompt_text
          );
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
          } else if (ex.type === 'Matching') {
            const mKey = this.matchKey(eIndex, qIndex);
            const mType = this.matchAnswerTypes.get(mKey) ?? 'text';
            if (mType === 'text') {
              const mText: string =
                this.questions(eIndex).at(qIndex).get('matchAnswer')?.value ?? '';
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
      }
    });

    this.teacherService.createExercise(formData).subscribe({
      next: () => {
        setTimeout(() => this.toastr.success('Level created successfully.', 'Success'), 850);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.levelForm.reset({
          name: '',
          passingGradePercentage: 60,
          levelDifficulty: 'Easy',
          perquisiteType: PerquisiteType.None,
          perquisiteId: null,
        });
        while (this.exercises.length) this.exercises.removeAt(0);
        this.questionImages.clear();
        this.answerImages.clear();
        this.matchAnswerImages.clear();
        this.questionPreviews.clear();
        this.answerPreviews.clear();
        this.matchAnswerPreviews.clear();
        this.answerTypes.clear();
        this.matchAnswerTypes.clear();
        this.aiLettersMaps.clear();
        this.activeAlphabetTabs.clear();
        this.addExercise();
      },
      error: (err) => {
        console.error(err);
        this.submitError = err?.error?.message ?? 'Failed to create exercise. Please try again.';
        this.isSubmitting = false;
      },
    });
  }

  backUrl(): string[] {
    if (this.lessonId) {
      return ['/teacher/subject', this.subjectId!, 'lesson', this.lessonId, 'manage'];
    }
    return ['/teacher/subject', this.subjectId!];
  }
}
