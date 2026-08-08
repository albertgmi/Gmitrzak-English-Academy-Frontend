import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminMemoryDto {
  id: number;
  userId: number;
  content: string;
  optionA: string;
  optionB?: string;
  notes?: string;
  category?: string;
}

export interface UpdateMemoryRequest {
  content: string;
  optionA: string;
  optionB?: string;
  notes?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminMemoriesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/memories`;

  getStudentMemories(studentId: number): Observable<AdminMemoryDto[]> {
    return this.http.get<AdminMemoryDto[]>(`${this.apiUrl}/student/${studentId}`);
  }

  updateMemory(id: number, request: UpdateMemoryRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteMemory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
