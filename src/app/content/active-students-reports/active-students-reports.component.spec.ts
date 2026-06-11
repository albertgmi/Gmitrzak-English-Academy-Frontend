import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveStudentsReportsComponent } from './active-students-reports.component';

describe('ActiveStudentsReportsComponent', () => {
  let component: ActiveStudentsReportsComponent;
  let fixture: ComponentFixture<ActiveStudentsReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveStudentsReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveStudentsReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
