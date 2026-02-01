import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, map } from 'rxjs';
import { AdminServiceService } from '../../../services/admin-service.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-details',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminServiceService);

  vm$ = this.route.paramMap.pipe(
    switchMap((pm) => {
      const id = pm.get('id')!;
      return this.route.queryParamMap.pipe(
        map((qm) => ({ id, role: qm.get('role') ? Number(qm.get('role')) : undefined }))
      );
    }),
    switchMap(({ id, role }) =>
      this.admin
        .viewUserById(id, role)
        .pipe(map((res) => ({ loading: false, error: '', user: res.data })))
    )
  );
}
