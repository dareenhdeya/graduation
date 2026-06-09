import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { Chart, registerables } from 'chart.js';
import { IStudentProgressItem, StudentProgressResponse } from '../../interfaces/IStudentProgress.interface';

Chart.register(...registerables);

@Component({
  selector: 'app-student-progress',
  imports: [CommonModule, RouterLink],
  templateUrl: './student-progress.component.html',
  styleUrl: './student-progress.component.css',
})
export class StudentProgressComponent implements OnInit, OnDestroy {
  private teacherService = inject(TeacherServiceService);
  private route = inject(ActivatedRoute);

  progressData: IStudentProgressItem[] = [];
  isLoading = true;
  studentId = '';
  subjectId = '';
  studentName = '';

  private barChart?: Chart;
  private lineChart?: Chart;
  private donutChart?: Chart;

  get avgPercentage(): number {
    if (!this.progressData.length) return 0;
    return Math.round(
      this.progressData.reduce((s, i) => s + i.percentage, 0) / this.progressData.length
    );
  }

  get avgHighest(): number {
    if (!this.progressData.length) return 0;
    return Math.round(
      this.progressData.reduce((s, i) => s + i.highestPercentage, 0) / this.progressData.length
    );
  }

  get totalAttempts(): number {
    return this.progressData.reduce((s, i) => s + i.attemptsUsed, 0);
  }

  get passedCount(): number {
    return this.progressData.filter((i) => i.highestPercentage >= 60).length;
  }

  get failedCount(): number {
    return this.progressData.length - this.passedCount;
  }

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('sid') ?? '';
    this.studentId = this.route.snapshot.paramMap.get('stdID') ?? '';
    this.studentName = history.state?.studentName ?? 'Student';
    this.loadProgress();
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.lineChart?.destroy();
    this.donutChart?.destroy();
  }

  loadProgress() {
    this.isLoading = true;
    this.teacherService.getStudentProgress(this.subjectId, this.studentId).subscribe({
      next: (res: StudentProgressResponse) => {
        this.progressData = res.result ?? [];
        this.isLoading = false;
        setTimeout(() => this.initCharts(), 0);
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  private isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  private colors(dark: boolean) {
    return {
      grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      tick: dark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)',
      tooltip: {
        backgroundColor: dark ? '#1e1e2e' : '#ffffff',
        titleColor: dark ? '#e2e8f0' : '#1e293b',
        bodyColor: dark ? '#94a3b8' : '#475569',
        borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 12,
      },
    };
  }

  private initCharts(): void {
    if (!this.progressData.length) return;
    this.initBarChart();
    this.initLineChart();
    this.initDonutChart();
  }

  private initBarChart(): void {
    const canvas = document.getElementById('spBarChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.barChart?.destroy();
    const dark = this.isDark();
    const c = this.colors(dark);

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.progressData.map((s) => s.levelName),
        datasets: [
          {
            label: 'Score',
            data: this.progressData.map((s) => s.percentage),
            backgroundColor: 'rgba(56,189,248,0.75)',
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Best Score',
            data: this.progressData.map((s) => s.highestPercentage),
            backgroundColor: 'rgba(52,211,153,0.75)',
            borderWidth: 0,
            borderRadius: 6,
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
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` },
            ...c.tooltip,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: c.tick, font: { size: 11 }, maxRotation: 30 },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: c.grid },
            ticks: { color: c.tick, font: { size: 11 }, callback: (v) => v + '%' },
            border: { display: false },
          },
        },
      },
    });
  }

  private initLineChart(): void {
    const canvas = document.getElementById('spLineChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.lineChart?.destroy();
    const dark = this.isDark();
    const c = this.colors(dark);
    const sorted = [...this.progressData].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: sorted.map((s) =>
          new Date(s.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        ),
        datasets: [
          {
            label: 'Score %',
            data: sorted.map((s) => s.percentage),
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167,139,250,0.12)',
            pointBackgroundColor: sorted.map((s) =>
              s.percentage >= 80 ? '#34d399' : s.percentage >= 60 ? '#facc15' : '#f87171'
            ),
            pointBorderColor: 'transparent',
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` Score: ${ctx.parsed.y}%` }, ...c.tooltip },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: c.tick, font: { size: 11 } },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: c.grid },
            ticks: { color: c.tick, font: { size: 11 }, callback: (v) => v + '%' },
            border: { display: false },
          },
        },
      },
    });
  }

  private initDonutChart(): void {
    const canvas = document.getElementById('spDonutChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.donutChart?.destroy();
    const dark = this.isDark();
    const c = this.colors(dark);

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed'],
        datasets: [
          {
            data: [this.passedCount, this.failedCount],
            backgroundColor: ['rgba(52,211,153,0.85)', 'rgba(248,113,113,0.85)'],
            borderColor: ['#34d399', '#f87171'],
            borderWidth: 0,
            hoverOffset: 8,
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
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
            ...c.tooltip,
          },
        },
      },
    });
  }

  getPercentageColor(value: number): string {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  getProgressGradient(value: number): string {
    if (value >= 80) return 'from-green-500 to-emerald-400';
    if (value >= 60) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
