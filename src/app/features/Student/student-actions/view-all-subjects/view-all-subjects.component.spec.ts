import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllSubjectsComponent } from './view-all-subjects.component';

describe('ViewAllSubjectsComponent', () => {
  let component: ViewAllSubjectsComponent;
  let fixture: ComponentFixture<ViewAllSubjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllSubjectsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAllSubjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
