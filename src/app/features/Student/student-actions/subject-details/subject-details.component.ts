import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for @if
import { ActivatedRoute, Router, RouterLink } from '@angular/router';   // Required for Back Button
import { StudentServiceService } from '../../services/student-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IStudSubDetailsResponse, StudentSubject } from '../../interfaces/IStudSubDetailsResponse';
import { IEnrollSubResponse } from '../../interfaces/IEnrollSubResponse';
import { IViewEnrolledSub } from '../../interfaces/IViewEnrolledSub';

@Component({
  selector: 'app-subject-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './subject-details.component.html',
  styleUrl: './subject-details.component.css',
})
export class SubjectDetailsComponent implements OnInit {

  private readonly studentService = inject(StudentServiceService);
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  subjectId!: string
  subject: StudentSubject | null = null; // Changed to null for safety
  isLoading = true;
  isEnrolled = false;

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
    this.viewSubject(this.subjectId);
    this.checkEnrollmentStatus();
  }

  viewSubject(subjectId: string) {
    this.isLoading = true;
    this.studentService.getSubjectDetails(subjectId).subscribe({
      next: (res: IStudSubDetailsResponse) => {

        this.subject = res.result;
        this.isLoading = false;
        console.log("Subject Details:", this.subject);
      },
      error: (error: HttpErrorResponse) => {
        console.log(error.error.message);
        this.isLoading = false;
      }
    });
  }


  // Enroll in subject


  enrollSub(id: string) {
    this.studentService.enrollSubject(id).subscribe({
      next: (res: IEnrollSubResponse) => {
        console.log(res.message, "🥳🥳🥳🥳🥳");
        this.router.navigate(['/student/my-subjects']);
        alert(res.message);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err.error.message || 'Error enrolling in subject');
        alert(err.error.message || 'Error enrolling in subject');
      }
    });
  }
  // get isEnrolled(): boolean {

  // }

  checkEnrollmentStatus() {
    this.studentService.viewEnrolledSubjects().subscribe({
      next: (res: IViewEnrolledSub) => {
        const enrolledSubjects = res.result;

        this.isEnrolled = enrolledSubjects.some(sub => sub.subjectId === this.subjectId);
      },
      error: (err) => {
        console.error('Error fetching enrolled subjects:', err);
      }
    });
  }

}