import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivateTeacherComponent } from './activate-teacher.component';

describe('ActivateTeacherComponent', () => {
  let component: ActivateTeacherComponent;
  let fixture: ComponentFixture<ActivateTeacherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivateTeacherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivateTeacherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
