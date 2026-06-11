import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentenceTaskComponent } from './sentence-task.component';

describe('SentenceTaskComponent', () => {
  let component: SentenceTaskComponent;
  let fixture: ComponentFixture<SentenceTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentenceTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SentenceTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
