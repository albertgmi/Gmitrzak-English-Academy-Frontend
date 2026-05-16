import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PronunciationTestComponent } from './pronunciation-test.component';

describe('PronunciationTestComponent', () => {
  let component: PronunciationTestComponent;
  let fixture: ComponentFixture<PronunciationTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PronunciationTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PronunciationTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
