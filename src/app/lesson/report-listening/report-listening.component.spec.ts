import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportListeningComponent } from './report-listening.component';

describe('ReportListeningComponent', () => {
  let component: ReportListeningComponent;
  let fixture: ComponentFixture<ReportListeningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportListeningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportListeningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
