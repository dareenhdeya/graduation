import { TranslateModule } from '@ngx-translate/core';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentServiceService } from './../../services/student-service.service';
import { IStudViewLesson, StudLesson } from '../../interfaces/IStudViewLesson';

@Component({
  selector: 'app-view-lessons',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink],
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
        console.log('Lessons:', this.lessons);
      },
      error: (error) => {
        console.log(error.error?.message || 'Error fetching lessons');
        this.isLoading = false;
      },
    });
  }

  getLessonColor(index: number): string {
    const colors = [
      'bg-amber-500 hover:bg-amber-600 border-amber-400/30',
      'bg-red-500 hover:bg-red-600 border-red-400/30',
      'bg-emerald-500 hover:bg-emerald-600 border-emerald-400/30',
      'bg-sky-500 hover:bg-sky-600 border-sky-400/30',
      'bg-pink-500 hover:bg-pink-600 border-pink-400/30',
      'bg-violet-500 hover:bg-violet-600 border-violet-400/30',
      'bg-indigo-500 hover:bg-indigo-600 border-indigo-400/30',
      'bg-cyan-500 hover:bg-cyan-600 border-cyan-400/30',
      'bg-teal-500 hover:bg-teal-600 border-teal-400/30',
      'bg-orange-500 hover:bg-orange-600 border-orange-400/30',
    ];

    return colors[index % colors.length];
  }
}
