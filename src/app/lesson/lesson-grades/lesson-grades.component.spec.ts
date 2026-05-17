import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonGradesComponent } from './lesson-grades.component';

describe('LessonGradesComponent', () => {
  let component: LessonGradesComponent;
  let fixture: ComponentFixture<LessonGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonGradesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonGradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
