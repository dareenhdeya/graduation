// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { StudentServiceService } from '../services/student-service.service';
// import { Submission } from '../interfaces/IStudSubmissions.interface';
// import { Chart, registerables } from 'chart.js';

// Chart.register(...registerables);

// @Component({
//   selector: 'app-progress',
//   imports: [CommonModule],
//   templateUrl: './progress.component.html',
//   styleUrl: './progress.component.css',
// })
// export class ProgressComponent implements OnInit, OnDestroy {
//   submissions: Submission[] = [];
//   isLoading = true;
//   error = '';
//   avgAttempts: number = 0;

//   groupedSubjects: { name: string; submissions: Submission[]; avg: number }[] = [];

//   private lineChart?: Chart;
//   private radarChart?: Chart;
//   private barScoreChart?: Chart;
//   private pieChart?: Chart;

//   constructor(private studentService: StudentServiceService) {}

//   ngOnInit() {
//     this.studentService.viewSubmissions().subscribe({
//       next: (res) => {
//         this.submissions = res.result;
//         this.groupBySubject();
//         this.calculateAvgAttempts();
//         this.isLoading = false;
//         setTimeout(() => this.initCharts(), 0);
//       },
//       error: () => {
//         this.error = 'Failed to load progress data.';
//         this.isLoading = false;
//       },
//     });
//   }

//   ngOnDestroy(): void {
//     this.lineChart?.destroy();
//     this.radarChart?.destroy();
//     this.barScoreChart?.destroy();
//     this.pieChart?.destroy();
//   }

//   groupBySubject() {
//     const map = new Map<string, Submission[]>();
//     for (const s of this.submissions) {
//       if (!map.has(s.subjectName)) map.set(s.subjectName, []);
//       map.get(s.subjectName)!.push(s);
//     }
//     this.groupedSubjects = Array.from(map.entries()).map(([name, subs]) => ({
//       name,
//       submissions: subs,
//       avg: Math.round(subs.reduce((acc, s) => acc + s.highestPercentage, 0) / subs.length),
//     }));
//   }

//   private isDarkMode(): boolean {
//     return (
//       window.matchMedia('(prefers-color-scheme: dark)').matches ||
//       document.documentElement.classList.contains('dark')
//     );
//   }

//   private initCharts(): void {
//     if (this.groupedSubjects.length === 0) return;
//     this.initLineChart();
//     this.initRadarChart();
//     this.initBarScoreChart();
//     this.initPieChart();
//   }

//   private initLineChart(): void {
//     const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
//     if (!canvas) return;
//     this.lineChart?.destroy();

//     const dark = this.isDarkMode();
//     const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
//     const tickColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
//     const labels = this.groupedSubjects.map((g) => g.name);
//     const data = this.groupedSubjects.map((g) => g.avg);

//     this.lineChart = new Chart(canvas, {
//       type: 'line',
//       data: {
//         labels,
//         datasets: [
//           {
//             label: 'Best Score %',
//             data,
//             borderColor: '#34d399',
//             backgroundColor: 'rgba(52,211,153,0.12)',
//             pointBackgroundColor: data.map((v) =>
//               v >= 80 ? '#34d399' : v >= 50 ? '#facc15' : '#f87171'
//             ),
//             pointBorderColor: 'transparent',
//             pointRadius: 6,
//             pointHoverRadius: 8,
//             borderWidth: 2.5,
//             fill: true,
//             tension: 0.4,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: { label: (ctx) => ` Best score: ${ctx.parsed.y}%` },
//             ...this.tooltipDefaults(dark),
//           },
//         },
//         scales: {
//           x: {
//             grid: { display: false },
//             ticks: { color: tickColor, font: { size: 12 } },
//             border: { display: false },
//           },
//           y: {
//             min: 0,
//             max: 100,
//             grid: { color: gridColor },
//             ticks: { color: tickColor, font: { size: 11 }, callback: (v) => v + '%' },
//             border: { display: false },
//           },
//         },
//       },
//     });
//   }

//   private initRadarChart(): void {
//     const canvas = document.getElementById('radarChart') as HTMLCanvasElement;
//     if (!canvas) return;
//     this.radarChart?.destroy();

//     const dark = this.isDarkMode();
//     const gridColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
//     const tickColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

//     this.radarChart = new Chart(canvas, {
//       type: 'radar',
//       data: {
//         labels: this.groupedSubjects.map((g) => g.name),
//         datasets: [
//           {
//             label: 'Score %',
//             data: this.groupedSubjects.map((g) => g.avg),
//             borderColor: '#38bdf8',
//             backgroundColor: 'rgba(56,189,248,0.15)',
//             pointBackgroundColor: '#38bdf8',
//             pointBorderColor: 'transparent',
//             pointRadius: 4,
//             borderWidth: 2,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed.r}%` },
//             ...this.tooltipDefaults(dark),
//           },
//         },
//         scales: {
//           r: {
//             min: 0,
//             max: 100,
//             grid: { color: gridColor },
//             angleLines: { color: gridColor },
//             pointLabels: { color: tickColor, font: { size: 11 } },
//             ticks: { display: false, stepSize: 25 },
//           },
//         },
//       },
//     });
//   }

//   private initBarScoreChart(): void {
//     const canvas = document.getElementById('barScoreChart') as HTMLCanvasElement;
//     if (!canvas) return;
//     this.barScoreChart?.destroy();

//     const dark = this.isDarkMode();
//     const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
//     const tickColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
//     const subs = this.submissions;
//     const labels = subs.map((s) => `${s.subjectName} › ${s.levelName}`);

//     this.barScoreChart = new Chart(canvas, {
//       type: 'bar',
//       data: {
//         labels,
//         datasets: [
//           {
//             label: 'Last Score',
//             data: subs.map((s) => s.percentage),
//             backgroundColor: 'rgba(56,189,248,0.7)',
//             borderWidth: 0,
//             borderRadius: 6,
//             borderSkipped: false,
//           },
//           {
//             label: 'Best Score',
//             data: subs.map((s) => s.highestPercentage),
//             backgroundColor: 'rgba(52,211,153,0.7)',
//             borderWidth: 0,
//             borderRadius: 6,
//             borderSkipped: false,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: {
//               label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
//             },
//             ...this.tooltipDefaults(dark),
//           },
//         },
//         scales: {
//           x: {
//             grid: { display: false },
//             ticks: { color: tickColor, font: { size: 11 }, maxRotation: 30, autoSkip: false },
//             border: { display: false },
//           },
//           y: {
//             min: 0,
//             max: 100,
//             grid: { color: gridColor },
//             ticks: { color: tickColor, font: { size: 11 }, callback: (v) => v + '%' },
//             border: { display: false },
//           },
//         },
//       },
//     });
//   }

//   private initPieChart(): void {
//     const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
//     if (!canvas) return;
//     this.pieChart?.destroy();

//     const dark = this.isDarkMode();
//     const passed = this.submissions.filter((s) => s.highestPercentage >= 50).length;
//     const failed = this.submissions.length - passed;

//     this.pieChart = new Chart(canvas, {
//       type: 'pie',
//       data: {
//         labels: ['Passed', 'Failed'],
//         datasets: [
//           {
//             data: [passed, failed],
//             backgroundColor: ['rgba(52,211,153,0.8)', 'rgba(248,113,113,0.8)'],
//             borderColor: ['#34d399', '#f87171'],
//             borderWidth: 0,
//             hoverOffset: 8,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: {
//               label: (ctx) => {
//                 const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
//                 const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
//                 return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
//               },
//             },
//             ...this.tooltipDefaults(dark),
//           },
//         },
//       },
//     });
//   }

//   private tooltipDefaults(dark: boolean) {
//     return {
//       backgroundColor: dark ? '#1e1e2e' : '#fff',
//       titleColor: dark ? '#e2e8f0' : '#1e293b',
//       bodyColor: dark ? '#94a3b8' : '#475569',
//       borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
//       borderWidth: 1,
//       padding: 10,
//       cornerRadius: 12,
//     };
//   }

//   getScoreColor(pct: number): string {
//     if (pct >= 80) return 'text-emerald-400';
//     if (pct >= 50) return 'text-yellow-400';
//     return 'text-red-400';
//   }

//   getBarColor(pct: number): string {
//     if (pct >= 80) return 'bg-emerald-400';
//     if (pct >= 50) return 'bg-yellow-400';
//     return 'bg-red-400';
//   }

//   formatDate(dateStr: string): string {
//     return new Date(dateStr).toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }

//   calculateAvgAttempts() {
//     if (this.submissions.length === 0) {
//       this.avgAttempts = 0;
//       return;
//     }
//     const total = this.submissions.reduce((sum, s) => sum + (s.attemptsUsed || 0), 0);
//     this.avgAttempts = Math.round(total / this.submissions.length);
//   }

//   get bestScore(): number {
//     return Math.max(...this.submissions.map((s) => s.highestPercentage ?? 0));
//   }

//   get passedCount(): number {
//     return this.submissions.filter((s) => s.highestPercentage >= 50).length;
//   }

//   get failedCount(): number {
//     return this.submissions.length - this.passedCount;
//   }
// }
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentServiceService } from '../services/student-service.service';
import { Submission } from '../interfaces/IStudSubmissions.interface';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-progress',
  imports: [CommonModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css',
})
export class ProgressComponent implements OnInit, OnDestroy {
  submissions: Submission[] = [];
  isLoading = true;
  error = '';
  avgAttempts: number = 0;

  groupedSubjects: { name: string; submissions: Submission[]; avg: number }[] = [];

  private lineChart?: Chart;
  private radarChart?: Chart;
  private barScoreChart?: Chart;
  private pieChart?: Chart;

  constructor(private studentService: StudentServiceService) {}

  ngOnInit() {
    this.studentService.viewSubmissions().subscribe({
      next: (res) => {
        this.submissions = res.result;
        this.groupBySubject();
        this.calculateAvgAttempts();
        this.isLoading = false;
        setTimeout(() => this.initCharts(), 0);
      },
      error: () => {
        this.error = 'Failed to load progress data.';
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.radarChart?.destroy();
    this.barScoreChart?.destroy();
    this.pieChart?.destroy();
  }

  groupBySubject() {
    const map = new Map<string, Submission[]>();
    for (const s of this.submissions) {
      if (!map.has(s.subjectName)) map.set(s.subjectName, []);
      map.get(s.subjectName)!.push(s);
    }
    this.groupedSubjects = Array.from(map.entries()).map(([name, subs]) => ({
      name,
      submissions: subs,
      avg: Math.round(subs.reduce((acc, s) => acc + s.highestPercentage, 0) / subs.length),
    }));
  }

  // ── الـ theme بيتحدد من الـ class على <html> بس ──────────────────────────
  // لو الـ class مش موجود، نرجع false (light) كـ safe default
  private isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  private chartColors(dark: boolean) {
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
    if (this.groupedSubjects.length === 0) return;
    this.initLineChart();
    this.initRadarChart();
    this.initBarScoreChart();
    this.initPieChart();
  }

  private initLineChart(): void {
    const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.lineChart?.destroy();

    const dark = this.isDarkMode();
    const colors = this.chartColors(dark);
    const labels = this.groupedSubjects.map((g) => g.name);
    const data = this.groupedSubjects.map((g) => g.avg);

    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Best Score %',
            data,
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.12)',
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
            callbacks: { label: (ctx) => ` Best score: ${ctx.parsed.y}%` },
            ...colors.tooltip,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.tick, font: { size: 12 } },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: colors.grid },
            ticks: { color: colors.tick, font: { size: 11 }, callback: (v) => v + '%' },
            border: { display: false },
          },
        },
      },
    });
  }

  private initRadarChart(): void {
    const canvas = document.getElementById('radarChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.radarChart?.destroy();

    const dark = this.isDarkMode();
    const colors = this.chartColors(dark);

    this.radarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: this.groupedSubjects.map((g) => g.name),
        datasets: [
          {
            label: 'Score %',
            data: this.groupedSubjects.map((g) => g.avg),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56,189,248,0.15)',
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: 'transparent',
            pointRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed.r}%` },
            ...colors.tooltip,
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            grid: { color: colors.grid },
            angleLines: { color: colors.grid },
            pointLabels: { color: colors.tick, font: { size: 11 } },
            ticks: { display: false, stepSize: 25 },
          },
        },
      },
    });
  }

  private initBarScoreChart(): void {
    const canvas = document.getElementById('barScoreChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.barScoreChart?.destroy();

    const dark = this.isDarkMode();
    const colors = this.chartColors(dark);
    const subs = this.submissions;
    const labels = subs.map((s) => `${s.subjectName} › ${s.levelName}`);

    this.barScoreChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Last Score',
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
            ...colors.tooltip,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.tick, font: { size: 11 }, maxRotation: 30, autoSkip: false },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: colors.grid },
            ticks: { color: colors.tick, font: { size: 11 }, callback: (v) => v + '%' },
            border: { display: false },
          },
        },
      },
    });
  }

  private initPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.pieChart?.destroy();

    const dark = this.isDarkMode();
    const colors = this.chartColors(dark);
    const passed = this.submissions.filter((s) => s.highestPercentage >= 50).length;
    const failed = this.submissions.length - passed;

    this.pieChart = new Chart(canvas, {
      type: 'pie',
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
            ...colors.tooltip,
          },
        },
      },
    });
  }

  getScoreColor(pct: number): string {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  getBarColor(pct: number): string {
    if (pct >= 80) return 'bg-emerald-400';
    if (pct >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  calculateAvgAttempts() {
    if (this.submissions.length === 0) {
      this.avgAttempts = 0;
      return;
    }
    const total = this.submissions.reduce((sum, s) => sum + (s.attemptsUsed || 0), 0);
    this.avgAttempts = Math.round(total / this.submissions.length);
  }

  get bestScore(): number {
    return Math.max(...this.submissions.map((s) => s.highestPercentage ?? 0));
  }

  get passedCount(): number {
    return this.submissions.filter((s) => s.highestPercentage >= 50).length;
  }

  get failedCount(): number {
    return this.submissions.length - this.passedCount;
  }
}
