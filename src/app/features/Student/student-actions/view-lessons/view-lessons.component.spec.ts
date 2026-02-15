import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLessonsComponent } from './view-lessons.component';

describe('ViewLessonsComponent', () => {
  let component: ViewLessonsComponent;
  let fixture: ComponentFixture<ViewLessonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewLessonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
