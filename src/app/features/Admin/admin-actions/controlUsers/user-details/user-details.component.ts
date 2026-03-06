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
    0: 'bg-slate-500/10 text-slate-500 border-slate-500/20',     // Inactive 
    1: 'bg-green-500/10 text-green-500 border-green-500/20',     // Active
    2: 'bg-amber-500/10 text-amber-500 border-amber-500/20',     // Pending
    3: 'bg-red-500/10 text-red-500 border-red-500/20',           // Banned
    4: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
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
