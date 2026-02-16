import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEnrolledSubjectsComponent } from './view-enrolled-subjects.component';

describe('ViewEnrolledSubjectsComponent', () => {
  let component: ViewEnrolledSubjectsComponent;
  let fixture: ComponentFixture<ViewEnrolledSubjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewEnrolledSubjectsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEnrolledSubjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
