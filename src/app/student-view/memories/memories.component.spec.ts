import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoriesComponent } from './memories.component';

describe('MemoriesComponent', () => {
  let component: MemoriesComponent;
  let fixture: ComponentFixture<MemoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
