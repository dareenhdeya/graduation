import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminServiceService } from '../services/admin-service.service';
import { IADMIN } from '../interfaces/iadmin.interface';
import { AdminActionsComponent } from '../admin-actions/admin-actions.component';
import { Chart, registerables } from 'chart.js';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';

Chart.register(...registerables);

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
  imports: [RouterLink, AdminActionsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
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

  private donutChart?: Chart;
  private barChart?: Chart;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.donutChart?.destroy();
    this.barChart?.destroy();
  }

  private load() {
    this.loading = true;
    this.error = '';

    forkJoin({
      usersRes: this.admin.showUsers(),
      subjectsRes: this.admin.listSubjects().pipe(
        catchError((err) => {
          if (err.status === 404) return of({ data: [] });
          throw err;
        })
      ),
    }).subscribe({
      next: ({ usersRes, subjectsRes }) => {
        const users: IADMIN[] = Array.isArray(usersRes?.data) ? usersRes.data : [];
        const subjects = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];

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

        setTimeout(() => this.initCharts(), 0);
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load dashboard';
        this.loading = false;
      },
    });
  }

  private isDarkMode(): boolean {
    return (
      window.matchMedia('(prefers-color-scheme: dark)').matches ||
      document.documentElement.classList.contains('dark')
    );
  }

  private initCharts(): void {
    this.initDonutChart();
    this.initBarChart();
  }

  private initDonutChart(): void {
    const canvas = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.donutChart?.destroy();

    const dark = this.isDarkMode();
    const textColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Teachers', 'Students', 'Parents'],
        datasets: [
          {
            data: [this.stats.teachers, this.stats.students, this.stats.parents],
            backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6'],
            borderColor: ['#f59e0b', '#22c55e', '#3b82f6'],
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
            backgroundColor: dark ? '#1e1e2e' : '#fff',
            titleColor: dark ? '#e2e8f0' : '#1e293b',
            bodyColor: dark ? '#94a3b8' : '#475569',
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 12,
          },
        },
      },
    });

    this.renderDonutCenter(canvas, this.stats.users, textColor);
  }

  private renderDonutCenter(canvas: HTMLCanvasElement, total: number, textColor: string): void {
    const chart = this.donutChart!;
    const originalDraw = chart.draw.bind(chart);
    chart.draw = () => {
      originalDraw();
      const ctx = chart.ctx;
      const cx = (chart.chartArea.left + chart.chartArea.right) / 2;
      const cy = (chart.chartArea.top + chart.chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor.replace('0.5', '0.9');
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(String(total), cx, cy - 8);
      ctx.fillStyle = textColor;
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('total', cx, cy + 14);
      ctx.restore();
    };
    chart.draw();
  }

  private initBarChart(): void {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.barChart?.destroy();

    const dark = this.isDarkMode();
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tickColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [
          'Total Users',
          'Teachers',
          'Students',
          'Parents',
          'Pending',
          'Blocked',
          'Subjects',
        ],
        datasets: [
          {
            label: 'Count',
            data: [
              this.stats.users,
              this.stats.teachers,
              this.stats.students,
              this.stats.parents,
              this.stats.pendingTeachers,
              this.stats.blockedUsers,
              this.stats.subjects,
            ],
            backgroundColor: [
              'rgba(139,92,246,0.75)',
              'rgba(245,158,11,0.75)',
              'rgba(34,197,94,0.75)',
              'rgba(59,130,246,0.75)',
              'rgba(251,146,60,0.75)',
              'rgba(239,68,68,0.75)',
              'rgba(217,70,239,0.75)',
            ],
            borderColor: [
              '#8b5cf6',
              '#f59e0b',
              '#22c55e',
              '#3b82f6',
              '#fb923c',
              '#ef4444',
              '#d946ef',
            ],
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.parsed.x} ${ctx.label}` },
            backgroundColor: dark ? '#1e1e2e' : '#fff',
            titleColor: dark ? '#e2e8f0' : '#1e293b',
            bodyColor: dark ? '#94a3b8' : '#475569',
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 12,
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 11 } },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 12 }, padding: 6 },
            border: { display: false },
          },
        },
      },
    });
  }
}
