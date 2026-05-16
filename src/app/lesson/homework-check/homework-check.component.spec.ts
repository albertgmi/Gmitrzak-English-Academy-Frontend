import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeworkCheckComponent } from './homework-check.component';

describe('HomeworkCheckComponent', () => {
  let component: HomeworkCheckComponent;
  let fixture: ComponentFixture<HomeworkCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeworkCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeworkCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
