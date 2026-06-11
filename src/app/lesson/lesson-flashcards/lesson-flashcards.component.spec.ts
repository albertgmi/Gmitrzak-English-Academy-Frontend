import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonFlashcardsComponent } from './lesson-flashcards.component';

describe('LessonFlashcardsComponent', () => {
  let component: LessonFlashcardsComponent;
  let fixture: ComponentFixture<LessonFlashcardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonFlashcardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonFlashcardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
