import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EssayModuleComponent } from './essay-module.component';

describe('EssayModuleComponent', () => {
  let component: EssayModuleComponent;
  let fixture: ComponentFixture<EssayModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EssayModuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EssayModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
