import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { ToastrService } from 'ngx-toastr';

type AnswerType = 'text' | 'image';
type ExerciseType = 'MCQ' | 'Matching';

// Mirrors backend enum: None = 0, Lesson = 1, Quiz = 2
export enum PerquisiteType {
    None = 0,
    Lesson = 1,
}

@Component({
    selector: 'app-create-quiz',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './create-quiz.component.html',
    styleUrl: './create-quiz.component.css',
})
export class CreateQuizComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly teacherService = inject(TeacherServiceService);
    private toastr = inject(ToastrService);

    subjectId: string | null = null;
    lessonId: string | null = null;

    isSubmitting = false;
    submitSuccess = false;
    submitError = '';

    difficulties = ['Easy', 'Medium', 'Hard'];

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

    // ── Key helpers ────────────────────────────────────────

    private qImgKey(eIdx: number, qIdx: number): string { return `${eIdx}-${qIdx}`; }
    private aImgKey(eIdx: number, qIdx: number, aIdx: number): string { return `${eIdx}-${qIdx}-${aIdx}`; }
    private matchKey(eIdx: number, qIdx: number): string { return `${eIdx}-${qIdx}-match`; }

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
        this.addExercise();
    }

    // ── Exercise management ────────────────────────────────

    addExercise(): void {
        const group = this.fb.group({
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
        for (const key of [...this.questionImages.keys(), ...this.answerImages.keys(), ...this.matchAnswerImages.keys(), ...this.matchAnswerTypes.keys(), ...this.answerTypes.keys()]) {
            if (key.startsWith(`${eIndex}-`)) {
                this.questionImages.delete(key);
                this.answerImages.delete(key);
                this.matchAnswerImages.delete(key);
                this.matchAnswerTypes.delete(key);
                this.answerTypes.delete(key);
            }
        }
        this.exercises.removeAt(eIndex);
    }

    setExerciseType(eIndex: number, type: ExerciseType): void {
        this.exercises.at(eIndex).get('type')?.setValue(type);
        // Reset questions when switching type
        const qs = this.questions(eIndex);
        while (qs.length) qs.removeAt(0);
        this.addQuestion(eIndex);
    }

    // ── Question management ────────────────────────────────

    addQuestion(eIndex: number): void {
        const questionGroup = this.fb.group({
            prompt_text: ['', [Validators.required, Validators.minLength(3)]],
            score: [10, [Validators.required, Validators.min(1)]],
            matchAnswer: [''],        // used only for Matching type
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
        return this.answers(eIndex, qIndex).controls.some(c => c.get('isCorrect')?.value === true);
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
        if (input.files?.length) {
            this.questionImages.set(this.qImgKey(eIndex, qIndex), input.files[0]);
        }
    }

    onMcqAnswerImageSelect(event: Event, eIndex: number, qIndex: number, aIndex: number): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.answerImages.set(this.aImgKey(eIndex, qIndex, aIndex), input.files[0]);
        }
    }

    onMatchAnswerImageSelect(event: Event, eIndex: number, qIndex: number): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.matchAnswerImages.set(this.matchKey(eIndex, qIndex), input.files[0]);
        }
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

    // ── Submit ─────────────────────────────────────────────

    onSubmit(): void {
        this.submitError = '';

        if (this.levelForm.invalid) {
            this.toastr.warning('Please fill in all required fields.', 'Warning');
            this.levelForm.markAllAsTouched();
            return;
        }

        // Validate each exercise's questions
        for (let e = 0; e < this.exercises.length; e++) {
            const type = this.getExerciseType(e);
            const qCount = this.questions(e).length;

            for (let q = 0; q < qCount; q++) {
                if (type === 'MCQ') {
                    if (!this.hasCorrectAnswer(e, q)) {
                        this.submitError = `Exercise ${e + 1}, Question ${q + 1}: mark at least one answer as correct.`;
                        return;
                    }
                    if (!this.allMcqAnswersHaveContent(e, q)) {
                        this.submitError = `Exercise ${e + 1}, Question ${q + 1}: all answer choices need content.`;
                        return;
                    }
                } else {
                    if (!this.matchAnswerHasContent(e, q)) {
                        this.submitError = `Exercise ${e + 1}, Question ${q + 1}: provide a correct answer for matching.`;
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
        formData.append('PassingGradePercentage', String(this.levelForm.get('passingGradePercentage')?.value));
        formData.append('levelDifficulty', this.levelForm.get('levelDifficulty')?.value);

        // Prerequisite
        const prereqType: number = this.selectedPrereqType;
        const prereqId: string | null = this.levelForm.get('perquisiteId')?.value;
        formData.append('PerquisiteType', prereqType.toString());
        if (prereqType !== PerquisiteType.None && prereqId) {
            formData.append('PerquisiteID', prereqId);
        }

        this.exercises.value.forEach((ex: any, eIndex: number) => {
            formData.append(`ExerciseDTOs[${eIndex}].Name`, ex.name);
            const typeVal = ex.type === 'MCQ' ? '1' : '2';
            formData.append(`ExerciseDTOs[${eIndex}].Type`, typeVal);

            ex.questions.forEach((q: any, qIndex: number) => {
                formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].prompt_text`, q.prompt_text);
                formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].score`, String(q.score));

                const qImg = this.questionImages.get(this.qImgKey(eIndex, qIndex));
                if (qImg) formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].prompt_image`, qImg, qImg.name);

                if (ex.type === 'MCQ') {
                    q.answers.forEach((a: any, aIndex: number) => {
                        const key = this.aImgKey(eIndex, qIndex, aIndex);
                        const ansType = this.answerTypes.get(key) ?? 'text';
                        if (ansType === 'text') {
                            formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].answer`, a.answer ?? '');
                        } else {
                            const aImg = this.answerImages.get(key);
                            if (aImg) formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].IMG`, aImg, aImg.name);
                            formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].answer`, '');
                        }
                        formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answers[${aIndex}].isCorrect`, String(a.isCorrect));
                    });
                } else {
                    // Matching: single Answer field
                    const mKey = this.matchKey(eIndex, qIndex);
                    const mType = this.matchAnswerTypes.get(mKey) ?? 'text';
                    if (mType === 'text') {
                        const mText: string = this.questions(eIndex).at(qIndex).get('matchAnswer')?.value ?? '';
                        formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.answer`, mText);
                    } else {
                        const mImg = this.matchAnswerImages.get(mKey);
                        if (mImg) formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.IMG`, mImg, mImg.name);
                        formData.append(`ExerciseDTOs[${eIndex}].questions[${qIndex}].Answer.answer`, '');
                    }
                }
            });
        });

        // DEBUG: log all FormData entries
        console.log('--- FormData entries ---');
        formData.forEach((value, key) => console.log(key, value));

        this.teacherService.createExercise(formData).subscribe({
            next: () => {
                setTimeout(() => {
                    this.toastr.success('Quiz created successfully.', 'Success');
                }, 850);
                this.isSubmitting = false;
                this.submitSuccess = true;
                this.levelForm.reset({ name: '', passingGradePercentage: 60, levelDifficulty: 'Easy', perquisiteType: PerquisiteType.None, perquisiteId: null });
                while (this.exercises.length) this.exercises.removeAt(0);
                this.questionImages.clear();
                this.answerImages.clear();
                this.matchAnswerImages.clear();
                this.answerTypes.clear();
                this.matchAnswerTypes.clear();
                this.addExercise();
            },
            error: (err) => {
                console.error(err);
                this.submitError = err?.error?.message ?? 'Failed to create exercise. Please try again.';
                setTimeout(() => {
                    this.toastr.error(this.submitError, 'Error');
                }, 850);
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

    // ── Helper for template: add matchAnswer control lazily ─

    ensureMatchAnswerControl(eIndex: number, qIndex: number): void {
        const qGroup = this.questions(eIndex).at(qIndex) as FormGroup;
        if (!qGroup.contains('matchAnswer')) {
            qGroup.addControl('matchAnswer', this.fb.control(''));
        }
    }
}
