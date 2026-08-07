import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphabetPoolComponent } from './alphabet-pool.component';

describe('AlphabetPoolComponent', () => {
  let component: AlphabetPoolComponent;
  let fixture: ComponentFixture<AlphabetPoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphabetPoolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlphabetPoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
