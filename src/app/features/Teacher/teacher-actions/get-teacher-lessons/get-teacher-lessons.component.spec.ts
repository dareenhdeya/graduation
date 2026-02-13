import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetTeacherLessonsComponent } from './get-teacher-lessons.component';

describe('GetTeacherLessonsComponent', () => {
  let component: GetTeacherLessonsComponent;
  let fixture: ComponentFixture<GetTeacherLessonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetTeacherLessonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetTeacherLessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
