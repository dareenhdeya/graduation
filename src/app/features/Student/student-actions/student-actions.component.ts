import { Component } from '@angular/core';
import { ViewAllSubjectsComponent } from "./view-all-subjects/view-all-subjects.component";
import { SubjectDetailsComponent } from "./subject-details/subject-details.component";
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LettersComponent } from "../../../shared/components/letters/letters.component";

@Component({
  selector: 'app-student-actions',
  imports: [RouterLink, TranslateModule, LettersComponent],
  templateUrl: './student-actions.component.html',
  styleUrl: './student-actions.component.css',
})
export class StudentActionsComponent {

}
