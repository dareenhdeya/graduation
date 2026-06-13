import { Component, inject } from '@angular/core';
import { ParentServiceService } from '../services/parent-service.service';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-parent-actions',
  imports: [RouterLink, TranslateModule],
  templateUrl: './parent-actions.component.html',
  styleUrl: './parent-actions.component.css',
})
export class ParentActionsComponent {
  private parent = inject(ParentServiceService);

  registerStudent() {
  }
  activateStudent() {
  }
  showChildren() {
  }
}
