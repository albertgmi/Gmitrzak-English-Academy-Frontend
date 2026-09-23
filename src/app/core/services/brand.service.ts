import { Injectable, signal } from '@angular/core';

export interface BrandConfig {
  shortName: string;      // "Gmitrzak" vs "Bańkowska"
  fullName: string;       // "Gmitrzak English Academy" vs "Bańkowska English Academy"
  shortTitle: string;     // "Gmitrzak English" vs "Bańkowska English"
  domain: string;         // "gmitrzak-english-academy.pl" vs "bankowska-english-academy.pl"
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  readonly brand = signal<BrandConfig>(this.detectBrand());

  private detectBrand(): BrandConfig {
    if (typeof window === 'undefined') {
      return this.getGmitrzakBrand();
    }

    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('bankowska')) {
      return {
        shortName: 'Bańkowska',
        fullName: 'Bańkowska English Academy',
        shortTitle: 'Bańkowska English',
        domain: 'bankowska-english-academy.pl'
      };
    }

    return this.getGmitrzakBrand();
  }

  private getGmitrzakBrand(): BrandConfig {
    return {
      shortName: 'Gmitrzak',
      fullName: 'Gmitrzak English Academy',
      shortTitle: 'Gmitrzak English',
      domain: 'gmitrzak-english-academy.pl'
    };
  }
}
