import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TheaterComponent } from './theater.component';

describe('TheaterComponent', () => {
  let component: TheaterComponent;
  let fixture: ComponentFixture<TheaterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TheaterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TheaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
