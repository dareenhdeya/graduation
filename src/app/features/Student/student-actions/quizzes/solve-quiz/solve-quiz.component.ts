import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { StudentServiceService } from '../../../services/student-service.service';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

interface QuizState {
  status: 'pre-start' | 'in-progress' | 'submitting' | 'completed';
}

@Component({
  selector: 'app-solve-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
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
  
  // Timer state
  durationMinutes = signal<number>(-1);
  timeLeftSeconds = signal<number>(0);
  timerInterval: any;

  // Form to hold answers
  quizForm!: FormGroup;

  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<'success'|'error'>('success');
  toastTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private studentService: StudentServiceService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.quizForm = this.fb.group({
      exercises: this.fb.array([])
    });

    this.route.paramMap.subscribe(params => {
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
  }

  get quizTitle(): string {
    const data = this.quizData();
    if (!data) return 'Untitled';
    return data.name || data.Name || data.title || data.Title || data.levelName || 'Untitled';
  }

  get quizDifficulty(): string {
    const data = this.quizData();
    if (!data) return 'Medium';
    const diff = data.levelDifficulty ?? data.difficulty ?? data.Difficulty;
    if (diff === 1) return 'Easy';
    if (diff === 2) return 'Medium';
    if (diff === 3) return 'Hard';
    return typeof diff === 'string' ? diff : 'Medium';
  }

  get exercisesFormArray() {
    return this.quizForm.get('exercises') as FormArray;
  }

  get formattedTime(): string {
    const totalSeconds = this.timeLeftSeconds();
    if (totalSeconds <= 0) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  fetchQuizDetails(qid: string) {
    this.isLoading.set(true);
    const sid = this.subjectId();
    const lid = this.lessonId();
    
    let sub$;
    if (lid) {
      sub$ = this.studentService.viewExercise(sid, lid, qid);
    } else {
      sub$ = this.studentService.startQuiz(sid, qid);
    }

    sub$.subscribe({
      next: (res: any) => {
        const data = res?.result || res?.data || res || null;
        this.quizData.set(data);
        if (data && (data.durationInMinutes !== undefined || data.DurationInMinutes !== undefined)) {
          this.durationMinutes.set(data.durationInMinutes ?? data.DurationInMinutes ?? -1);
        }
        this.initializeForm(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching quiz:', err);
        this.showToast('Failed to load. Please try again.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  initializeForm(data: any) {
    this.exercisesFormArray.clear();
    const exercisesList = this.getExercisesList(data);
    
    exercisesList.forEach((exercise: any) => {
      const qList = exercise.questions || exercise.Questions || [];
      const questionsArray = this.fb.array(
        qList.map((q: any) => this.fb.group({
          questionId: [q.Qid || q.qid || q.id || q.Id],
          prompt_text: [q.prompt_text || q.text || q.question || q.title || 'Untitled Question'],
          selectedAnswerId: [null]
        }))
      );

      this.exercisesFormArray.push(this.fb.group({
        exerciseId: [exercise.id || exercise.Id],
        exerciseType: [exercise.exerciseType ?? exercise.ExerciseType ?? exercise.type ?? exercise.Type],
        questions: questionsArray
      }));
    });
  }

  getExercisesList(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.Exercise && Array.isArray(data.Exercise)) return data.Exercise;
    if (data.exercise && Array.isArray(data.exercise)) return data.exercise;
    if (data.exercises && Array.isArray(data.exercises)) return data.exercises;
    if (data.Exercises && Array.isArray(data.Exercises)) return data.Exercises;
    return [];
  }

  // State Transitions
  startQuiz() {
    this.quizState.set('in-progress');
    this.loadDraft();
    
    const minutes = this.durationMinutes();
    if (minutes > 0) {
      this.timeLeftSeconds.set(minutes * 60);
      this.timerInterval = setInterval(() => {
        const current = this.timeLeftSeconds();
        if (current <= 1) {
          clearInterval(this.timerInterval);
          this.timeLeftSeconds.set(0);
          this.autoSubmit();
        } else {
          this.timeLeftSeconds.set(current - 1);
        }
      }, 1000);
    }
  }

  // Caching mechanism
  get draftKey(): string {
    // Ideally we would include studentId here if it was readily available in the component, but we can fall back to this:
    return `quiz_draft_${this.quizId()}`;
  }

  saveDraft() {
    if (this.quizState() !== 'in-progress') return;
    const value = this.quizForm.value;
    localStorage.setItem(this.draftKey, JSON.stringify(value));
    this.showToast('Progress saved locally.', 'success');
  }

  loadDraft() {
    const draftStr = localStorage.getItem(this.draftKey);
    if (draftStr) {
      try {
        const value = JSON.parse(draftStr);
        this.quizForm.patchValue(value);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }

  clearDraft() {
    localStorage.removeItem(this.draftKey);
  }

  // Submission
  autoSubmit() {
    this.showToast('Time is up! Submitting answers automatically...', 'error');
    this.submitQuiz();
  }

  submitQuiz() {
    this.quizState.set('submitting');
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    // Parse form to CreateSubmissionDTO
    const formValue = this.quizForm.value;
    const sedtos: any[] = [];

    formValue.exercises.forEach((ex: any) => {
      const sadtos: any[] = [];
      ex.questions.forEach((q: any) => {
        if (q.selectedAnswerId) {
          sadtos.push({
            Qid: q.questionId,
            Aid: q.selectedAnswerId
          });
        }
      });
      
      sedtos.push({
        Eid: ex.exerciseId,
        SADTO: sadtos
      });
    });

    const payload = {
      SubjectFK: this.subjectId(),
      LevelFK: this.quizId(),
      LessonID: this.lessonId() || null,
      sEDTOs: sedtos
    };

    this.studentService.submitAnswers(payload).subscribe({
      next: (res) => {
        this.clearDraft();
        this.quizState.set('completed');
        this.showToast('Successfully submitted answers!', 'success');
        
        setTimeout(() => {
          if (this.lessonId()) {
            this.router.navigate(['/student/subject', this.subjectId(), 'lesson', this.lessonId()]);
          } else {
            this.router.navigate(['/student/subject', this.subjectId()]);
          }
        }, 2000);
      },
      error: (err) => {
        console.error('Submit error:', err);
        this.showToast('Failed to submit. You can save your draft and try later.', 'error');
        this.quizState.set('in-progress'); // allow them to retry
      }
    });
  }

  // Toast
  showToast(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      this.toastr.success(message, 'Success');
    } else {
      this.toastr.error(message, 'Error');
    }
  }

  // UI Helpers (borrowed from view-quiz)
  getExerciseQuestions(exIdx: number): any[] {
    const list = this.getExercisesList(this.quizData());
    if (!list || !list[exIdx]) return [];
    return list[exIdx].questions || list[exIdx].Questions || [];
  }

  // For matching UX: Tracks which question the student has currently "selected" to match an answer to
  activeMatchingQuestion = signal<{ eIdx: number; qIdx: number } | null>(null);

  // Set the active question for matching
  setActiveQuestion(eIdx: number, qIdx: number) {
    this.activeMatchingQuestion.set({ eIdx, qIdx });
  }

  // Set the correct answer for Matching and MCQ exercises via clicking
  selectAnswer(exIdx: number, qIdx: number | null, answerId: string) {
    if (this.quizState() !== 'in-progress') return;
    
    // If qIdx is null, it means we clicked an answer from the Global Matching Bank.
    // We must map it to the explicitly "active" left-hand question!
    if (qIdx === null) {
      const active = this.activeMatchingQuestion();
      if (!active || active.eIdx !== exIdx) {
        this.showToast('Please tap a question on the left first to select what you are answering!', 'error');
        return; 
      }
      qIdx = active.qIdx;
    }

    const exArray = this.exercisesFormArray.at(exIdx).get('questions') as FormArray;
    
    // Optimization: if they click the exact same mapped answer again, un-map it!
    const currentVal = exArray.at(qIdx).get('selectedAnswerId')?.value;
    if (currentVal === answerId) {
       exArray.at(qIdx).get('selectedAnswerId')?.setValue(null);
    } else {
       exArray.at(qIdx).get('selectedAnswerId')?.setValue(answerId);
    }
  }

  // Helper to determine if an answer is currently physically assigned to ANY question in this exercise
  isAnswerMapped(exIdx: number, answerId: string): boolean {
    const exArray = this.exercisesFormArray.at(exIdx).get('questions') as FormArray;
    for (let i = 0; i < exArray.length; i++) {
       if (exArray.at(i).get('selectedAnswerId')?.value === answerId) return true;
    }
    return false;
  }

  // Helper to visually look up the text of the mapped answer for a matching question box
  getMappedAnswerText(exIdx: number, qIdx: number): string {
     const exArray = this.exercisesFormArray.at(exIdx).get('questions') as FormArray;
     const mappedId = exArray.at(qIdx).get('selectedAnswerId')?.value;
     if (!mappedId) return '';
     
     const answers = this.getExerciseAnswers(exIdx);
     const mappedItem = answers.find(a => (a.id || a.Id || a.aid || a.Aid) === mappedId);
     return mappedItem ? (mappedItem.answer || mappedItem.title || mappedItem.Answer) : '';
  }

  getExerciseAnswers(exIdx: number): any[] {
    const list = this.getExercisesList(this.quizData());
    if (!list || !list[exIdx]) return [];
    return list[exIdx].answers || list[exIdx].Answers || this.getQuestionAnswers(list[exIdx].questions?.[0] || list[exIdx].Questions?.[0]);
  }

  getQuestionAnswers(q: any): any[] {
    if (!q) return [];
    return q.answers || q.Answers || q.options || q.Options || [];
  }
}
