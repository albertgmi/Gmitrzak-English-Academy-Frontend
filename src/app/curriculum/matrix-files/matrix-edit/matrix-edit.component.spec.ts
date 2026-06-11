import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixEditComponent } from './matrix-edit.component';

describe('MatrixEditComponent', () => {
  let component: MatrixEditComponent;
  let fixture: ComponentFixture<MatrixEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatrixEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
