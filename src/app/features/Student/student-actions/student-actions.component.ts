import { Component } from '@angular/core';
import { ViewAllSubjectsComponent } from './view-all-subjects/view-all-subjects.component';
import { SubjectDetailsComponent } from './subject-details/subject-details.component';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-student-actions',
  imports: [RouterLink, NgClass, TranslateModule],
  templateUrl: './student-actions.component.html',
  styleUrl: './student-actions.component.css',
})
export class StudentActionsComponent {}
