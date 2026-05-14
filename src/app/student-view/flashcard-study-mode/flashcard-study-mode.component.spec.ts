import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashcardStudyModeComponent } from './flashcard-study-mode.component';

describe('FlashcardStudyModeComponent', () => {
  let component: FlashcardStudyModeComponent;
  let fixture: ComponentFixture<FlashcardStudyModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardStudyModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlashcardStudyModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
