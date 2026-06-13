import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { Student } from '../../interfaces/IGetTeacherStudents';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { IStudentProgressItem } from '../../interfaces/IStudentProgress.interface';
import { Chart, registerables } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';

Chart.register(...registerables);

@Component({
  selector: 'app-get-teacher-students',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './get-teacher-students.component.html',
  styleUrl: './get-teacher-students.component.css',
})
export class GetTeacherStudentsComponent implements OnInit, OnDestroy {
  private teacherService = inject(TeacherServiceService);
  private route = inject(ActivatedRoute);

  students: Student[] = [];
  isLoading = true;
  searchTerm = '';
  subjectId = this.route.snapshot.paramMap.get('sid');

  progressItems: IStudentProgressItem[] = [];
  progressLoading = true;
  avgPercentage = 0;
  passRate = 0;

  private barChart?: Chart;
  private donutChart?: Chart;

  get filteredStudents(): Student[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.students;
    return this.students.filter(
      (s) => s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term)
    );
  }

  ngOnInit() {
    const sid = this.subjectId;
    if (!sid) {
      this.isLoading = false;
      this.progressLoading = false;
      return;
    }

    this.teacherService.getStudents(sid).subscribe({
      next: (res) => {
        this.students = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });

    this.teacherService
      .getAllStudentsProgress(sid)
      .pipe(catchError(() => of({ result: [] })))
      .subscribe({
        next: (res: any) => {
          this.progressItems = res.result || [];
          this.calcStats();
          this.progressLoading = false;
          setTimeout(() => this.initCharts(), 0);
        },
        error: () => {
          this.progressLoading = false;
        },
      });
  }

  ngOnDestroy() {
    this.barChart?.destroy();
    this.donutChart?.destroy();
  }

  private calcStats() {
    if (!this.progressItems.length) return;
    const percentages = this.progressItems.map((p) => p.highestPercentage || 0);
    this.avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    this.passRate = Math.round(
      (percentages.filter((p) => p >= 50).length / percentages.length) * 100
    );
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  private isDark(): boolean {
    return (
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  private initCharts() {
    this.initBarChart();
    this.initDonutChart();
  }

  private initBarChart() {
    const canvas = document.getElementById('progressBarChart') as HTMLCanvasElement;
    if (!canvas || !this.progressItems.length) return;
    this.barChart?.destroy();

    const dark = this.isDark();
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tickColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

    const labels = this.progressItems.map((p) => p.levelName || 'Level');
    const data = this.progressItems.map((p) => p.highestPercentage ?? 0);

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Highest %',
            data,
            backgroundColor: data.map((v) =>
              v >= 80
                ? 'rgba(34,197,94,0.75)'
                : v >= 50
                ? 'rgba(139,92,246,0.75)'
                : 'rgba(239,68,68,0.75)'
            ),
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.parsed.y}%` },
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
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11 } },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              callback: (v) => `${v}%`,
            },
            border: { display: false },
          },
        },
      },
    });
  }

  private initDonutChart() {
    const canvas = document.getElementById('progressDonutChart') as HTMLCanvasElement;
    if (!canvas || !this.progressItems.length) return;
    this.donutChart?.destroy();

    const dark = this.isDark();
    const passing = this.progressItems.filter((p) => p.highestPercentage >= 50).length;
    const failing = this.progressItems.length - passing;

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Passing (≥50%)', 'Needs Work (<50%)'],
        datasets: [
          {
            data: [passing, failing],
            backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'],
            borderColor: ['#22c55e', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
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
  }
}
