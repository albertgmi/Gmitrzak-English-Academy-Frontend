import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseAddingComponent } from './course-adding.component';

describe('CourseAddingComponent', () => {
  let component: CourseAddingComponent;
  let fixture: ComponentFixture<CourseAddingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseAddingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseAddingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
