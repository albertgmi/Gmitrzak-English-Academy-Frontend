import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetsComposerComponent } from './sets-composer.component';

describe('SetsComposerComponent', () => {
  let component: SetsComposerComponent;
  let fixture: ComponentFixture<SetsComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetsComposerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetsComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
