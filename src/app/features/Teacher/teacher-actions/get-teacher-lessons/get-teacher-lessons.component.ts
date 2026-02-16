import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router';   
import { TeacherServiceService } from '../../services/teacher-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ILesson } from '../../interfaces/IGetTeacherLessons';

@Component({
  selector: 'app-get-teacher-lessons',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './get-teacher-lessons.component.html',
  styleUrl: './get-teacher-lessons.component.css',
})
export class GetTeacherLessonsComponent implements OnInit {

  private readonly teacherService = inject(TeacherServiceService);
  lessons: ILesson[] = [];
  isLoading = true; 

  ngOnInit(): void {
    this.getLessons();
  }

  getLessons() {
    this.isLoading = true;
    this.teacherService.getLessons().subscribe({
      next: (response) => {
        this.lessons = response.result || [];
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error:', error.message);
        this.isLoading = false;
      }
    });
  }
}