import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentServiceService } from '../../services/student-service.service';
import { IStudLessonContentResult, IStudVideo } from '../../interfaces/IStudLessonContent';

@Component({
  selector: 'app-lesson-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
    this.subjectId = this.route.snapshot.paramMap.get('sid') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lid') || '';

    if (this.subjectId && this.lessonId) {
      this.loadLesson();
    }
  }

  loadLesson(): void {
    this.isLoading = true;
    this.studentService.getLessonDetails(this.subjectId, this.lessonId).subscribe({
      next: (res) => {
        this.lesson = res.result;
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
      return 'Jump to Exercises';
    }
    return this.isLastVideo ? 'Complete Lesson' : 'Next Video';
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

    this.studentService.completeLesson(this.subjectId, this.lessonId).subscribe({
      next: () => {
        console.log('compleeete');
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
