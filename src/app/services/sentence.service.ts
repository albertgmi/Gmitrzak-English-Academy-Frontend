import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface SentenceStockDto {
    id: number;
    polish: string;
    englishTranslation: string;
    category: string;
}

export interface SentenceSetItemDto {
    id: number;
    sentenceStockId: number;
    polish: string;
    englishTranslation: string;
    order: number;
}

export interface SentenceSetDto {
    id: number;
    name: string;
    groupName: string;
    order: number;
    itemCount: number;
    items: SentenceSetItemDto[];
}

export interface SentenceSetGroupDto {
    groupName: string;
    sets: SentenceSetDto[];
}

export interface AnswerResultDto {
    id: number;
    polish: string;
    expectedTranslation: string;
    userAnswer: string;
    aiResult: string;
    aiExplanation: string;
    teacherOverride?: string;
    teacherReviewed: boolean;
}

@Injectable({ providedIn: 'root' })
export class SentenceService {
    private apiUrl = '/api/sentence';
    http = inject(HttpClient);

    stock = resource<SentenceStockDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<SentenceStockDto[]>(`${this.apiUrl}/stock`))
    });

    sets = resource<SentenceSetGroupDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<SentenceSetGroupDto[]>(`${this.apiUrl}/sets`))
    });

    reloadStock() { this.stock.reload(); }
    reloadSets()  { this.sets.reload(); }

    createStock(polish: string, englishTranslation: string, category: string) {
        return this.http.post(`${this.apiUrl}/stock`, { polish, englishTranslation, category });
    }

    deleteStock(id: number) {
        return this.http.delete(`${this.apiUrl}/stock/${id}`);
    }

    uploadStock(file: File) {
        const fd = new FormData();
        fd.append('file', file);
        return this.http.post<{ added: number }>(`${this.apiUrl}/stock/upload`, fd);
    }

    createSet(request: { name: string; groupName: string; order: number; sentenceStockIds: number[] }) {
        return this.http.post<SentenceSetDto>(`${this.apiUrl}/sets`, request);
    }

    deleteSet(id: number) {
        return this.http.delete(`${this.apiUrl}/sets/${id}`);
    }

    assign(userId: number, dueDate: string, sentenceSetId?: number, sentenceStockId?: number) {
        return this.http.post(`${this.apiUrl}/assign`,
            { userId, sentenceSetId, sentenceStockId, dueDate });
    }

    getAnswers(assignmentId: number) {
        return this.http.get<AnswerResultDto[]>(`${this.apiUrl}/answers/${assignmentId}`);
    }

    overrideAnswer(answerId: number, override: string) {
        return this.http.patch(`${this.apiUrl}/answers/${answerId}/override`,
            { override });
    }
}