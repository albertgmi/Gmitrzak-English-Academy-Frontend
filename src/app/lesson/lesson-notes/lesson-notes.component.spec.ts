import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonNotesComponent } from './lesson-notes.component';

describe('LessonNotesComponent', () => {
  let component: LessonNotesComponent;
  let fixture: ComponentFixture<LessonNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
