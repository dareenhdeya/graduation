import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDictionaryComponent } from './add-dictionary.component';

describe('AddDictionaryComponent', () => {
  let component: AddDictionaryComponent;
  let fixture: ComponentFixture<AddDictionaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDictionaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDictionaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
