import { Component, inject, OnInit } from '@angular/core';
import { StudentServiceService } from '../../services/student-service.service';
import { EnrolledSubject, IViewEnrolledSub } from '../../interfaces/IViewEnrolledSub';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view-enrolled-subjects',
  imports: [RouterLink],
  templateUrl: './view-enrolled-subjects.component.html',
  styleUrl: './view-enrolled-subjects.component.css',
})
export class ViewEnrolledSubjectsComponent implements OnInit {
  // inject service
  private readonly studentService = inject(StudentServiceService);

  mySubjects: EnrolledSubject[] = [];
  isLoading = true;
  ngOnInit(): void {
    this.veiwEnrolledSubject();
  }

  veiwEnrolledSubject() {
    this.studentService.viewEnrolledSubjects().subscribe({
      next: (res: IViewEnrolledSub) => {
        this.mySubjects = res.result ?? [];
        console.log(this.mySubjects);
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      },
    });
  }
  //  give each subject a unique color based on its index
  getColor(index: number): string {
    const colors = [
      'text-sky-400',
      'text-purple-400',
      'text-pink-400',
      'text-green-400',
      'text-yellow-400',
    ];
    return colors[index % colors.length]; // 5 % 5 = 0 , 6 % 5 = 1
  }

  getBgColor(index: number): string {
    const colors = [
      'bg-sky-500/10',
      'bg-purple-500/10',
      'bg-pink-500/10',
      'bg-green-500/10',
      'bg-yellow-500/10',
    ];
    return colors[index % colors.length];
  }
}
