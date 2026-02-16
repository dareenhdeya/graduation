import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentActionsComponent } from './student-actions.component';

describe('StudentActionsComponent', () => {
  let component: StudentActionsComponent;
  let fixture: ComponentFixture<StudentActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
