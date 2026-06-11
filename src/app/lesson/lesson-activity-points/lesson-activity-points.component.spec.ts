import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonActivityPointsComponent } from './lesson-activity-points.component';

describe('LessonActivityPointsComponent', () => {
  let component: LessonActivityPointsComponent;
  let fixture: ComponentFixture<LessonActivityPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonActivityPointsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonActivityPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
