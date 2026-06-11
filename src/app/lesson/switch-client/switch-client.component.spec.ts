import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchClientComponent } from './switch-client.component';

describe('SwitchClientComponent', () => {
  let component: SwitchClientComponent;
  let fixture: ComponentFixture<SwitchClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwitchClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
