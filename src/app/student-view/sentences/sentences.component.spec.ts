import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentencesComponent } from './sentences.component';

describe('SentencesComponent', () => {
  let component: SentencesComponent;
  let fixture: ComponentFixture<SentencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SentencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
