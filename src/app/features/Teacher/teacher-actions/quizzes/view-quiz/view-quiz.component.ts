import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeacherServiceService } from '../../../services/teacher-service.service';

@Component({
  selector: 'app-view-quiz',
  imports: [CommonModule, RouterLink],
  templateUrl: './view-quiz.component.html',
  styleUrl: './view-quiz.component.css',
})
export class ViewQuizComponent implements OnInit {
  subjectId = signal<string>('');
  quizId = signal<string>('');
  quizData = signal<any>(null);
  isLoading = signal<boolean>(true);
  lessonId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherServiceService
  ) { }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      const parentSid = params.get('sid');
      if (parentSid) {
        this.subjectId.set(parentSid);
      }
    });

    this.route.paramMap.subscribe(params => {
      const sid = params.get('sid');
      const qid = params.get('qid');
      const lid = params.get('lid');
      if (sid) this.subjectId.set(sid);
      if (lid) this.lessonId.set(lid);
      if (qid) {
        this.quizId.set(qid);
        this.fetchQuizDetails(qid);
      }
    });

    if (!this.subjectId() && this.quizId()) {
      // If we don't have subjectId, we can't call viewQuiz which requires sid
      console.warn('Subject ID is required to fetch quiz details.');
    }
  }

  get quizTitle(): string {
    const data = this.quizData();
    if (!data) return 'Untitled Quiz';
    const name = data.name || data.Name || data.title || data.Title || data.levelName || data.LevelName;
    return typeof name === 'string' && name.trim().length > 0 ? name : 'Untitled Quiz';
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

  get quizPassingPercentage(): number {
    const data = this.quizData();
    if (!data) return 0;
    return data.passingPercentage ?? data.PassingPercentage ?? data.passingGrade ?? data.PassingGrade ?? 0;
  }

  fetchQuizDetails(qid: string) {
    this.isLoading.set(true);
    this.teacherService.viewQuiz(this.subjectId(), qid, this.lessonId()).subscribe({
      next: (res: any) => {
        this.quizData.set(res?.result || res?.data || res || null);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching quiz:', err);
        this.quizData.set(null);
        this.isLoading.set(false);
      }
    });
  }

  get exercises(): any[] {
    const data = this.quizData();
    if (!data) return [];

    // If the response is directly an array of exercises
    if (Array.isArray(data)) return data;

    // If the response is an object containing an exercises list
    if (data.Exercise && Array.isArray(data.Exercise)) return data.Exercise;
    if (data.exercise && Array.isArray(data.exercise)) return data.exercise;
    if (data.exercises && Array.isArray(data.exercises)) return data.exercises;
    if (data.Exercises && Array.isArray(data.Exercises)) return data.Exercises;
    if (data.questions && Array.isArray(data.questions)) return data.questions;
    if (data.Questions && Array.isArray(data.Questions)) return data.Questions;
    if (data.items && Array.isArray(data.items)) return data.items;

    return [];
  }
}
