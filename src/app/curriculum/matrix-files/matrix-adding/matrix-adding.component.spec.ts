import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixAddingComponent } from './matrix-adding.component';

describe('MatrixAddingComponent', () => {
  let component: MatrixAddingComponent;
  let fixture: ComponentFixture<MatrixAddingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixAddingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatrixAddingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
