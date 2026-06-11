import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AttendanceDto {
    id: number;
    userId: number;
    type: 'SCHEDULED' | 'MAKEUP';
    duration: number;
    createdAt: string;
}

export interface CreateAttendanceRequest {
    userId: number;
    type: 'SCHEDULED' | 'MAKEUP';
    duration: number;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    private apiUrl = '/api/lesson-panel/attendance';
    private http = inject(HttpClient);

    getAttendance(userId: number) {
        return this.http.get<AttendanceDto[]>(`${this.apiUrl}/${userId}`);
    }

    addAttendance(request: CreateAttendanceRequest) {
        return this.http.post<AttendanceDto>(this.apiUrl, request);
    }

    deleteAttendance(id: number) {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getAttendanceHistory(userId: number) {
        return this.http.get<AttendanceDto[]>(`${this.apiUrl}/${userId}/history`);
    }
}