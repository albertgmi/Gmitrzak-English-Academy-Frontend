import { Component, inject } from '@angular/core';
import { BrandService } from '../../core/services/brand.service';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <a target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">{{ brandService.brand().fullName }}</a>
    </div>`
})
export class AppFooter {
    public brandService = inject(BrandService);
}

