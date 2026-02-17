import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-lesson',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-lesson.component.html',
  styleUrl: './add-lesson.component.css',
})
export class AddLessonComponent {
  private fb = inject(FormBuilder);
  private readonly teacherService = inject(TeacherServiceService);
  private readonly router = inject(Router);

  selectedFile: File | null = null;
  mediaPreview: string | ArrayBuffer | null = null;
  isImage = false;
  isLoading = false;

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    videoFile: [null, [Validators.required]],
  });

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Patch to form
      this.lessonForm.patchValue({ videoFile: this.selectedFile });
      this.lessonForm.get('videoFile')?.markAsTouched();

      // Check type for preview
      if (this.selectedFile.type.startsWith('image/')) {
        this.isImage = true;
        const reader = new FileReader();
        reader.onload = () => {
          this.mediaPreview = reader.result;
        };
        reader.readAsDataURL(this.selectedFile);
      } else {
        this.isImage = false;
        this.mediaPreview = null;
      }
    }
  }

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = new FormData();

    formData.append('title', this.lessonForm.get('title')?.value);
    formData.append('description', this.lessonForm.get('description')?.value);

    // Append the file with the name 'videoFile' //* (حسن عاملها كدا مع انها بتقبل اي نوع)
    if (this.selectedFile) {
      formData.append('videoFile', this.selectedFile);
    }

    this.teacherService.addLesson(formData).subscribe({
      next: (res) => {
        console.log('Success', res);
        this.isLoading = false;
        // clr inputs
        this.lessonForm.reset();
        setTimeout(() => {
          this.router.navigate(['/teacher/lessons']);
        }, 1000);
        this.selectedFile = null;
        this.mediaPreview = null;
      },
      error: (err) => {
        console.error('Error', err);
        this.isLoading = false;
      },
    });
  }
}
