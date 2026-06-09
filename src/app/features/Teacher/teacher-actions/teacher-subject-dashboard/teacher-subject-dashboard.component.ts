import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-teacher-subject-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './teacher-subject-dashboard.component.html',
  styleUrl: './teacher-subject-dashboard.component.css',
})
export class TeacherSubjectDashboardComponent {
  private readonly route = inject(ActivatedRoute);

  get subjectId(): string | null {
    return this.route.snapshot.paramMap.get('sid');
  }
}

