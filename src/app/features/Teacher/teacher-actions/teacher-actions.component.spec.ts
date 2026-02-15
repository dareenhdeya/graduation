import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherActionsComponent } from './teacher-actions.component';

describe('TeacherActionsComponent', () => {
  let component: TeacherActionsComponent;
  let fixture: ComponentFixture<TeacherActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
