import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleAddingComponent } from './module-adding.component';

describe('ModuleAddingComponent', () => {
  let component: ModuleAddingComponent;
  let fixture: ComponentFixture<ModuleAddingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleAddingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuleAddingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
