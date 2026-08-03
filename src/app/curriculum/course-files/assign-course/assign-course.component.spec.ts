import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignCourseComponent } from './assign-course.component';

describe('AssignCourseComponent', () => {
  let component: AssignCourseComponent;
  let fixture: ComponentFixture<AssignCourseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignCourseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
