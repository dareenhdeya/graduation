import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for pipes and @if
import { ActivatedRoute, RouterLink } from '@angular/router'; // Required for Link
import { ParentServiceService } from '../../services/parent-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IViewChildProfile, IChildProfile } from '../../interfaces/IViewChildProfile';

@Component({
  selector: 'app-child-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
    { id: 0, label: 'None', icon: 'fa-solid fa-person-walking' },
    { id: 1, label: 'Hearing', icon: 'fa-solid fa-ear-listen' },
    { id: 2, label: 'Speech', icon: 'fa-solid fa-hands-asl-interpreting' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
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
        console.log(this.childProfile);
      },
      error: (err: HttpErrorResponse) => {
        console.error(err.error.message || 'Error fetching profile.');
        this.isLoading = false;
      },
    });
  }

  getInitials(fName: string, lName: string): string {
    return (fName.charAt(0) + lName.charAt(0)).toUpperCase();
  }

  getDisabilityLabel(id: any): string {
    const type = this.disabilityMap.find(d => d.id === Number(id));
    return type ? type.label : 'Unknown';
  }
  
  getDisabilityIcon(id: any): string {
    const type = this.disabilityMap.find(d => d.id === Number(id));
    return type ? type.icon : 'fa-solid fa-circle-question';
  }
}