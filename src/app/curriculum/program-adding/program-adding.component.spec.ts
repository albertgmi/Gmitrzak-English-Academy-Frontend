import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramAddingComponent } from './program-adding.component';

describe('ProgramAddingComponent', () => {
  let component: ProgramAddingComponent;
  let fixture: ComponentFixture<ProgramAddingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramAddingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramAddingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
