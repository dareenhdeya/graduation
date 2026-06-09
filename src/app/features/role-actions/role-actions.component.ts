import { Component, computed, inject } from '@angular/core';
import { AdminActionsComponent } from '../Admin/admin-actions/admin-actions.component';
import { ParentActionsComponent } from '../Parent/parent-actions/parent-actions.component';
import { TeacherActionsComponent } from '../Teacher/teacher-actions/teacher-actions.component';
import { StudentActionsComponent } from '../Student/student-actions/student-actions.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { AdminDashboardComponent } from '../Admin/admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-role-actions',
  imports: [
    AsyncPipe,
    AdminActionsComponent,
    ParentActionsComponent,
    TeacherActionsComponent,
    StudentActionsComponent,
    AdminDashboardComponent,
  ],
  templateUrl: './role-actions.component.html',
  styleUrl: './role-actions.component.css',
})
export class RoleActionsComponent {
  private auth = inject(AuthService);
  role$ = this.auth.role$;
}
