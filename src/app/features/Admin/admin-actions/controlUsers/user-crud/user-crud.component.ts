import { Component, inject, OnInit } from '@angular/core';
import { IADMIN } from '../../../interfaces/iadmin.interface';
import { Router, RouterLink } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

type Role = 'Admin' | 'Parent' | 'Teacher' | 'Student';

@Component({
  selector: 'app-user-crud',
  imports: [ReactiveFormsModule],
  templateUrl: './user-crud.component.html',
  styleUrl: './user-crud.component.css',
})
export class UserCrudComponent implements OnInit {
  private readonly adminService = inject(AdminServiceService);
  private readonly router = inject(Router);

  loading = false;
  error = '';

  users: IADMIN[] = [];

  search = new FormControl<string>('', { nonNullable: true });
  roleFilter = new FormControl<Role | 'All'>('All', { nonNullable: true });

  ngOnInit(): void {
    this.loadUsers();
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

  goBack() {
    this.router.navigateByUrl('/home');
  }

  get filteredUsers(): IADMIN[] {
    const q = this.search.value.trim().toLowerCase();
    const rf = this.roleFilter.value;

    return this.users.filter((u) => {
      const roleOk = rf === 'All' ? true : (u.role as any) === rf;

      const name = (u.name ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();

      const textOk = !q || name.startsWith(q) || email.startsWith(q);

      return roleOk && textOk;
    });
  }

  getInitial(u: IADMIN): string {
    const n = (u.name || '').trim();
    return n ? n.charAt(0).toUpperCase() : '?';
  }

  openUser(u: IADMIN) {
    const roleId = this.roleToId(u.role);
    this.router.navigate(['/admin/users', u.id], {
      queryParams: { role: roleId },
    });
  }

  private roleToId(role: string | null | undefined): 0 | 1 | 2 | 3 {
    switch (role) {
      case 'Admin':
        return 0;
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

  activate() {}
}
