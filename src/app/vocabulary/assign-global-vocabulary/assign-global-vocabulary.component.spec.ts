import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignGlobalVocabularyComponent } from './assign-global-vocabulary.component';

describe('AssignGlobalVocabularyComponent', () => {
  let component: AssignGlobalVocabularyComponent;
  let fixture: ComponentFixture<AssignGlobalVocabularyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignGlobalVocabularyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignGlobalVocabularyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
