import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonModeComponent } from './lesson-mode.component';

describe('LessonModeComponent', () => {
  let component: LessonModeComponent;
  let fixture: ComponentFixture<LessonModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
