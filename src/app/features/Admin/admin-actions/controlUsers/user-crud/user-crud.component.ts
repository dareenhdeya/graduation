import { Component, inject, OnInit } from '@angular/core';
import { IADMIN } from '../../../interfaces/iadmin.interface';
import { Router, RouterLink } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
type Role = 'Parent' | 'Teacher' | 'Student';

@Component({
  selector: 'app-user-crud',
  imports: [ReactiveFormsModule],
  templateUrl: './user-crud.component.html',
  styleUrl: './user-crud.component.css',
})
export class UserCrudComponent implements OnInit {
  private readonly adminService = inject(AdminServiceService);
  private readonly router = inject(Router);

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
    0: 'bg-gray-500/15 text-gray-200 border-gray-500/25', // inactive
    1: 'bg-green-500/15 text-green-200 border-green-500/25', // active
    2: 'bg-amber-500/15 text-amber-200 border-amber-500/25', // pending
    3: 'bg-red-500/15 text-red-200 border-red-500/25', // banned
    4: 'bg-purple-500/15 text-purple-200 border-purple-500/25', // locked
  };

  loading = false;
  error = '';
  isTable = true;

  users: IADMIN[] = [];

  search = new FormControl<string>('', { nonNullable: true });
  roleFilter = new FormControl<Role | 'All'>('All', { nonNullable: true });

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
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to end session';
      },
    });
  }

  onBlockUser(u: IADMIN, e: MouseEvent) {
    e.stopPropagation();
    this.error = '';

    this.adminService.blockUser(u.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to block user';
      },
    });
  }
}
