import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavigationStateService {
  lastTeacherSid: string | null = null;
  // lastParentChildId: string | null = null;
}
