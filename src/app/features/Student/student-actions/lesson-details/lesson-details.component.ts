import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentServiceService } from '../../services/student-service.service';
import { IStudLessonContentResult, IStudVideo } from '../../interfaces/IStudLessonContent';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lesson-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './lesson-details.component.html',
  styleUrl: './lesson-details.component.css',
})
export class LessonDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentServiceService);

  subjectId!: string;
  lessonId!: string;

  lesson: IStudLessonContentResult | null = null;
  videos: IStudVideo[] = [];
  activeVideoIndex = 0;
  isLoading = true;
  hasActivities = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.subjectId = params.get('sid') || '';
      this.lessonId = params.get('lid') || '';

      if (this.subjectId && this.lessonId) {
        this.loadLesson();
      }
    });
  }

  loadLesson(): void {
    this.isLoading = true;
    this.studentService.getLessonDetails(this.subjectId, this.lessonId).subscribe({
      next: (res) => {
        this.lesson = res.result;
        if (this.lesson) {
          // Normalize casing and handle nlid fallback from response
          const rawResult = res.result as any;
          this.lesson.nlid = rawResult.nlid || rawResult.Nlid;
          this.lesson.next = rawResult.next || rawResult.Next || this.lesson.nlid;
          this.lesson.nextType = rawResult.nextType ?? rawResult.NextType;
        }
        this.videos = res.result?.videos || [];
        this.activeVideoIndex = 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  isImage(url: string): boolean {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;
  }

  get activeVideo(): IStudVideo | null {
    return this.videos[this.activeVideoIndex] || null;
  }

  get isLastVideo(): boolean {
    return this.activeVideoIndex >= this.videos.length - 1;
  }

  get levelDataAccessor(): any {
    if (!this.lesson) return null;
    return (
      this.lesson.levels ||
      (this.lesson as any).Levels ||
      (this.lesson as any).level ||
      (this.lesson as any).Level
    );
  }

  get isLocked(): boolean {
    return !!this.lesson?.locked || !!(this.lesson as any)?.Locked;
  }

  get hasExercise(): boolean {
    return !!this.levelDataAccessor;
  }

  get exerciseId(): string {
    const levelData = this.levelDataAccessor;
    if (!levelData) return '';
    if (typeof levelData === 'string') return levelData;

    if (Array.isArray(levelData)) {
      const first = levelData[0];
      if (!first) return '';
      return first.id || first.ID || first.Id || first.iD || '';
    }
    return levelData.id || levelData.ID || levelData.Id || levelData.iD || '';
  }

  get buttonLabel(): string {
    if (this.hasExercise) {
      return 'STUDENT.LESSON.JUMP_EXERCISES';
    }
    return this.isLastVideo ? 'STUDENT.LESSON.COMPLETE_LESSON' : 'STUDENT.LESSON.NEXT_VIDEO';
  }

  goNextOrComplete(): void {
    if (this.hasExercise) {
      const eid = this.exerciseId;
      if (eid) {
        this.router.navigate([
          '/student/subject',
          this.subjectId,
          'lesson',
          this.lessonId,
          'exercise',
          eid,
          'solve',
        ]);
      } else {
        alert(
          'Exercise Found but ID is missing from object! Raw Data: ' +
          JSON.stringify(this.levelDataAccessor)
        );
      }
      return;
    }

    if (!this.isLastVideo) {
      this.activeVideoIndex++;
      return;
    }

    this.isLoading = true;
    this.studentService.completeLesson(this.subjectId, this.lessonId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('Lesson completion response:', res);
        const data = res?.result || res;

        // Handle all possible casing for next/nextId and nextType
        const nextId = data?.next || data?.Next || data?.nextId || data?.NextId || data?.id || data?.Id;
        const rawType = data?.nextType ?? data?.NextType ?? data?.type ?? data?.Type;
        const nextType = (rawType !== undefined && rawType !== null) ? Number(rawType) : null;

        console.log('Parsed redirection data:', { nextId, nextType, message: res?.message });

        // Redirection logic: nextType 1 = Lesson, 2 = Quiz
        if (nextId && nextType) {
          if (nextType === 1) {
            this.router.navigate(['/student/subject', this.subjectId, 'lesson', nextId]);
          } else if (nextType === 2) {
            this.router.navigate(['/student/subject', this.subjectId, 'quizzes', nextId, 'solve']);
          } else {
            this.router.navigate(['/student/subject', this.subjectId]);
          }
        } else {
          this.router.navigate(['/student/subject', this.subjectId]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to complete lesson', err);
      },
    });
  }

  getNextActivityLink(): any[] {
    if (!this.lesson) return [];
    const nlid = this.lesson.nlid || (this.lesson as any).Nlid;
    const nextId = this.lesson.next || (this.lesson as any).Next || nlid;
    const nextType = this.lesson.nextType ?? (this.lesson as any).NextType;

    if (nextType === 1) {
      return ['/student/subject', this.subjectId, 'lesson', nextId];
    } else if (nextType === 2) {
      return ['/student/subject', this.subjectId, 'quizzes', nextId, 'solve'];
    }
    return [];
  }
}
