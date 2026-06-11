import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonAgendaComponent } from './lesson-agenda.component';

describe('LessonAgendaComponent', () => {
  let component: LessonAgendaComponent;
  let fixture: ComponentFixture<LessonAgendaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonAgendaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonAgendaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
