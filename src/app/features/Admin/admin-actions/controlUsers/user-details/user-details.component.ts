import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { IADMIN } from '../../../interfaces/iadmin.interface';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-details',
  imports: [RouterLink],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminServiceService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  statusLabels = ['Inactive', 'Active', 'Pending', 'Banned', 'Locked'];
  statusStyles: any = {
    0: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    1: 'bg-green-500/10 text-green-500 border-green-500/20',
    2: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    3: 'bg-red-500/10 text-red-500 border-red-500/20',
    4: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
  };

  loading = true;
  error = '';
  user: IADMIN | null = null;
  showDeleteModal = false;
  userToDelete: IADMIN | null = null;

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

  onEndSession() {
    if (!this.user) return;
    this.admin.endSession(this.user.id).subscribe({
      next: () => {
        setTimeout(() => this.toastr.success('Session ended successfully.', 'Success'), 850);
        this.ngOnInit();
      },
      error: (err) => {
        setTimeout(
          () => this.toastr.error(err?.error?.message || 'Failed to end session', 'Error'),
          850
        );
      },
    });
  }

  onBlockUser() {
    if (!this.user) return;
    this.admin.blockUser(this.user.id).subscribe({
      next: () => {
        setTimeout(
          () =>
            this.toastr.success(
              this.user?.status === 3 ? 'User unblocked.' : 'User blocked.',
              'Success'
            ),
          850
        );
        this.ngOnInit();
      },
      error: (err) => {
        setTimeout(() => this.toastr.error(err?.error?.message || 'Failed', 'Error'), 850);
      },
    });
  }

  promptDelete() {
    if (!this.user) return;
    this.userToDelete = this.user;
    this.showDeleteModal = true;
  }

  confirmDelete(all: boolean) {
    if (!this.user) return;
    this.showDeleteModal = false;
    this.admin.deleteUser(this.user, all).subscribe({
      next: () => {
        setTimeout(() => this.toastr.success('User deleted successfully.', 'Success'), 850);
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        setTimeout(
          () => this.toastr.error(err?.error?.message || 'Failed to delete user', 'Error'),
          850
        );
      },
    });
  }
}
