import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentActivityComponent } from './student-activity.component';

describe('StudentActivityComponent', () => {
  let component: StudentActivityComponent;
  let fixture: ComponentFixture<StudentActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
