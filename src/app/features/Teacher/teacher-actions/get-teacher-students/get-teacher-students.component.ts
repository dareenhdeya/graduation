import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { Student } from '../../interfaces/IGetTeacherStudents'; // Check path
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-get-teacher-students',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './get-teacher-students.component.html',
  styleUrl: './get-teacher-students.component.css'
})
export class GetTeacherStudentsComponent implements OnInit {

  private teacherService = inject(TeacherServiceService);
  
  students: Student[] = [];
  isLoading = true;

  ngOnInit() {
    this.getStudents();
  }

  getStudents() {
    this.isLoading = true;
    this.teacherService.getStudents().subscribe({
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

  //  ( "Sa3edo" -> "S")
  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}