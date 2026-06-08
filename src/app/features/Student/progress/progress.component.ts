import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentServiceService } from '../services/student-service.service';
import { Submission } from '../interfaces/IStudSubmissions.interface';

@Component({
  selector: 'app-progress',
  imports: [CommonModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css',
})
export class ProgressComponent implements OnInit {
  submissions: Submission[] = [];
  isLoading = true;
  error = '';

  avgAttempts: number = 0;

  // grouped by subject
  groupedSubjects: { name: string; submissions: Submission[]; avg: number }[] = [];

  constructor(private studentService: StudentServiceService) {}

  ngOnInit() {
    this.studentService.viewSubmissions().subscribe({
      next: (res) => {
        this.submissions = res.result;
        this.groupBySubject();
        this.calculateAvgAttempts();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load progress data.';
        this.isLoading = false;
      },
    });
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

    const totalAttempts = this.submissions.reduce((sum, s) => sum + (s.attemptsUsed || 0), 0);

    this.avgAttempts = Math.round(totalAttempts / this.submissions.length);
  }

  get bestScore(): number {
    return Math.max(...this.submissions.map((s) => s.highestPercentage ?? 0));
  }
}
