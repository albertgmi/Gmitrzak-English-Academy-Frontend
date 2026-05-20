import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentencesCardsComponent } from './sentences-cards.component';

describe('SentencesCardsComponent', () => {
  let component: SentencesCardsComponent;
  let fixture: ComponentFixture<SentencesCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentencesCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SentencesCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
