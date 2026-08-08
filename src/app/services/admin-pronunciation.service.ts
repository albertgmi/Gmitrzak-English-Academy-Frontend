import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminPronunciationDto {
  id: number;
  userId: number;
  word: string;
  status: string;
  sortOrder: number;
  isInCurrentSession: boolean;
  markedCorrectAt?: string;
}

export interface UpdatePronunciationRequest {
  word: string;
  status: string;
  sortOrder: number;
  isInCurrentSession: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPronunciationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/admin/pronunciation`;

  getStudentPronunciation(studentId: number): Observable<AdminPronunciationDto[]> {
    return this.http.get<AdminPronunciationDto[]>(`${this.apiUrl}/student/${studentId}`);
  }

  updatePronunciation(id: number, request: UpdatePronunciationRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deletePronunciation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
