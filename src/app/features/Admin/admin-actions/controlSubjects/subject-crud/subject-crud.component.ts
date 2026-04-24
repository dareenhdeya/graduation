import { Component, inject, OnInit } from '@angular/core';
import { AdminServiceService } from '../../../services/admin-service.service';
import { Router, RouterLink } from '@angular/router';
import { IAdminSubject } from '../../../interfaces/IAdminSubject.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-subject-crud',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './subject-crud.component.html',
  styleUrl: './subject-crud.component.css',
})
export class SubjectCrudComponent implements OnInit {
  private admin = inject(AdminServiceService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  filterType = new FormControl<'all' | 'deaf' | 'normal'>('all', { nonNullable: true });

  loading = false;
  error = '';

  subjects: IAdminSubject[] = [];

  search = new FormControl('', { nonNullable: true });

  subjectName = new FormControl('', { nonNullable: true });
  deafMute = new FormControl(false, { nonNullable: true });
  adding = false;
  addError = '';
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
        console.log('list subjects: ', err);
        this.error = err?.error?.message || err?.userMessage || 'Failed to load subjects';
      },
    });
  }

  get filteredSubjects(): IAdminSubject[] {
    const q = this.search.value.trim().toLowerCase();

    return this.subjects.filter((s) => {
      const matchesSearch =
        !q ||
        (s.subjectName || '').toLowerCase().includes(q) ||
        (s.subjectId || '').toLowerCase().includes(q);

      const matchesFilter =
        this.filterType.value === 'all' ||
        (this.filterType.value === 'deaf' && s.deaf_mute) ||
        (this.filterType.value === 'normal' && !s.deaf_mute);

      return matchesSearch && matchesFilter;
    });
  }

  openSubject(s: IAdminSubject) {
    this.router.navigate(['/admin/subjects', s.subjectId]);
  }

  add() {
    const name = this.subjectName.value.trim();
    if (!name) {
      this.toastr.warning('Subject name is required', 'Warning');
      this.addError = 'Subject name is required';
      return;
    }

    this.adding = true;
    this.addError = '';

    this.admin.addSubject({ subjectName: name, deaf_mute: this.deafMute.value }).subscribe({
      next: () => {
        setTimeout(() => {
          this.toastr.success('Subject added successfully.', 'Success');
        }, 850);
        this.openAdd = false;
        this.subjectName.setValue('');
        this.deafMute.setValue(false);
        this.loadSubjects();
        this.adding = false;
      },
      error: (err) => {
        this.adding = false;
        console.log('add subjects: ', err);

        this.addError = err?.title || 'Failed to add subject';
        setTimeout(() => {
          this.toastr.error(this.addError, 'Error');
        }, 850);
      },
    });
  }
}
