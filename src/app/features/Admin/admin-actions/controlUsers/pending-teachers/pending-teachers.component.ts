import { Component, inject, OnInit } from '@angular/core';
import { IADMIN } from '../../../interfaces/iadmin.interface';
import { Router, RouterLink } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  IAproveResponse,
  IAproveTeacher,
  IAdminSubject,
} from '../../../interfaces/IAdminSubject.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

type Role = 'Parent' | 'Teacher' | 'Student';

@Component({
  selector: 'app-pending-teachers',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './pending-teachers.component.html',
  styleUrl: './pending-teachers.component.css',
})
export class PendingTeachersComponent implements OnInit {
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
    4: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
  };

  loading = false;
  error = '';
  users: IADMIN[] = [];
  search = new FormControl<string>('', { nonNullable: true });

  showModal = false;
  selectedTeacher: IADMIN | null = null;
  subjects: IAdminSubject[] = [];
  loadingSubjects = false;
  selectedSubjectId = new FormControl('', { nonNullable: true });
  activating = false;
  isDropdownOpen = false;

  get selectedSubjectName(): string | null {
    if (!this.selectedSubjectId.value) return null;
    const sub = this.subjects.find((s) => s.subjectId === this.selectedSubjectId.value);
    return sub ? sub.subjectName : null;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.adminService.showUsers().subscribe({
      next: (res) => {
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
    return this.users.filter((u) => {
      const isTeacher = u.role === 'Teacher';
      const name = (u.fName ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const textOk = !q || name.includes(q) || email.includes(q);
      return isTeacher && textOk;
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

  openActivateModal(teacher: IADMIN) {
    this.selectedTeacher = teacher;
    this.showModal = true;
    this.selectedSubjectId.setValue('');

    if (this.subjects.length === 0) {
      this.loadSubjects();
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedTeacher = null;
    this.selectedSubjectId.setValue('');
    this.isDropdownOpen = false;
  }

  loadSubjects() {
    this.loadingSubjects = true;
    this.adminService.listSubjects().subscribe({
      next: (res: any) => {
        this.subjects = Array.isArray(res?.data) ? res.data : [];
        this.loadingSubjects = false;
      },
      error: (err) => {
        console.log('Failed to load subjects', err);
        this.loadingSubjects = false;
      },
    });
  }

  confirmActivation() {
    if (!this.selectedTeacher || !this.selectedSubjectId.value) return;

    this.activating = true;

    const isActivation = this.selectedTeacher.status === 2;

    const payload: IAproveTeacher = {
      teacherId: this.selectedTeacher.id,
      subjectId: this.selectedSubjectId.value,
    };

    this.adminService.approveTeacher(payload).subscribe({
      next: (response: IAproveResponse) => {
        setTimeout(() => {
          this.toastr.success(
            isActivation
              ? 'Teacher activated successfully.'
              : 'Subject assigned to teacher successfully.',
            'Success'
          );
        }, 850);

        this.activating = false;
        this.closeModal();
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.activating = false;

        setTimeout(() => {
          this.toastr.error(
            err.message ||
              (isActivation ? 'Failed to activate teacher.' : 'Failed to assign subject.'),
            'Error'
          );
        }, 850);
      },
    });
  }
}
