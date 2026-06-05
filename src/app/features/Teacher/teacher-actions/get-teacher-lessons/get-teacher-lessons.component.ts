import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ILesson } from '../../interfaces/IGetTeacherLessons';
import { IEditedLesson } from '../../interfaces/IEditLessonResponse';
import { ToastrService } from 'ngx-toastr';

// Mirrors backend enum: None = 0, Lesson = 1, Quiz = 2
export enum PerquisiteType {
  None = 0,
  Lesson = 1,
  Quiz = 2,
}

@Component({
  selector: 'app-get-teacher-lessons',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './get-teacher-lessons.component.html',
  styleUrl: './get-teacher-lessons.component.css',
})
export class GetTeacherLessonsComponent implements OnInit {
  private readonly teacherService = inject(TeacherServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  lessons: ILesson[] = [];
  isLoading = true;
  subjectId: string | null = null;

  // --- EDIT MODAL STATE ---
  isEditModalOpen = false;
  isSubmitting = false;
  currentLessonId: string | null = null;
  editForm!: FormGroup;

  // --- DELETE CONFIRM STATE ---
  isDeleteModalOpen = false;
  lessonToDelete: ILesson | null = null;
  isDeleting = false;

  // --- TOAST STATE ---
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;
  private toastTimer: any;

  // --- PREREQUISITE STATE ---
  isLoadingPrerequisites = false;
  prerequisiteOptions: { id: string; title: string }[] = [];

  readonly perquisiteTypes = [
    { value: PerquisiteType.None, label: 'None' },
    { value: PerquisiteType.Lesson, label: 'Lesson' },
    { value: PerquisiteType.Quiz, label: 'Quiz' },
  ];

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('sid');
    this.getLessons();
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      perquisiteType: [PerquisiteType.None],
      perquisiteId: [null],
    });
  }

  getLessons() {
    if (!this.subjectId) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.teacherService.getLessons(this.subjectId).subscribe({
      next: (response) => {
        this.lessons = response.result || [];
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error:', error.message);
        this.isLoading = false;
      },
    });
  }

  // --- DELETE FLOW ---
  openDeleteModal(lesson: ILesson) {
    this.lessonToDelete = lesson;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.lessonToDelete = null;
    this.isDeleteModalOpen = false;
  }

  confirmDelete() {
    if (!this.lessonToDelete) return;
    this.isDeleting = true;
    this.teacherService.removeLesson(this.subjectId!, this.lessonToDelete.id).subscribe({
      next: () => {
        this.lessons = this.lessons.filter((l) => l.id !== this.lessonToDelete!.id);
        this.isDeleting = false;
        this.closeDeleteModal();
        setTimeout(() => {
          this.toastr.success('Lesson deleted successfully.', 'Success');
        }, 850);
      },
      error: (err) => {
        console.error(err);
        this.isDeleting = false;
        this.closeDeleteModal();
        setTimeout(() => {
          this.toastr.error('Failed to delete lesson.', 'Error');
        }, 850);
      },
    });
  }

  // --- EDIT FLOW ---
  openEditModal(lesson: ILesson) {
    this.isEditModalOpen = true;
    this.currentLessonId = lesson.id;
    const pType =
      (lesson as any).perquisiteType ?? (lesson as any).PerquisiteType ?? PerquisiteType.None;
    const pId =
      (lesson as any).perquisite ??
      (lesson as any).Perquisite ??
      (lesson as any).perquisiteId ??
      null;
    this.editForm.patchValue({
      title: lesson.title,
      description: lesson.description,
      perquisiteType: pType,
      perquisiteId: pId,
    });
    this.prerequisiteOptions = [];
    if (pType !== PerquisiteType.None && this.subjectId) {
      this.isLoadingPrerequisites = true;
      this.teacherService.listPrerequisites(this.subjectId, pType).subscribe({
        next: (res: any) => {
          this.prerequisiteOptions = (res?.result ?? []).map((item: any) => ({
            id: item.id ?? item.Id,
            title: item.title ?? item.Title ?? item.name ?? item.Name ?? 'Unnamed',
          }));
          this.isLoadingPrerequisites = false;
          if (pId) this.editForm.get('perquisiteId')?.setValue(pId);
        },
        error: () => {
          this.isLoadingPrerequisites = false;
        },
      });
    }
  }

  get selectedEditType(): number {
    return this.editForm.get('perquisiteType')?.value ?? PerquisiteType.None;
  }

  onEditTypeChange(): void {
    this.editForm.get('perquisiteId')?.setValue(null);
    this.prerequisiteOptions = [];

    const type = this.selectedEditType;
    if (type !== PerquisiteType.None && this.subjectId) {
      this.isLoadingPrerequisites = true;
      this.teacherService.listPrerequisites(this.subjectId, type).subscribe({
        next: (res: any) => {
          this.prerequisiteOptions = (res?.result ?? []).map((item: any) => ({
            id: item.id ?? item.Id,
            title: item.title ?? item.Title ?? item.name ?? item.Name ?? 'Unnamed',
          }));
          this.isLoadingPrerequisites = false;
        },
        error: (err) => {
          console.error('Error loading prerequisites', err);
          this.isLoadingPrerequisites = false;
        },
      });
    }
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.currentLessonId = null;
    this.editForm.reset();
    this.prerequisiteOptions = [];
  }

  saveEdit() {
    if (this.editForm.invalid || !this.currentLessonId) {
      this.toastr.warning('Please fill in all required fields.', 'Warning');
      this.editForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const { title, description, perquisiteType, perquisiteId } = this.editForm.value;
    const editedLesson: IEditedLesson = {
      title,
      description,
      subjectId: this.subjectId!,
      lid: this.currentLessonId,
      perquisiteType: Number(perquisiteType),
      perquisite: Number(perquisiteType) !== PerquisiteType.None ? perquisiteId : null,
    };

    this.teacherService.editLesson(editedLesson).subscribe({
      next: () => {
        const index = this.lessons.findIndex((l) => l.id === this.currentLessonId);
        if (index !== -1) {
          this.lessons[index] = { ...this.lessons[index], title, description };
        }
        this.isSubmitting = false;
        this.closeEditModal();
        setTimeout(() => {
          this.toastr.success('Lesson updated successfully!', 'Success');
        }, 850);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        setTimeout(() => {
          this.toastr.error('Failed to update lesson.', 'Error');
        }, 850);
      },
    });
  }

  // --- TOAST HELPER ---
  showToast(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      this.toastr.success(message, 'Success');
    } else {
      this.toastr.error(message, 'Error');
    }
  }
}
