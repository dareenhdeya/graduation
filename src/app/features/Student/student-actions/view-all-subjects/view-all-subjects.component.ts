import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Import RouterLink
import { IStudAllSubResponse, StudentAllSubject } from '../../interfaces/IStudAllSubResponse'; // Check path
import { StudentServiceService } from '../../services/student-service.service';
import { IEnrollSubResponse } from '../../interfaces/IEnrollSubResponse';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-all-subjects',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './view-all-subjects.component.html',
  styleUrl: './view-all-subjects.component.css',
})
export class ViewAllSubjectsComponent implements OnInit {
  private readonly studentService = inject(StudentServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private toastr = inject(ToastrService);
  allSub: StudentAllSubject[] = [];
  isLoading = true; // Add loading state

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  scrollInterval: any;

  hoveredIndex: number | null = null;

  ngOnInit(): void {
    this.viewAllSubjects();
  }

  viewAllSubjects() {
    this.isLoading = true;
    this.studentService.getAllSubjects().subscribe({
      next: (res: IStudAllSubResponse) => {
        this.allSub = res.result || [];
        this.isLoading = false;
        console.log(this.allSub);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err.error.message);
        this.isLoading = false;
      },
    });
  }

  //  give each subject a unique color based on its index
  getColor(index: number): string {
    const colors = [
      'text-sky-400',
      'text-purple-400',
      'text-pink-400',
      'text-green-400',
      'text-yellow-400',
    ];
    return colors[index % colors.length]; // 5 % 5 = 0 , 6 % 5 = 1
  }

  getBgColor(index: number): string {
    const colors = [
      'bg-sky-500/10',
      'bg-purple-500/10',
      'bg-pink-500/10',
      'bg-green-500/10',
      'bg-yellow-500/10',
    ];
    return colors[index % colors.length];
  }
  getCardBgColor(index: number): string {
    const colors = [
      'bg-sky-500/10',
      'bg-purple-500/10',
      'bg-pink-500/10',
      'bg-green-500/10',
      'bg-yellow-500/10',
    ];
    return colors[index % colors.length];
  }

  enrollSub(id: string) {
    this.studentService.enrollSubject(id).subscribe({
      next: (res: IEnrollSubResponse) => {
        console.log(res.message, '🥳🥳🥳🥳🥳');
        setTimeout(() => {
          this.toastr.success(res.message || 'Enrolled successfully.', 'Success');
        }, 850);
        this.router.navigate(['/student/my-subjects']);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err.error?.message || 'Error enrolling in subject');
        setTimeout(() => {
          this.toastr.error(err.error?.message || 'Error enrolling in subject', 'Error');
        }, 850);
      },
    });
  }

  // to trigger when hover card
  setHovered(index: number | null) {
    this.hoveredIndex = index;
  }

  overlapCard(index: number): string {
    const overlapClasses =
      'z-50 scale-[1.15] -translate-y-4 border-primary/50 !bg-background shadow-[0_30px_60px_-15px_var(--brand-primary)]';
    if (this.hoveredIndex === index) {
      return overlapClasses;
    } else {
      return 'z-10';
    }
  }

  private animationFrameId: any = null;
  private readonly EDGE_THRESHOLD = 200;
  private readonly SCROLL_SPEED = 8; // 💡 لو عايزه أسرع كمان، خليها 20

  onMouseMove(event: MouseEvent) {
    const container = this.scrollContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    if (rect.width - mouseX < this.EDGE_THRESHOLD) {
      this.startAutoScroll(this.SCROLL_SPEED);
    }
    else if (mouseX < this.EDGE_THRESHOLD) {
      this.startAutoScroll(-this.SCROLL_SPEED);
    }
    else {
      this.stopAutoScroll();
    }
  }

  // 2. استخدام requestAnimationFrame بدل setInterval
  startAutoScroll(step: number) {
    if (this.animationFrameId) return;

    const container = this.scrollContainer.nativeElement;
    container.classList.remove('scroll-smooth', 'snap-x', 'snap-mandatory');

    // دالة بتنادي نفسها مع كل فريم للشاشة
    const autoScroll = () => {
      container.scrollLeft += step;
      this.animationFrameId = requestAnimationFrame(autoScroll);
    };

    this.animationFrameId = requestAnimationFrame(autoScroll);
  }

  stopAutoScroll() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;

      const container = this.scrollContainer.nativeElement;
      container.classList.add('scroll-smooth', 'snap-x', 'snap-mandatory');
    }
  }
}

// // me
// import { HttpErrorResponse } from '@angular/common/http';
// import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, RouterLink } from '@angular/router';
// import { IStudAllSubResponse, StudentAllSubject } from '../../interfaces/IStudAllSubResponse';
// import { StudentServiceService } from '../../services/student-service.service';
// import { IEnrollSubResponse } from '../../interfaces/IEnrollSubResponse';
// import { ToastrService } from 'ngx-toastr';

// interface CarouselCard {
//   sub: StudentAllSubject;
//   visualIndex: number;
// }

// @Component({
//   selector: 'app-view-all-subjects',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './view-all-subjects.component.html',
//   styleUrl: './view-all-subjects.component.css',
// })
// export class ViewAllSubjectsComponent implements OnInit, OnDestroy {
//   private readonly studentService = inject(StudentServiceService);
//   private readonly router = inject(Router);
//   private readonly ngZone = inject(NgZone);
//   private toastr = inject(ToastrService);

//   allSub: StudentAllSubject[] = [];
//   cards: CarouselCard[] = [];

//   isLoading = true;
//   hoveredVisualIndex: number | null = null;

//   private offset = 0;
//   private isAnimating = false;
//   private hoverTimeout: any = null;
//   private animTimeout: any = null;

//   readonly CARD_W = 260;
//   readonly VISIBLE = 5;

//   ngOnInit(): void {
//     this.viewAllSubjects();
//   }

//   ngOnDestroy(): void {
//     clearTimeout(this.hoverTimeout);
//     clearTimeout(this.animTimeout);
//   }

//   viewAllSubjects() {
//     this.isLoading = true;
//     this.studentService.getAllSubjects().subscribe({
//       next: (res: IStudAllSubResponse) => {
//         this.allSub = res.result || [];
//         this.buildCards();
//         this.isLoading = false;
//       },
//       error: (err: HttpErrorResponse) => {
//         console.error(err.error?.message);
//         this.isLoading = false;
//       },
//     });
//   }

//   buildCards() {
//     const len = this.allSub.length;
//     if (!len) return;
//     this.cards = Array.from({ length: this.VISIBLE }, (_, i) => ({
//       sub: this.allSub[(this.offset + i) % len],
//       visualIndex: i,
//     }));
//   }

//   setHovered(visualIndex: number | null) {
//     this.hoveredVisualIndex = visualIndex;

//     clearTimeout(this.hoverTimeout);

//     if (visualIndex === null) return;
//     if (this.isAnimating) return;

//     const isLeft = visualIndex === 0;
//     const isRight = visualIndex === this.VISIBLE - 1;
//     if (!isLeft && !isRight) return;

//     this.hoverTimeout = setTimeout(() => {
//       if (this.hoveredVisualIndex !== visualIndex) return;
//       this.rotate(isRight ? 'right' : 'left');
//     }, 600);
//   }

//   private rotate(direction: 'left' | 'right') {
//     if (this.isAnimating || this.allSub.length < this.VISIBLE) return;
//     this.isAnimating = true;

//     const len = this.allSub.length;
//     const ANIM_MS = 380;

//     if (direction === 'right') {
//       this.cards.forEach((c) => c.visualIndex--);

//       this.animTimeout = setTimeout(() => {
//         this.offset = (this.offset + 1) % len;
//         this.buildCards();
//         this.isAnimating = false;
//       }, ANIM_MS);
//     } else {
//       this.cards.forEach((c) => c.visualIndex++);

//       this.animTimeout = setTimeout(() => {
//         this.offset = (this.offset - 1 + len) % len;
//         this.buildCards();
//         this.isAnimating = false;
//       }, ANIM_MS);
//     }
//   }

//   getCardStyle(card: CarouselCard): string {
//     const x = card.visualIndex * this.CARD_W;
//     return `transform: translateX(${x}px);`;
//   }

//   isEdgeCard(card: CarouselCard): boolean {
//     return card.visualIndex === 0 || card.visualIndex === this.VISIBLE - 1;
//   }

//   isLeftEdge(card: CarouselCard): boolean {
//     return card.visualIndex === 0;
//   }

//   isRightEdge(card: CarouselCard): boolean {
//     return card.visualIndex === this.VISIBLE - 1;
//   }

//   isHovered(card: CarouselCard): boolean {
//     return this.hoveredVisualIndex === card.visualIndex;
//   }

//   overlapCard(card: CarouselCard): string {
//     return this.isHovered(card)
//       ? 'z-50 scale-[1.15] -translate-y-4 border-primary/50 !bg-background shadow-[0_30px_60px_-15px_var(--brand-primary)]'
//       : 'z-10';
//   }

//   getColor(index: number): string {
//     return [
//       'text-sky-400',
//       'text-purple-400',
//       'text-pink-400',
//       'text-green-400',
//       'text-yellow-400',
//     ][index % 5];
//   }

//   getBgColor(index: number): string {
//     return [
//       'bg-sky-500/10',
//       'bg-purple-500/10',
//       'bg-pink-500/10',
//       'bg-green-500/10',
//       'bg-yellow-500/10',
//     ][index % 5];
//   }

//   enrollSub(id: string) {
//     this.studentService.enrollSubject(id).subscribe({
//       next: (res: IEnrollSubResponse) => {
//         setTimeout(
//           () => this.toastr.success(res.message || 'Enrolled successfully.', 'Success'),
//           850
//         );
//         this.router.navigate(['/student/my-subjects']);
//       },
//       error: (err: HttpErrorResponse) => {
//         setTimeout(
//           () => this.toastr.error(err.error?.message || 'Error enrolling in subject', 'Error'),
//           850
//         );
//       },
//     });
//   }
// }
