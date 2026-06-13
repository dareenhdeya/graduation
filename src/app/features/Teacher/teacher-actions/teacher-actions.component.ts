import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TeacherServiceService } from '../services/teacher-service.service';
import { TeacherSubject } from '../interfaces/ITeacherSubjects';
import { NavigationStateService } from '../../../core/auth/services/navigation-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-teacher-actions',
  standalone: true,
  imports: [RouterLink, CommonModule,TranslateModule],
  templateUrl: './teacher-actions.component.html',
  styleUrl: './teacher-actions.component.css',
})
export class TeacherActionsComponent implements OnInit {
  private readonly teacherService = inject(TeacherServiceService);
  private readonly navState = inject(NavigationStateService);

  subjects: TeacherSubject[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading = true;
    this.teacherService.getSubjects().subscribe({
      next: (res) => {
        this.subjects = res.result || [];
        if (this.subjects.length > 0) {
          this.navState.lastTeacherSid = this.subjects[0].subjectId;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getColor(index: number): string {
    const colors = [
      'text-sky-400',
      'text-purple-400',
      'text-pink-400',
      'text-green-400',
      'text-yellow-400',
    ];
    return colors[index % colors.length];
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
