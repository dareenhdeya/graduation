import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { ITeacherLessonContentResult, ITeacherVideo } from '../../interfaces/ILessonContent';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-manage-lesson',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './manage-lesson.component.html',
  styleUrl: './manage-lesson.component.css',
})
export class ManageLessonComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teacherService = inject(TeacherServiceService);
  private readonly fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  subjectId: string | null = null;
  lessonId: string | null = null;

  isLoading = true;
  isUploading = false;
  lesson: ITeacherLessonContentResult | null = null;
  videos: ITeacherVideo[] = [];

  // Upload form
  uploadForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    videoFile: [null, [Validators.required]],
  });
  selectedFile: File | null = null;
  mediaPreview: string | ArrayBuffer | null = null;
  isImage = false;

  // Edit video modal
  isEditVideoModalOpen = false;
  isEditingVideo = false;
  currentVideo: ITeacherVideo | null = null;
  editVideoForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  // Delete video confirm
  isDeleteVideoModalOpen = false;
  videoToDelete: ITeacherVideo | null = null;
  isDeletingVideo = false;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;
  private toastTimer: any;

  get hasExercise(): boolean {
    const levelData = this.lesson?.levels || (this.lesson as any)?.level;
    if (Array.isArray(levelData)) return levelData.length > 0;
    return !!levelData;
  }

  get exerciseId(): string {
    const levelData = this.lesson?.levels || (this.lesson as any)?.level;
    if (!levelData) return '';
    if (Array.isArray(levelData)) {
      return levelData[0]?.id || levelData[0]?.ID || levelData[0]?.Id || '';
    }
    return levelData.id || levelData.ID || levelData.Id || '';
  }

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
      this.toastr.warning('Please fill in all required fields and select a video.', 'Warning');
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
        setTimeout(() => {
          this.toastr.success('Video uploaded successfully!', 'Success');
        }, 850);
      },
      error: (err) => {
        console.error(err);
        this.isUploading = false;
        setTimeout(() => {
          this.toastr.error('Failed to upload video.', 'Error');
        }, 850);
      },
    });
  }

  // --- Edit Video ---
  openEditVideoModal(video: ITeacherVideo) {
    this.currentVideo = video;
    this.editVideoForm.patchValue({ title: video.title, description: video.description });
    this.isEditVideoModalOpen = true;
  }

  closeEditVideoModal() {
    this.isEditVideoModalOpen = false;
    this.currentVideo = null;
    this.editVideoForm.reset();
  }

  saveVideoEdit() {
    if (this.editVideoForm.invalid || !this.currentVideo?.vId) {
      this.toastr.warning('Please fill in all required fields.', 'Warning');
      this.editVideoForm.markAllAsTouched();
      return;
    }
    this.isEditingVideo = true;
    const { title, description } = this.editVideoForm.value;
    const index = this.videos.findIndex((v) => v.vId === this.currentVideo!.vId);
    if (index !== -1) {
      this.videos[index] = { ...this.videos[index], title, description };
    }
    this.isEditingVideo = false;
    this.closeEditVideoModal();
    this.toastr.success('Video updated successfully!', 'Success');
  }

  // --- Delete Video ---
  openDeleteVideoModal(video: ITeacherVideo) {
    this.videoToDelete = video;
    this.isDeleteVideoModalOpen = true;
  }

  closeDeleteVideoModal() {
    this.videoToDelete = null;
    this.isDeleteVideoModalOpen = false;
  }

  confirmDeleteVideo() {
    if (!this.videoToDelete?.vId) return;
    this.isDeletingVideo = true;
    this.teacherService.deleteVideo(this.videoToDelete).subscribe({
      next: () => {
        this.videos = this.videos.filter((v) => v.vId !== this.videoToDelete!.vId);
        this.isDeletingVideo = false;
        this.closeDeleteVideoModal();
        setTimeout(() => {
          this.toastr.success('Video deleted successfully.', 'Success');
        }, 850);
      },
      error: (err) => {
        console.error(err);
        this.isDeletingVideo = false;
        this.closeDeleteVideoModal();
        setTimeout(() => {
          this.toastr.error('Failed to delete video.', 'Error');
        }, 850);
      },
    });
  }

  // --- Toast ---
  showToast(message: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3500);
  }
}
