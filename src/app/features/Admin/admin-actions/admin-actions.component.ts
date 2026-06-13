import { Component, inject } from '@angular/core';
import { AdminServiceService } from '../services/admin-service.service';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-actions',
  imports: [RouterLink, TranslateModule],
  templateUrl: './admin-actions.component.html',
  styleUrl: './admin-actions.component.css',
})
export class AdminActionsComponent {
  private admin = inject(AdminServiceService);

  showUsers() {}
  viewUserById() {}
  EndSession() {}
  blockUser() {}
  listSubjects() {}
  viewSubject() {}
  addSubject() {}
  approveTeacher() {}
}
