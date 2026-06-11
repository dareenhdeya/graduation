import { Component, inject, OnInit } from '@angular/core';
import { IADMIN } from '../../../interfaces/iadmin.interface';
import { Router, RouterLink } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
type Role = 'Parent' | 'Teacher' | 'Student';

@Component({
  selector: 'app-user-crud',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-crud.component.html',
  styleUrl: './user-crud.component.css',
})
export class UserCrudComponent implements OnInit {
  private readonly adminService = inject(AdminServiceService);
  private readonly router = inject(Router);
  private toastr = inject(ToastrService);

  private roleToId(role: string | null | undefined): 1 | 2 | 3 {
    switch (role) {
      case 'Student':
        return 1;
      case 'Parent':
        return 2;
      case 'Teacher':
        return 3;
      default:
        return 2;
    }
  }

  statusLabels = ['Inactive', 'Active', 'Pending', 'Banned', 'Locked'];
  statusStyles: any = {
    0: 'bg-slate-500/10 text-slate-500 border-slate-500/20', // inactive
    1: 'bg-green-500/10 text-green-500 border-green-500/20', // active
    2: 'bg-amber-500/10 text-amber-500 border-amber-500/20', // pending
    3: 'bg-red-500/10 text-red-500 border-red-500/20', // banned
    4: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20', // locked
  };

  loading = false;
  error = '';
  isTable = true;

  users: IADMIN[] = [];

  search = new FormControl<string>('', { nonNullable: true });
  roleFilter = new FormControl<Role | 'All'>('All', { nonNullable: true });
  isRoleDropdownOpen = false;

  roles: Array<Role | 'All'> = ['All', 'Parent', 'Teacher', 'Student'];

  userToDelete: IADMIN | null = null;
  showDeleteModal = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  setView(mode: 'table' | 'grid') {
    this.isTable = mode === 'table';
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.adminService.showUsers().subscribe({
      next: (res) => {
        console.log('=========show-users===========', res);

        this.users = Array.isArray(res?.data) ? res.data : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'Failed to load users';
      },
    });
  }

  selectRole(role: Role | 'All') {
    this.roleFilter.setValue(role);
    this.isRoleDropdownOpen = false;
  }

  get selectedRoleLabel() {
    return this.roleFilter.value || 'All';
  }

  get filteredUsers(): IADMIN[] {
    const q = this.search.value.trim().toLowerCase();
    const rf = this.roleFilter.value;

    return this.users.filter((u) => {
      const roleOk = rf === 'All' ? true : (u.role as any) === rf;

      const name = (u.fName ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();

      const textOk = !q || name.startsWith(q) || email.startsWith(q);

      return roleOk && textOk;
    });
  }

  getInitial(u: IADMIN): string {
    const n = (u.fName || '').trim();
    return n ? n.charAt(0).toUpperCase() : '?';
  }

  openUser(u: IADMIN) {
    const roleId = this.roleToId(u.role);
    this.router.navigate(['/admin/users', u.id], {
      queryParams: { role: roleId },
    });
  }

  onEndSession(u: IADMIN, e: MouseEvent) {
    e.stopPropagation();
    this.error = '';

    this.adminService.endSession(u.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.toastr.success('Session ended successfully.', 'Success');
        }, 850);
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to end session';
        setTimeout(() => {
          this.toastr.error(this.error, 'Error');
        }, 850);
      },
    });
  }

  onBlockUser(u: IADMIN, e: MouseEvent) {
    e.stopPropagation();
    this.error = '';

    this.adminService.blockUser(u.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.toastr.success('User blocked successfully.', 'Success');
        }, 850);
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to block user';
        setTimeout(() => {
          this.toastr.error(this.error, 'Error');
        }, 850);
      },
    });
  }

  onDeleteUser(u: IADMIN, e: MouseEvent, all: boolean = false) {
    e.stopPropagation();
    this.error = '';

    this.adminService.deleteUser(u, all).subscribe({
      next: () => {
        setTimeout(() => {
          this.toastr.success('User deleted successfully.', 'Success');
        }, 850);
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to delete user';
        setTimeout(() => {
          this.toastr.error(this.error, 'Error');
        }, 850);
      },
    });
  }

  promptDelete(u: IADMIN, e: MouseEvent) {
    e.stopPropagation();
    this.userToDelete = u;
    this.showDeleteModal = true;
  }

  confirmDelete(all: boolean) {
    if (!this.userToDelete) return;
    const fakeEvent = new MouseEvent('click');
    this.showDeleteModal = false;
    this.onDeleteUser(this.userToDelete, fakeEvent, all);
    this.userToDelete = null;
  }
}
