import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="avatarUrl && !imgError(); else letterFallback">
      <img 
        [src]="fullAvatarUrl()" 
        [alt]="username" 
        [class]="customClass + ' rounded-full object-cover'"
        (error)="onImgError()" 
      />
    </ng-container>

    <ng-template #letterFallback>
      <div [class]="customClass + ' rounded-full flex items-center justify-center font-bold flex-shrink-0 ' + fallbackBgClass">
        {{ (username?.[0] || '?').toUpperCase() }}
      </div>
    </ng-template>
  `
})
export class AvatarComponent {
  @Input({ required: true }) username!: string;
  @Input() avatarUrl?: string | null = null;
  @Input() customClass = 'w-10 h-10'; 
  @Input() fallbackBgClass = 'bg-primary text-white';

  imgError = signal(false);

  private readonly baseUrl = environment.apiUrl;

  fullAvatarUrl = computed(() => {
    const url = this.avatarUrl;
    
    if (!url) return '';

    let cleanUrl = url.replace('https://gmitrzak-english-academy-production.up.railway.app', '');
    
    if (cleanUrl.startsWith('http')) {
       return cleanUrl;
    }
  
    return `${this.baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  });

  onImgError() {
    this.imgError.set(true);
  }
}