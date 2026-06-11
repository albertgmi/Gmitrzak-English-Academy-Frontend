import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreditsComponent } from './admin-credits.component';

describe('AdminCreditsComponent', () => {
  let component: AdminCreditsComponent;
  let fixture: ComponentFixture<AdminCreditsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreditsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
