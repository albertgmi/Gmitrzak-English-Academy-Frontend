import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentActivityDto {
    id: number;
    username: string;
    avatarUrl: string | null;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
    isOnline: boolean;
}

@Injectable({ providedIn: 'root' })
export class StudentActivityService {
    private http = inject(HttpClient);
    private baseUrl = '/api/user';

    getStudentsActivity(): Observable<StudentActivityDto[]> {
        return this.http.get<StudentActivityDto[]>(`${this.baseUrl}/students-activity`);
    }
}