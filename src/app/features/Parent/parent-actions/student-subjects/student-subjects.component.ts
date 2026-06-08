import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParentServiceService } from '../../services/parent-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ISubjectData } from '../../interfaces/IViewStudentSubjects.interface';

@Component({
  selector: 'app-student-subjects',
  imports: [CommonModule, RouterLink],
  templateUrl: './student-subjects.component.html',
  styleUrl: './student-subjects.component.css',
})
export class StudentSubjectsComponent implements OnInit {
  private readonly parentService = inject(ParentServiceService);
  private readonly route = inject(ActivatedRoute);

  isLoading = true;
  subjects: ISubjectData[] = [];
  errorMessage = '';
  studentId = '';

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading = true;
    this.parentService.viewStudentSubjects(this.studentId).subscribe({
      next: (res) => {
        const raw = Array.isArray(res.data) ? res.data : [res.data];
        this.subjects = raw.filter((s) => s != null);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Failed to load subjects.';
        this.isLoading = false;
      },
    });
  }
}
