import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectCrudComponent } from './subject-crud.component';

describe('SubjectCrudComponent', () => {
  let component: SubjectCrudComponent;
  let fixture: ComponentFixture<SubjectCrudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectCrudComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectCrudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
