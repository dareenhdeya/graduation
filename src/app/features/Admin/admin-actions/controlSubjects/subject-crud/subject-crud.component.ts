import { Component, inject, OnInit } from '@angular/core';
import { AdminServiceService } from '../../../services/admin-service.service';
import { Router, RouterLink } from '@angular/router';
import { IAdminSubject } from '../../../interfaces/IAdminSubject.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-subject-crud',
  imports: [ReactiveFormsModule],
  templateUrl: './subject-crud.component.html',
  styleUrl: './subject-crud.component.css',
})
export class SubjectCrudComponent implements OnInit {
  private admin = inject(AdminServiceService);
  private router = inject(Router);

  loading = false;
  error = '';

  subjects: IAdminSubject[] = [];

  search = new FormControl('', { nonNullable: true });

  subjectName = new FormControl('', { nonNullable: true });
  deafMute = new FormControl(false, { nonNullable: true });
  adding = false;

  openAdd = false;

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects() {
    this.loading = true;
    this.error = '';

    this.admin.listSubjects().subscribe({
      next: (res) => {
        this.subjects = Array.isArray(res?.data) ? res.data : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load subjects';
      },
    });
  }

  get filteredSubjects(): IAdminSubject[] {
    const q = this.search.value.trim().toLowerCase();
    if (!q) return this.subjects;

    return this.subjects.filter(
      (s) =>
        (s.subjectName || '').toLowerCase().includes(q) ||
        (s.subjectId || '').toLowerCase().includes(q)
    );
  }

  openSubject(s: IAdminSubject) {
    this.router.navigate(['/admin/subjects', s.subjectId]);
  }

  add() {
    const name = this.subjectName.value.trim();
    if (!name) {
      this.error = 'Subject name is required';
      return;
    }

    this.adding = true;
    this.error = '';

    this.admin.addSubject({ subjectName: name, deaf_mute: this.deafMute.value }).subscribe({
      next: () => {
        this.openAdd = false;
        this.subjectName.setValue('');
        this.deafMute.setValue(false);
        this.loadSubjects();
        this.adding = false;
      },
      error: (err) => {
        this.adding = false;
        this.error = err?.errors || 'Failed to add subject';
      },
    });
  }
}
