import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { AsyncPipe } from '@angular/common';
import { IADMIN } from '../../../interfaces/iadmin.interface';

@Component({
  selector: 'app-user-details',
  imports: [RouterLink],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminServiceService);

  loading = true;
  error = '';
  user: IADMIN | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const role = this.route.snapshot.queryParamMap.get('role');
    const roleNum = role ? Number(role) : undefined;

    this.admin.viewUserById(id, roleNum).subscribe({
      next: (res) => {
        this.user = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load user';
        this.loading = false;
      },
    });
  }
}
