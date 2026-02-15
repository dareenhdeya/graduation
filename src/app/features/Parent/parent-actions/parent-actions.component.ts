import { Component, inject } from '@angular/core';
import { ParentServiceService } from '../services/parent-service.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-parent-actions',
  imports: [RouterLink],
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
