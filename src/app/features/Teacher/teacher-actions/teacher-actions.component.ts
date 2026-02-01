import { Component, inject } from '@angular/core';
import { TeacherServiceService } from '../services/teacher-service.service';

@Component({
  selector: 'app-teacher-actions',
  imports: [],
  templateUrl: './teacher-actions.component.html',
  styleUrl: './teacher-actions.component.css',
})
export class TeacherActionsComponent {
  private teacher = inject(TeacherServiceService);

  getStudents() {
  }
  getLessons() {
  }
  addLesson() {
  }
  
}
