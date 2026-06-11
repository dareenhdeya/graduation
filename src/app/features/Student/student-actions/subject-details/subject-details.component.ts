import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for @if
import { ActivatedRoute, Router, RouterLink } from '@angular/router';   // Required for Back Button
import { StudentServiceService } from '../../services/student-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IStudSubDetailsResponse, StudentSubject } from '../../interfaces/IStudSubDetailsResponse';
import { IEnrollSubResponse } from '../../interfaces/IEnrollSubResponse';
import { ToastrService } from 'ngx-toastr';

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
  private toastr = inject(ToastrService);
  subjectId!: string
  subject: StudentSubject | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
    this.viewSubject(this.subjectId);
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
  
  enrollSub(id: string) {
    this.studentService.enrollSubject(id).subscribe({
      next: (res : IEnrollSubResponse) => {
        console.log(res.message, "🥳🥳🥳🥳🥳");
        setTimeout(() => {
          this.toastr.success(res.message || 'Enrolled successfully.', 'Success');
        }, 850);
        this.router.navigate(['/student/my-subjects']);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err.error?.message || 'Error enrolling in subject');
        setTimeout(() => {
          this.toastr.error(err.error?.message || 'Error enrolling in subject', 'Error');
        }, 850);
      }
    });
  }

}