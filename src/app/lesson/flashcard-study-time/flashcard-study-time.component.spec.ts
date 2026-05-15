import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashcardStudyTimeComponent } from './flashcard-study-time.component';

describe('FlashcardStudyTimeComponent', () => {
  let component: FlashcardStudyTimeComponent;
  let fixture: ComponentFixture<FlashcardStudyTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardStudyTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlashcardStudyTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
