import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentActionsComponent } from './parent-actions.component';

describe('ParentActionsComponent', () => {
  let component: ParentActionsComponent;
  let fixture: ComponentFixture<ParentActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
