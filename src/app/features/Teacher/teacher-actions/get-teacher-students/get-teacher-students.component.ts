import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { Student } from '../../interfaces/IGetTeacherStudents';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-get-teacher-students',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './get-teacher-students.component.html',
  styleUrl: './get-teacher-students.component.css'
})
export class GetTeacherStudentsComponent implements OnInit {

  private teacherService = inject(TeacherServiceService);
  private route = inject(ActivatedRoute);

  students: Student[] = [];
  isLoading = true;
  searchTerm = '';

  get filteredStudents(): Student[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.students;
    return this.students.filter(
      s =>
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term)
    );
  }

  ngOnInit() {
    this.getStudents();
  }

  getStudents() {
    this.isLoading = true;
    const subjectId = this.route.snapshot.paramMap.get('sid');
    if (!subjectId) {
      this.isLoading = false;
      return;
    }
    this.teacherService.getStudents(subjectId).subscribe({
      next: (res) => {
        this.students = res.result || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}