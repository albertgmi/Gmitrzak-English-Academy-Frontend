import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface EssayModuleDto {
    moduleId: number;
    moduleName: string;
    essayPrompt: string;
    existingEssay?: UserEssayDto;
}

export interface UserEssayDto {
    id: number;
    moduleId: number;
    moduleName: string;
    essayPrompt: string;
    content: string;
    adminContent?: string;
    isSubmitted: boolean;
    isReviewed: boolean;
    submittedDate?: string;
    reviewedDate?: string;
    username: string;
}

@Injectable({ providedIn: 'root' })
export class EssayService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/essay`;
    getModule(moduleId: number) {
        return this.http.get<EssayModuleDto>(`${this.apiUrl}/module/${moduleId}`);
    }

    submit(moduleId: number, content: string) {
        return this.http.post<UserEssayDto>(`${this.apiUrl}/submit`, { moduleId, content });
    }

    getAllForAdmin() {
        return this.http.get<UserEssayDto[]>(`${this.apiUrl}/admin/all`);
    }

    getForStudent(studentId: number) {
        return this.http.get<UserEssayDto[]>(`${this.apiUrl}/admin/student/${studentId}`);
    }

    review(essayId: number, adminContent: string) {
        return this.http.put<UserEssayDto>(
            `${this.apiUrl}/admin/review/${essayId}`, { adminContent });
    }

    exportDocx(essayId: number) {
        return this.http.get(`${this.apiUrl}/admin/export/${essayId}`,
            { responseType: 'blob' });
    }
}