import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ParentServiceService } from '../../services/parent-service.service';
import { IChildren, IViewChildrenResponse } from '../../interfaces/IViewChildrenResponse';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-view-children',
  standalone: true,
  imports: [CommonModule, RouterLink],

  templateUrl: './view-children.component.html',
  styleUrl: './view-children.component.css',
})
export class ViewChildrenComponent implements OnInit {
  private readonly parentService = inject(ParentServiceService);
  
 
  isLoading = true;
  children: IChildren[] = [];
  errorMessage = '';

  ngOnInit() {
    this.showChildren();
  }

  showChildren() {
    this.isLoading = true;
    this.parentService.showChildren().subscribe({
      next: (res: IViewChildrenResponse) => {
        this.children = res.data;
        this.isLoading = false;
        console.log(res);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error.message || 'An error occurred while fetching children data.';
        this.isLoading = false;
        console.error(this.errorMessage);
      }
    });
  }
}