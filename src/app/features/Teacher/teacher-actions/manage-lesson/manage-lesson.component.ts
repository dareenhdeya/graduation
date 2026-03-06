import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { ITeacherLessonContentResult, ITeacherVideo } from '../../interfaces/ILessonContent';

@Component({
  selector: 'app-manage-lesson',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-lesson.component.html',
  styleUrl: './manage-lesson.component.css',
})
export class ManageLessonComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teacherService = inject(TeacherServiceService);
  private readonly fb = inject(FormBuilder);

  subjectId: string | null = null;
  lessonId: string | null = null;

  isLoading = true;
  isUploading = false;
  lesson: ITeacherLessonContentResult | null = null;
  videos: ITeacherVideo[] = [];

  uploadForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    videoFile: [null, [Validators.required]],
  });

  selectedFile: File | null = null;
  mediaPreview: string | ArrayBuffer | null = null;
  isImage = false;

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('sid');
    this.lessonId = this.route.snapshot.paramMap.get('lid');
    if (this.subjectId && this.lessonId) {
      this.loadLesson();
    } else {
      this.isLoading = false;
    }
  }

  loadLesson() {
    if (!this.subjectId || !this.lessonId) return;
    this.isLoading = true;
    this.teacherService.getLessonDetails(this.subjectId, this.lessonId).subscribe({
      next: (res) => {
        this.lesson = res.result;
        this.videos = res.result?.videos || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadForm.patchValue({ videoFile: this.selectedFile });
      this.uploadForm.get('videoFile')?.markAsTouched();

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

  uploadVideo(): void {
    if (this.uploadForm.invalid || !this.subjectId || !this.lessonId || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;

    const formData = new FormData();
    formData.append('LId', this.lessonId);
    formData.append('subjectID', this.subjectId);
    formData.append('Title', this.uploadForm.get('title')?.value);
    formData.append('Description', this.uploadForm.get('description')?.value);
    formData.append('VideoFile', this.selectedFile);

    this.teacherService.uploadVideo(formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.uploadForm.reset();
        this.selectedFile = null;
        this.mediaPreview = null;
        this.loadLesson();
      },
      error: (err) => {
        console.error(err);
        this.isUploading = false;
      },
    });
  }

  editVideo(_video: ITeacherVideo) {
    // Placeholder for future implementation
  }

  deleteVideo(_video: ITeacherVideo) {
    // Placeholder for future implementation
  }
}

