import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-lesson',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-lesson.component.html',
  styleUrl: './add-lesson.component.css',
})
export class AddLessonComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(TeacherServiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = false;
  private subjectId: string | null = this.route.snapshot.paramMap.get('sid');

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    if (!this.subjectId) {
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('title', this.lessonForm.get('title')?.value);
    formData.append('subjectId', this.subjectId);

    this.teacherService.addLesson(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.lessonForm.reset();
        setTimeout(() => {
          this.router.navigate(['/teacher/subject', this.subjectId, 'lessons']);
        }, 500);
      },
      error: (err) => {
        console.error('Error', err);
        this.isLoading = false;
      },
    });
  }
}
