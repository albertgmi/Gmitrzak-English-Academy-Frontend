import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonLastWeekComponent } from './lesson-last-week.component';

describe('LessonLastWeekComponent', () => {
  let component: LessonLastWeekComponent;
  let fixture: ComponentFixture<LessonLastWeekComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonLastWeekComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonLastWeekComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
