import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParentServiceService } from '../../services/parent-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ISubjectReportData } from '../../interfaces/IViewSubjectReport.interface';
import { Chart, registerables } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';

Chart.register(...registerables);

@Component({
  selector: 'app-subject-report',
  imports: [CommonModule, RouterLink,TranslateModule],
  templateUrl: './subject-report.component.html',
  styleUrl: './subject-report.component.css',
})
export class SubjectReportComponent implements OnInit, OnDestroy {
  private readonly parentService = inject(ParentServiceService);
  private readonly route = inject(ActivatedRoute);

  isLoading = true;
  report: ISubjectReportData | null = null;
  errorMessage = '';
  subjectName = '';
  studentId = '';

  private barChart?: Chart;
  private lineChart?: Chart;
  private donutChart?: Chart;

  ngOnInit() {
    const sid = this.route.snapshot.paramMap.get('sid') || '';
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.subjectName = this.route.snapshot.paramMap.get('subjectName') || 'Subject';
    this.loadReport(sid, this.studentId);
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.lineChart?.destroy();
    this.donutChart?.destroy();
  }

  loadReport(sid: string, studentId: string) {
    this.isLoading = true;
    this.parentService.viewSubjectReport(sid, studentId).subscribe({
      next: (res) => {
        this.report = res.data;
        this.isLoading = false;
        setTimeout(() => this.initCharts(), 0);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Failed to load report.';
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
    if (!this.report?.submissionDTOs?.length) return;
    this.initBarChart();
    this.initLineChart();
    this.initDonutChart();
  }

  private initBarChart(): void {
    const canvas = document.getElementById('srBarChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.barChart?.destroy();

    const dark = this.isDark();
    const c = this.colors(dark);
    const subs = this.report!.submissionDTOs;
    const labels = subs.map((s) => s.levelName);

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Score',
            data: subs.map((s) => s.percentage),
            backgroundColor: 'rgba(56,189,248,0.75)',
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Best Score',
            data: subs.map((s) => s.highestPercentage),
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
    const canvas = document.getElementById('srLineChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.lineChart?.destroy();

    const dark = this.isDark();
    const c = this.colors(dark);
    const subs = [...this.report!.submissionDTOs].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    const labels = subs.map((s) =>
      new Date(s.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    );
    const data = subs.map((s) => s.percentage);

    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Score %',
            data,
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167,139,250,0.12)',
            pointBackgroundColor: data.map((v) =>
              v >= 80 ? '#34d399' : v >= 50 ? '#facc15' : '#f87171'
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
          tooltip: {
            callbacks: { label: (ctx) => ` Score: ${ctx.parsed.y}%` },
            ...c.tooltip,
          },
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
    const canvas = document.getElementById('srDonutChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.donutChart?.destroy();

    const dark = this.isDark();
    const c = this.colors(dark);
    const passed = this.report!.submissionDTOs.filter((s) => s.percentage >= 50).length;
    const failed = this.report!.submissionDTOs.length - passed;

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed'],
        datasets: [
          {
            data: [passed, failed],
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

  get passedCount(): number {
    return this.report?.submissionDTOs.filter((s) => s.percentage >= 50).length ?? 0;
  }
  get failedCount(): number {
    return (this.report?.submissionDTOs.length ?? 0) - this.passedCount;
  }

  getPercentageColor(value: number): string {
    if (value >= 80) return 'text-green-400';
    if (value >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  getProgressGradient(value: number): string {
    if (value >= 80) return 'from-green-500 to-emerald-400';
    if (value >= 50) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  }
}
