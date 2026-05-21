import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonSentenceAnswersComponent } from './lesson-sentence-answers.component';

describe('LessonSentenceAnswersComponent', () => {
  let component: LessonSentenceAnswersComponent;
  let fixture: ComponentFixture<LessonSentenceAnswersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonSentenceAnswersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonSentenceAnswersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
