import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonStudyTimeComponent } from './lesson-study-time.component';

describe('LessonStudyTimeComponent', () => {
  let component: LessonStudyTimeComponent;
  let fixture: ComponentFixture<LessonStudyTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonStudyTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonStudyTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
