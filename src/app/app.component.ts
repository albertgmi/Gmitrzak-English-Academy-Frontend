import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BrandService } from './core/services/brand.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly brandService = inject(BrandService);
  private readonly titleService = inject(Title);

  ngOnInit(): void {
    this.titleService.setTitle(this.brandService.brand().fullName);
  }
}

