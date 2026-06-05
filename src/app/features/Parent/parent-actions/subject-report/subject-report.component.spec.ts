import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectReportComponent } from './subject-report.component';

describe('SubjectReportComponent', () => {
  let component: SubjectReportComponent;
  let fixture: ComponentFixture<SubjectReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
