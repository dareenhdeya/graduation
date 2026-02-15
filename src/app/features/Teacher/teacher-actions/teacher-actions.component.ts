import { Component, inject } from '@angular/core';
import { TeacherServiceService } from '../services/teacher-service.service';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-teacher-actions',
  imports: [RouterLink],
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
