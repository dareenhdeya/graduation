import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ParentServiceService } from '../../services/parent-service.service';
import { IChildren, IViewChildrenResponse } from '../../interfaces/IViewChildrenResponse';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NavigationStateService } from '../../../../core/auth/services/navigation-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-children',
  standalone: true,
  imports: [CommonModule, RouterLink,TranslateModule],
  templateUrl: './view-children.component.html',
  styleUrl: './view-children.component.css',
})
export class ViewChildrenComponent implements OnInit {
  private readonly parentService = inject(ParentServiceService);
  private readonly toastr = inject(ToastrService);
  // private readonly navState = inject(NavigationStateService);

  isLoading = true;
  children: IChildren[] = [];
  errorMessage = '';
  deletingId: string | null = null;
  childToDelete: IChildren | null = null;

  ngOnInit() {
    this.showChildren();
  }

  showChildren() {
    this.isLoading = true;
    this.parentService.showChildren().subscribe({
      next: (res: IViewChildrenResponse) => {
        this.children = res.data;
        // if (this.children.length > 0) {
        //   this.navState.lastParentChildId = this.children[0].id;
        // }
        this.isLoading = false;
        console.log(res);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'An error occurred while fetching children data.';
        this.isLoading = false;
        this.toastr.error(this.errorMessage, 'Error');
        console.error(this.errorMessage);
      },
    });
  }

  deleteChild(child: IChildren) {
    this.childToDelete = child;
  }

  cancelDelete() {
    this.childToDelete = null;
  }

  confirmDelete() {
    if (!this.childToDelete) return;

    const child = this.childToDelete;
    this.deletingId = child.id;

    this.parentService.deleteStudent(child).subscribe({
      next: () => {
        this.children = this.children.filter((c) => c.id !== child.id);
        this.deletingId = null;
        this.childToDelete = null;
        this.toastr.success(`${child.fName} has been removed successfully.`, 'Deleted');
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId = null;
        this.childToDelete = null;
        this.toastr.error(err.error?.message || 'Failed to delete student.', 'Error');
      },
    });
  }
}
