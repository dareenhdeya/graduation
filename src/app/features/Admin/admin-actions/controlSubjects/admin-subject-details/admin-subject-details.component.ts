import { Component, inject, OnInit } from '@angular/core';
import { IAdminSubject } from '../../../interfaces/IAdminSubject.interface';
import { AdminServiceService } from '../../../services/admin-service.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-subject-details',
  imports: [RouterLink],
  templateUrl: './admin-subject-details.component.html',
  styleUrl: './admin-subject-details.component.css',
})
export class AdminSubjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminServiceService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  loading = true;
  error = '';
  subject: IAdminSubject | null = null;
  subjectToDelete: IAdminSubject | null = null;
  showDeleteModal = false;

  ngOnInit(): void {
    const sid = this.route.snapshot.paramMap.get('sid')!;
    this.admin.viewSubject(sid).subscribe({
      next: (res) => {
        this.subject = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load subject';
        this.loading = false;
      },
    });
  }

  promptRemove(subject: IAdminSubject) {
    this.subjectToDelete = subject;
    this.showDeleteModal = true;
  }

  confirmRemove() {
    if (!this.subjectToDelete) return;

    const sid = this.subjectToDelete.subjectId;

    this.showDeleteModal = false;

    this.admin.removeSubject(sid).subscribe({
      next: () => {
        setTimeout(() => {
          this.toastr?.success?.('Subject deleted successfully.', 'Success');
        }, 850);

        this.subjectToDelete = null;
        this.router.navigate(['/admin/subjects']);
      },
      error: (err) => {
        setTimeout(() => {
          this.toastr?.error?.(err?.error?.message || 'Failed to delete subject', 'Error');
        }, 850);

        this.subjectToDelete = null;
      },
    });
  }
}
