import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckEssaysComponent } from './check-essays.component';

describe('CheckEssaysComponent', () => {
  let component: CheckEssaysComponent;
  let fixture: ComponentFixture<CheckEssaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckEssaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckEssaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
