import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StudentServiceService } from '../../services/student-service.service';
import { IStudLessonContentResult, IStudVideo } from '../../interfaces/IStudLessonContent';

@Component({
  selector: 'app-lesson-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-details.component.html',
  styleUrl: './lesson-details.component.css',
})
export class LessonDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
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
        this.hasActivities = false; // set true when Exercises are exposed in API
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

  get buttonLabel(): string {
    if (this.hasActivities) {
      return 'Continue to Activities';
    }
    return this.isLastVideo ? 'Complete Lesson' : 'Next Video';
  }

  goNextOrComplete(): void {
    if (this.hasActivities) {
      // TODO: when activities endpoints are ready, navigate to activities screen for this lesson
      return;
    }

    if (!this.isLastVideo) {
      this.activeVideoIndex++;
      return;
    }

    // Last video and no activities: mark lesson as completed
    this.studentService.completeLesson(this.subjectId, this.lessonId).subscribe({
      
      next: () => {
        console.log("compleeete");
        // Optionally show toast / state change; kept minimal for now
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}

