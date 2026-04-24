import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ActivatedRoute, Router, RouterLink } from '@angular/router';   // Import RouterLink
import { IStudAllSubResponse, StudentAllSubject } from '../../interfaces/IStudAllSubResponse'; // Check path
import { StudentServiceService } from '../../services/student-service.service';
import { IEnrollSubResponse } from '../../interfaces/IEnrollSubResponse';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-view-all-subjects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './view-all-subjects.component.html',
  styleUrl: './view-all-subjects.component.css',
})
export class ViewAllSubjectsComponent implements OnInit {

  private readonly studentService = inject(StudentServiceService);
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private toastr = inject(ToastrService);
  allSub: StudentAllSubject[] = [];
  isLoading = true; // Add loading state



  hoveredIndex: number | null = null;


  ngOnInit(): void {
    this.viewAllSubjects();
  }

  viewAllSubjects() {
    this.isLoading = true;
    this.studentService.getAllSubjects().subscribe({
      next: (res: IStudAllSubResponse) => {
        this.allSub = res.result || [];
        this.isLoading = false;
        console.log(this.allSub);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err.error.message);
        this.isLoading = false;
      }
    });
  }

  //  give each subject a unique color based on its index
  getColor(index: number): string {
    const colors = ['text-sky-400', 'text-purple-400', 'text-pink-400', 'text-green-400', 'text-yellow-400'];
    return colors[index % colors.length];  // 5 % 5 = 0 , 6 % 5 = 1 
  }

  getBgColor(index: number): string {
    const colors = ['bg-sky-500/10', 'bg-purple-500/10', 'bg-pink-500/10', 'bg-green-500/10', 'bg-yellow-500/10'];
    return colors[index % colors.length];
  }
  getCardBgColor(index: number): string {
    const colors = [
      'bg-sky-500/10',
      'bg-purple-500/10',
      'bg-pink-500/10',
      'bg-green-500/10',
      'bg-yellow-500/10'
    ];
    return colors[index % colors.length];
  }



  enrollSub(id: string) {
    this.studentService.enrollSubject(id).subscribe({
      next: (res: IEnrollSubResponse) => {
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

  // to trigger when hover card
  setHovered(index: number | null) {
    this.hoveredIndex = index;
  }

  overlapCard(index: number): string {
    const overlapClasses = 'z-50 scale-[1.15] -translate-y-4 border-primary/50 !bg-background shadow-[0_30px_60px_-15px_var(--brand-primary)]';
    if (this.hoveredIndex === index) {
      return overlapClasses;
    } else {
      return 'z-10';
    }
  }
}