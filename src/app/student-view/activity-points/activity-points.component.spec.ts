import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityPointsComponent } from './activity-points.component';

describe('ActivityPointsComponent', () => {
  let component: ActivityPointsComponent;
  let fixture: ComponentFixture<ActivityPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityPointsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
