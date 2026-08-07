import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphabetTestComponent } from './alphabet-test.component';

describe('AlphabetTestComponent', () => {
  let component: AlphabetTestComponent;
  let fixture: ComponentFixture<AlphabetTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphabetTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlphabetTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
