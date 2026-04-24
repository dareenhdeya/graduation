import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

// Mirrors backend enum: None = 0, Lesson = 1, Quiz = 2
export enum PerquisiteType {
  None = 0,
  Lesson = 1,
  Quiz = 2,
}

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
  private toastr = inject(ToastrService);

  isLoading = false;
  isLoadingPrerequisites = false;
  private subjectId: string | null = this.route.snapshot.paramMap.get('sid');

  // Prerequisite options fetched from backend
  prerequisiteOptions: { id: string; title: string }[] = [];

  readonly perquisiteTypes = [
    { value: PerquisiteType.None, label: 'None' },
    { value: PerquisiteType.Lesson, label: 'Lesson' },
    { value: PerquisiteType.Quiz, label: 'Quiz' },
  ];

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    perquisiteType: [PerquisiteType.None, Validators.required],
    perquisiteId: [null],
  });

  get selectedType(): number {
    return this.lessonForm.get('perquisiteType')?.value ?? PerquisiteType.None;
  }

  onTypeChange(): void {
    // Reset the selected item whenever type changes
    this.lessonForm.get('perquisiteId')?.setValue(null);
    this.prerequisiteOptions = [];

    const type = this.selectedType;
    if (type !== PerquisiteType.None && this.subjectId) {
      this.isLoadingPrerequisites = true;
      this.teacherService.listPrerequisites(this.subjectId, type).subscribe({
        next: (res: any) => {
          // Backend returns { result: [...] }
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

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      this.toastr.warning('Please fill in all required fields.', 'Warning');
      this.lessonForm.markAllAsTouched();
      return;
    }

    if (!this.subjectId) return;

    // Require a selected item if type is not None
    const type: number = this.selectedType;
    const prereqId: string | null = this.lessonForm.get('perquisiteId')?.value;
    if (type !== PerquisiteType.None && !prereqId) {
      this.lessonForm.get('perquisiteId')?.markAsTouched();
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('title', this.lessonForm.get('title')?.value);
    formData.append('subjectId', this.subjectId);
    formData.append('perquisiteType', type.toString());
    if (type !== PerquisiteType.None && prereqId) {
      formData.append('perquisite', prereqId);
    }

    this.teacherService.addLesson(formData).subscribe({
      next: () => {
        this.toastr.success('Lesson added successfully.', 'Success');
        this.isLoading = false;
        this.lessonForm.reset({ perquisiteType: PerquisiteType.None, perquisiteId: null });
        this.prerequisiteOptions = [];
        setTimeout(() => {
          this.router.navigate(['/teacher/subject', this.subjectId, 'lessons']);
        }, 500);
      },
      error: (err) => {
        console.error('Error', err);
        this.toastr.error('Failed to add lesson.', 'Error');
        this.isLoading = false;
      },
    });
  }
}
