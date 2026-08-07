import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphabetLessonTestComponent } from './alphabet-lesson-test.component';

describe('AlphabetLessonTestComponent', () => {
  let component: AlphabetLessonTestComponent;
  let fixture: ComponentFixture<AlphabetLessonTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphabetLessonTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlphabetLessonTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
