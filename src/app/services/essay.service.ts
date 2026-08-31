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
    avatarUrl?: string;
}

export interface EssayCommentDto {
    id: number;
    noteId: string;
    userEssayId: number;
    authorId: number;
    author: string;
    avatarUrl?: string;
    selectedText: string;
    noteContent: string;
    category: string;
    isArchived: boolean;
    timestamp: string;
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

    getMyEssays() {
        return this.http.get<UserEssayDto[]>(`${this.apiUrl}/my-essays`);
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

    exportAllReviewedDocx() {
        return this.http.get(`${this.apiUrl}/admin/export-all-reviewed`,
            { responseType: 'blob' });
    }

    getComments(essayId: number) {
        return this.http.get<EssayCommentDto[]>(`${this.apiUrl}/${essayId}/comments`);
    }

    addComment(essayId: number, req: { selectedText: string; noteContent: string; category: string }) {
        return this.http.post<EssayCommentDto>(`${this.apiUrl}/${essayId}/comments`, req);
    }

    archiveComment(commentId: number) {
        return this.http.put(`${this.apiUrl}/comments/${commentId}/archive`, {});
    }
}