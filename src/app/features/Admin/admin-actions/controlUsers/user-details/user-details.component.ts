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

  statusLabels = ['Inactive', 'Active', 'Pending', 'Banned', 'Locked'];
  statusStyles: any = {
    0: 'bg-gray-500/15 text-gray-200 border-gray-500/25', // inactive
    1: 'bg-green-500/15 text-green-200 border-green-500/25', // active
    2: 'bg-amber-500/15 text-amber-200 border-amber-500/25', // pending
    3: 'bg-red-500/15 text-red-200 border-red-500/25', // banned
    4: 'bg-purple-500/15 text-purple-200 border-purple-500/25', // locked
  };

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
