import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalVocabularyComponent } from './global-vocabulary.component';

describe('GlobalVocabularyComponent', () => {
  let component: GlobalVocabularyComponent;
  let fixture: ComponentFixture<GlobalVocabularyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalVocabularyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalVocabularyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
