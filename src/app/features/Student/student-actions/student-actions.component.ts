import { Component } from '@angular/core';
import { ViewAllSubjectsComponent } from "./view-all-subjects/view-all-subjects.component";
import { SubjectDetailsComponent } from "./subject-details/subject-details.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-actions',
  imports: [RouterLink],
  templateUrl: './student-actions.component.html',
  styleUrl: './student-actions.component.css',
})
export class StudentActionsComponent {

}
