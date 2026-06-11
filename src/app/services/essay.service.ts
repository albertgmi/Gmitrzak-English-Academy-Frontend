import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

    getModule(moduleId: number) {
        return this.http.get<EssayModuleDto>(`/api/essay/module/${moduleId}`);
    }

    submit(moduleId: number, content: string) {
        return this.http.post<UserEssayDto>('/api/essay/submit', { moduleId, content });
    }

    getAllForAdmin() {
        return this.http.get<UserEssayDto[]>('/api/essay/admin/all');
    }

    getForStudent(studentId: number) {
        return this.http.get<UserEssayDto[]>(`/api/essay/admin/student/${studentId}`);
    }

    review(essayId: number, adminContent: string) {
        return this.http.put<UserEssayDto>(
            `/api/essay/admin/review/${essayId}`, { adminContent });
    }

    exportDocx(essayId: number) {
        return this.http.get(`/api/essay/admin/export/${essayId}`,
            { responseType: 'blob' });
    }
}