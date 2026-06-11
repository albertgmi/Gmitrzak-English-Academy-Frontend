import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentenceStockComponent } from './sentence-stock.component';

describe('SentenceStockComponent', () => {
  let component: SentenceStockComponent;
  let fixture: ComponentFixture<SentenceStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentenceStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SentenceStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
