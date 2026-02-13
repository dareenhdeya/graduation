import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import this
import { ActivatedRoute, RouterLink } from '@angular/router'; // Import RouterLink
import { StudentServiceService } from './../../services/student-service.service';
import { IStudViewLesson, StudLesson } from '../../interfaces/IStudViewLesson';

@Component({
  selector: 'app-view-lessons',
  standalone: true,
  imports: [CommonModule, RouterLink], // Add imports
  templateUrl: './view-lessons.component.html',
  styleUrl: './view-lessons.component.css',
})
export class ViewLessonsComponent implements OnInit {

  private readonly studentService = inject(StudentServiceService);
  private readonly route = inject(ActivatedRoute);

  subjectId!: string;
  lessons: StudLesson[] = []; 
  isLoading = true;

  // Track the currently playing lesson
  activeLesson: StudLesson | null = null;

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.subjectId) {
      this.viewLessons(this.subjectId);
    }
  }

  viewLessons(subjectId: string) {
    this.isLoading = true;
    this.studentService.getLessons(subjectId).subscribe({
      next: (res: IStudViewLesson) => {
        this.lessons = res.result || [];
        this.isLoading = false;

        // Auto-select the first lesson to play
        if (this.lessons.length > 0) {
          this.activeLesson = this.lessons[0];
        }
        console.log("Lessons:", this.lessons);
      },
      error: (error) => {
        console.log(error.error?.message || 'Error fetching lessons');
        this.isLoading = false;
      }
    });
  }

  
  playLesson(lesson: StudLesson) {
    this.activeLesson = lesson;
    // window.scrollTo({ top: 50, behavior: 'smooth' }); // Scroll to player
  }

  // Helper to detect if the URL is an image/gif (Simple extension check)
  isImage(url: string): boolean {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;
  }
}