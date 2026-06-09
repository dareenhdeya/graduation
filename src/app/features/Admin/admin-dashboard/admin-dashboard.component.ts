import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminServiceService } from '../services/admin-service.service';
import { IADMIN } from '../interfaces/iadmin.interface';
import { AdminActionsComponent } from '../admin-actions/admin-actions.component';
import { TranslateModule } from '@ngx-translate/core';

type AdminStats = {
  users: number;
  teachers: number;
  students: number;
  parents: number;
  pendingTeachers: number;
  blockedUsers: number;
  subjects: number;
};
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, AdminActionsComponent, TranslateModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private admin = inject(AdminServiceService);

  loading = true;
  error = '';

  stats: AdminStats = {
    users: 0,
    teachers: 0,
    students: 0,
    parents: 0,
    pendingTeachers: 0,
    blockedUsers: 0,
    subjects: 0,
  };

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.loading = true;
    this.error = '';

    forkJoin({
      usersRes: this.admin.showUsers(),
      subjectsRes: this.admin.listSubjects().pipe(
        catchError((err) => {
          if (err.status === 404) {
            return of({
              data: [],
            });
          }

          throw err;
        })
      ),
    }).subscribe({
      next: ({ usersRes, subjectsRes }) => {
        const users: IADMIN[] = Array.isArray(usersRes?.data) ? usersRes.data : [];
        const subjects = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];

        // counts
        const teachers = users.filter((u) => u.role === 'Teacher').length;
        const students = users.filter((u) => u.role === 'Student').length;
        const parents = users.filter((u) => u.role === 'Parent').length;

        const pendingTeachers = users.filter(
          (u) => u.role === 'Teacher' && Number(u.status) === 2
        ).length;

        const blockedUsers = users.filter((u) => Number(u.status) === 3).length;

        this.stats = {
          users: users.length,
          teachers,
          students,
          parents,
          pendingTeachers,
          blockedUsers,
          subjects: subjects.length,
        };

        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load dashboard';
        this.loading = false;
      },
    });
  }
}
