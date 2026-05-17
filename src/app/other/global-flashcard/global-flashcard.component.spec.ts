import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalFlashcardComponent } from './global-flashcard.component';

describe('GlobalFlashcardComponent', () => {
  let component: GlobalFlashcardComponent;
  let fixture: ComponentFixture<GlobalFlashcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalFlashcardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalFlashcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
