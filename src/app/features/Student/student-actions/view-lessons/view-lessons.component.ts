import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentServiceService } from './../../services/student-service.service';
import { IStudViewLesson, StudLesson } from '../../interfaces/IStudViewLesson';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-lessons',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule], // Add imports
  templateUrl: './view-lessons.component.html',
  styleUrl: './view-lessons.component.css',
})
export class ViewLessonsComponent implements OnInit {

  private readonly studentService = inject(StudentServiceService);
  private readonly route = inject(ActivatedRoute);

  subjectId!: string;
  lessons: StudLesson[] = []; 
  isLoading = true;

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
        console.log("Lessons:", this.lessons);
      },
      error: (error) => {
        console.log(error.error?.message || 'Error fetching lessons');
        this.isLoading = false;
      }
    });
  }
}