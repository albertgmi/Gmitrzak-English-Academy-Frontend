import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';

export interface ProfileDto {
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  englishLevel?: string;
  currentSemester?: number;
  semester1: boolean;
  semester2: boolean;
  semester3: boolean;
  semester4: boolean;
  semester5: boolean;
  semester6: boolean;
  semester7: boolean;
  semester8: boolean;
  semester9: boolean;
  semester10: boolean;
  semester11: boolean;
  semester12: boolean;
  semester13: boolean;
  semester14: boolean;
  semester15: boolean;
  semester16: boolean;
  semester17: boolean;
  semester18: boolean;
  semester19: boolean;
  semester20: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = '/api/profile';
  http = inject(HttpClient);

  getProfile(userId: number): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.apiUrl}/${userId}`);
  }

  updateProfile(userId: number, request: Partial<ProfileDto>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}`, request);
  }

  uploadAvatar(userId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${userId}/avatar`, formData, {
      responseType: 'text'
    });
  }
}