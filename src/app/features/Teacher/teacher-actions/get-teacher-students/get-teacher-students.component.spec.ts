import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetTeacherStudentsComponent } from './get-teacher-students.component';

describe('GetTeacherStudentsComponent', () => {
  let component: GetTeacherStudentsComponent;
  let fixture: ComponentFixture<GetTeacherStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetTeacherStudentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetTeacherStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
