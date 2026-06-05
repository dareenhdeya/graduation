import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParentServiceService } from '../../services/parent-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ISubjectReportData } from '../../interfaces/IViewSubjectReport.interface';

@Component({
  selector: 'app-subject-report',
  imports: [CommonModule, RouterLink],
  templateUrl: './subject-report.component.html',
  styleUrl: './subject-report.component.css',
})
export class SubjectReportComponent implements OnInit {
  private readonly parentService = inject(ParentServiceService);
  private readonly route = inject(ActivatedRoute);

  isLoading = true;
  report: ISubjectReportData | null = null;
  errorMessage = '';
  subjectName = '';
  studentId = '';

  ngOnInit() {
    const sid = this.route.snapshot.paramMap.get('sid') || '';
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.subjectName = this.route.snapshot.paramMap.get('subjectName') || 'Subject';
    this.loadReport(sid, this.studentId);
  }

  loadReport(sid: string, studentId: string) {
    this.isLoading = true;
    this.parentService.viewSubjectReport(sid, studentId).subscribe({
      next: (res) => {
        this.report = res.data;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Failed to load report.';
        this.isLoading = false;
      },
    });
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
