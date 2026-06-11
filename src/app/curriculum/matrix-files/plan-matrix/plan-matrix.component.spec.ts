import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanMatrixComponent } from './plan-matrix.component';

describe('PlanMatrixComponent', () => {
  let component: PlanMatrixComponent;
  let fixture: ComponentFixture<PlanMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanMatrixComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
