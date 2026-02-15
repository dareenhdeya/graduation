import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSubjectDetailsComponent } from './admin-subject-details.component';

describe('AdminSubjectDetailsComponent', () => {
  let component: AdminSubjectDetailsComponent;
  let fixture: ComponentFixture<AdminSubjectDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSubjectDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSubjectDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
