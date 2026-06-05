import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeacherServiceService } from '../../../services/teacher-service.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-quizzes-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './quizzes-list.component.html',
  styleUrl: './quizzes-list.component.css',
})
export class QuizzesListComponent implements OnInit {
  subjectId = signal<string>('');
  quizzes = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherServiceService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      const parentSid = params.get('sid');
      if (parentSid) {
        this.subjectId.set(parentSid);
        this.fetchQuizzes(parentSid);
      } else {
        this.route.paramMap.subscribe(pParams => {
          const sid = pParams.get('sid');
           if (sid) {
              this.subjectId.set(sid);
              this.fetchQuizzes(sid);
           }
        })
      }
    });
  }

  fetchQuizzes(sid: string) {
    this.isLoading.set(true);
    this.teacherService.getQuizzes(sid).subscribe({
      next: (res: any) => {
        const data = res?.result || res?.data || res || [];
        this.quizzes.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching quizzes:', err);
        this.quizzes.set([]);
        this.showToast('Failed to load quizzes from server.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    if (type === 'success') {
      this.toastr.success(msg, 'Success');
    } else {
      this.toastr.error(msg, 'Error');
    }
  }
}
