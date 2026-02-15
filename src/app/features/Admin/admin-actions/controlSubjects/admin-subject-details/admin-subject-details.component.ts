import { Component, inject, OnInit } from '@angular/core';
import { IAdminSubject } from '../../../interfaces/IAdminSubject.interface';
import { AdminServiceService } from '../../../services/admin-service.service';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-subject-details',
  imports: [RouterLink],
  templateUrl: './admin-subject-details.component.html',
  styleUrl: './admin-subject-details.component.css',
})
export class AdminSubjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminServiceService);

  loading = true;
  error = '';
  subject: IAdminSubject | null = null;

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
}
