import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IStudAllSubResponse, StudentAllSubject } from '../../interfaces/IStudAllSubResponse';
import { StudentServiceService } from '../../services/student-service.service';
import { IEnrollSubResponse } from '../../interfaces/IEnrollSubResponse';
import { ToastrService } from 'ngx-toastr';

interface CarouselCard {
  sub: StudentAllSubject;
  visualIndex: number; // 0..VISIBLE-1, الموقع الحقيقي على الشاشة
}

@Component({
  selector: 'app-view-all-subjects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './view-all-subjects.component.html',
  styleUrl: './view-all-subjects.component.css',
})
export class ViewAllSubjectsComponent implements OnInit, OnDestroy {
  private readonly studentService = inject(StudentServiceService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private toastr = inject(ToastrService);

  allSub: StudentAllSubject[] = [];
  cards: CarouselCard[] = [];

  isLoading = true;
  hoveredVisualIndex: number | null = null;

  // offset = أول كارد مرئي في allSub
  private offset = 0;
  private isAnimating = false;
  private hoverTimeout: any = null;
  private animTimeout: any = null;

  // عرض كارد واحد بالـ px — لازم يتطابق مع sm:w-[260px] في الـ template
  readonly CARD_W = 260;
  // عدد الكاردز المرئية
  readonly VISIBLE = 5;

  ngOnInit(): void {
    this.viewAllSubjects();
  }

  ngOnDestroy(): void {
    clearTimeout(this.hoverTimeout);
    clearTimeout(this.animTimeout);
  }

  viewAllSubjects() {
    this.isLoading = true;
    this.studentService.getAllSubjects().subscribe({
      next: (res: IStudAllSubResponse) => {
        this.allSub = res.result || [];
        this.buildCards();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error(err.error?.message);
        this.isLoading = false;
      },
    });
  }

  /**
   * بنبني VISIBLE كارد، كل واحد عارف موقعه البصري (visualIndex).
   * الكارد اللي على اليسار (0) والكارد اللي على اليمين (VISIBLE-1)
   * بيبقوا شفافين عشان يديوا حس الـ edge.
   */
  buildCards() {
    const len = this.allSub.length;
    if (!len) return;
    this.cards = Array.from({ length: this.VISIBLE }, (_, i) => ({
      sub: this.allSub[(this.offset + i) % len],
      visualIndex: i,
    }));
  }

  setHovered(visualIndex: number | null) {
    this.hoveredVisualIndex = visualIndex;

    clearTimeout(this.hoverTimeout);

    if (visualIndex === null) return;
    if (this.isAnimating) return;

    // edge cards فقط
    const isLeft = visualIndex === 0;
    const isRight = visualIndex === this.VISIBLE - 1;
    if (!isLeft && !isRight) return;

    this.hoverTimeout = setTimeout(() => {
      if (this.hoveredVisualIndex !== visualIndex) return;
      this.rotate(isRight ? 'right' : 'left');
    }, 600);
  }

  private rotate(direction: 'left' | 'right') {
    if (this.isAnimating || this.allSub.length < this.VISIBLE) return;
    this.isAnimating = true;

    const len = this.allSub.length;
    const ANIM_MS = 380;

    if (direction === 'right') {
      // كل كارد يتحرك يسار بمقدار CARD_W
      this.cards.forEach((c) => c.visualIndex--);

      // الكارد اللي راح بره الشاشة يسار (-1) → نحطه على اليمين (VISIBLE-1)
      // لكن الأول نغير الـ data بتاعته للكارد الجديد اللي هييجي
      this.animTimeout = setTimeout(() => {
        this.offset = (this.offset + 1) % len;
        this.buildCards();
        this.isAnimating = false;
      }, ANIM_MS);
    } else {
      // كل كارد يتحرك يمين بمقدار CARD_W
      this.cards.forEach((c) => c.visualIndex++);

      this.animTimeout = setTimeout(() => {
        this.offset = (this.offset - 1 + len) % len;
        this.buildCards();
        this.isAnimating = false;
      }, ANIM_MS);
    }
  }

  /**
   * بيحسب الـ transform لكل كارد بناءً على visualIndex.
   * visualIndex=0 → أقصى يسار، visualIndex=VISIBLE-1 → أقصى يمين.
   * الـ transition بيبقى فقط لما الكارد بيتحرك.
   */
  getCardStyle(card: CarouselCard): string {
    const x = card.visualIndex * this.CARD_W;
    return `transform: translateX(${x}px);`;
  }

  isEdgeCard(card: CarouselCard): boolean {
    return card.visualIndex === 0 || card.visualIndex === this.VISIBLE - 1;
  }

  isLeftEdge(card: CarouselCard): boolean {
    return card.visualIndex === 0;
  }

  isRightEdge(card: CarouselCard): boolean {
    return card.visualIndex === this.VISIBLE - 1;
  }

  isHovered(card: CarouselCard): boolean {
    return this.hoveredVisualIndex === card.visualIndex;
  }

  overlapCard(card: CarouselCard): string {
    return this.isHovered(card)
      ? 'z-50 scale-[1.15] -translate-y-4 border-primary/50 !bg-background shadow-[0_30px_60px_-15px_var(--brand-primary)]'
      : 'z-10';
  }

  getColor(index: number): string {
    return [
      'text-sky-400',
      'text-purple-400',
      'text-pink-400',
      'text-green-400',
      'text-yellow-400',
    ][index % 5];
  }

  getBgColor(index: number): string {
    return [
      'bg-sky-500/10',
      'bg-purple-500/10',
      'bg-pink-500/10',
      'bg-green-500/10',
      'bg-yellow-500/10',
    ][index % 5];
  }

  enrollSub(id: string) {
    this.studentService.enrollSubject(id).subscribe({
      next: (res: IEnrollSubResponse) => {
        setTimeout(
          () => this.toastr.success(res.message || 'Enrolled successfully.', 'Success'),
          850
        );
        this.router.navigate(['/student/my-subjects']);
      },
      error: (err: HttpErrorResponse) => {
        setTimeout(
          () => this.toastr.error(err.error?.message || 'Error enrolling in subject', 'Error'),
          850
        );
      },
    });
  }
}
