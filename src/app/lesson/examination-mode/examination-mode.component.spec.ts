import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExaminationModeComponent } from './examination-mode.component';

describe('ExaminationModeComponent', () => {
  let component: ExaminationModeComponent;
  let fixture: ComponentFixture<ExaminationModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExaminationModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExaminationModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
