import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanModuleComponent } from './plan-module.component';

describe('PlanModuleComponent', () => {
  let component: PlanModuleComponent;
  let fixture: ComponentFixture<PlanModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanModuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
