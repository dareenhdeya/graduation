import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { Chart, registerables } from 'chart.js';
import {
  IStudentProgressItem,
  StudentProgressResponse,
} from '../../interfaces/IStudentProgress.interface';
import { TranslateModule } from '@ngx-translate/core';

Chart.register(...registerables);

@Component({
  selector: 'app-student-progress',
  imports: [CommonModule, RouterLink, TranslateModule],
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
  private attemptsChart?: Chart;

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
    this.attemptsChart?.destroy();
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
    this.initAttemptsChart();
    this.initLineChart();
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
            label: 'Last attempt',
            data: this.progressData.map((s) => s.percentage),
            backgroundColor: 'rgba(127,119,221,0.85)',
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Best score',
            data: this.progressData.map((s) => s.highestPercentage),
            backgroundColor: 'rgba(93,202,165,0.85)',
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

  private initAttemptsChart(): void {
    const canvas = document.getElementById('spAttemptsChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.attemptsChart?.destroy();
    const dark = this.isDark();
    const c = this.colors(dark);
    const maxAttempts = Math.max(...this.progressData.map((s) => s.attemptsUsed), 1);

    this.attemptsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.progressData.map((s) => s.levelName),
        datasets: [
          {
            label: 'Attempts',
            data: this.progressData.map((s) => s.attemptsUsed),
            backgroundColor: 'rgba(186,117,23,0.8)',
            borderWidth: 0,
            borderRadius: 6,
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
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} attempts` }, ...c.tooltip },
        },
        scales: {
          x: {
            min: 0,
            max: maxAttempts + 1,
            grid: { color: c.grid },
            ticks: { color: c.tick, font: { size: 11 }, stepSize: 1 },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { color: c.tick, font: { size: 11 } },
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
            borderColor: '#7F77DD',
            backgroundColor: 'rgba(127,119,221,0.07)',
            pointBackgroundColor: sorted.map((s) => (s.percentage >= 60 ? '#5DCAA5' : '#E24B4A')),
            pointBorderColor: 'transparent',
            pointRadius: 7,
            pointHoverRadius: 9,
            borderWidth: 2,
            fill: true,
            tension: 0.35,
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
}
