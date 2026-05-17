import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonStreamComponent } from './lesson-stream.component';

describe('LessonStreamComponent', () => {
  let component: LessonStreamComponent;
  let fixture: ComponentFixture<LessonStreamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonStreamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
