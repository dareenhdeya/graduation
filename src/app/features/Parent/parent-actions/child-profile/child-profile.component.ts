import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParentServiceService } from '../../services/parent-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IViewChildProfile, IChildProfile } from '../../interfaces/IViewChildProfile';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-child-profile',
  standalone: true,
  imports: [CommonModule, RouterLink,TranslateModule],
  templateUrl: './child-profile.component.html',
  styleUrl: './child-profile.component.css',
})
export class ChildProfileComponent implements OnInit {
  private readonly parentService = inject(ParentServiceService);
  private readonly route = inject(ActivatedRoute);

  childId: string | null = null;
  childProfile: IChildProfile | null = null;
  isLoading = true;

  readonly disabilityMap = [
    { label: 'None', icon: 'fa-solid fa-person-walking' },
    { label: 'Hearing', icon: 'fa-solid fa-ear-listen' },
    { label: 'Speech', icon: 'fa-solid fa-hands-asl-interpreting' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.childId = params.get('id');

      if (this.childId) {
        this.getChildProfile(this.childId);
      } else {
        this.isLoading = false;
      }
    });
  }

  getChildProfile(id: string) {
    this.isLoading = true;
    this.parentService.viewChildProfile(id).subscribe({
      next: (res: IViewChildProfile) => {
        this.childProfile = res.data;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error(err.error?.message || 'Error fetching profile.');
        this.isLoading = false;
      },
    });
  }

  getInitials(fName?: string, lName?: string): string {
    const f = fName?.charAt(0) ?? '';
    const l = lName?.charAt(0) ?? '';
    return (f + l).toUpperCase() || '?';
  }

  getDisabilityLabel(disability: string | number | null | undefined): string {
    if (disability === null || disability === undefined) return 'None';
    const value = String(disability).trim();
    const match = this.disabilityMap.find((d) => d.label.toLowerCase() === value.toLowerCase());
    return match ? match.label : 'Unknown';
  }

  getDisabilityIcon(disability: string | number | null | undefined): string {
    if (disability === null || disability === undefined) return this.disabilityMap[0].icon;
    const value = String(disability).trim();
    const match = this.disabilityMap.find((d) => d.label.toLowerCase() === value.toLowerCase());
    return match ? match.icon : 'fa-solid fa-circle-question';
  }

  hasDisability(disability: string | number | null | undefined): boolean {
    return this.getDisabilityLabel(disability) !== 'None';
  }
}
