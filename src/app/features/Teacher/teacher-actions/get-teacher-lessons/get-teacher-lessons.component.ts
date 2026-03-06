import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // 1. Import Forms
import { TeacherServiceService } from '../../services/teacher-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ILesson } from '../../interfaces/IGetTeacherLessons';
import { IEditedLesson } from '../../interfaces/IEditLessonResponse';

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

  lessons: ILesson[] = [];
  isLoading = true;
  subjectId: string | null = null;

  // --- EDIT MODAL STATE ---
  isEditModalOpen = false;
  isSubmitting = false;
  currentLessonId: string | null = null;
  editForm!: FormGroup;

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('sid');
    this.getLessons();
    // Initialize the form
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
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
      }
    });
  }


  deleteLesson(id: string) {
    if (confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
      this.teacherService.removeLesson(id).subscribe({
        next: () => {
          // Remove from local array instantly (UI update)
          this.lessons = this.lessons.filter(l => l.id !== id);
          alert('Lesson deleted successfully.');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete lesson.');
        }
      });
    }
  }



  // Open Modal & Fill Data
  openEditModal(lesson: ILesson) {
    this.isEditModalOpen = true;
    this.currentLessonId = lesson.id;
    
    this.editForm.patchValue({
      title: lesson.title,
      description: lesson.description
    });
  }

  //  Close Modal & Reset
  closeEditModal() {
    this.isEditModalOpen = false;
    this.currentLessonId = null;
    this.editForm.reset();
  }

  
  saveEdit() {
    if (this.editForm.invalid || !this.currentLessonId) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { title, description } = this.editForm.value;

    
    const editedLesson: IEditedLesson = this.editForm.value;


    this.teacherService.editLesson(this.currentLessonId, editedLesson).subscribe({
      next: (res) => {
   
        const index = this.lessons.findIndex(l => l.id === this.currentLessonId);
        if (index !== -1) {
          this.lessons[index] = { ...this.lessons[index], title, description };
        }
        
        this.isSubmitting = false;
        this.closeEditModal();
        alert('Lesson updated successfully!');
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        alert('Failed to update lesson.');
      }
    });
  }
}