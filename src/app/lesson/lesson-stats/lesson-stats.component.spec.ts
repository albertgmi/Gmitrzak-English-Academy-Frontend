import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonStatsComponent } from './lesson-stats.component';

describe('LessonStatsComponent', () => {
  let component: LessonStatsComponent;
  let fixture: ComponentFixture<LessonStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
