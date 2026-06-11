import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulePlayerComponent } from './module-player.component';

describe('ModulePlayerComponent', () => {
  let component: ModulePlayerComponent;
  let fixture: ComponentFixture<ModulePlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModulePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
