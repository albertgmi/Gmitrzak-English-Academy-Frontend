import { inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

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
    teacherExplanation?: string;
    teacherReviewed: boolean;
    finalResult?: string;
}

export interface ModuleSentenceItemDto {
    sentenceStockId: number;
    polish: string;
    order: number;
    previousAnswer?: string;
    previousResult?: string;
    previousExplanation?: string;
    previousAnswerId?: number;
}

export interface ModuleSentenceSessionDto {
    moduleId: number;
    moduleName: string;
    sentences: ModuleSentenceItemDto[];
}

export interface CompletedSentenceModuleDto {
    moduleId: number;
    moduleName: string;
    completedDate: string;
    isFromMatrix: boolean;
    matrixName?: string;
    totalSentences: number;
    answeredCount: number;
}

@Injectable({ providedIn: 'root' })
export class SentenceService {
    // 1. Trzy zmienne bazowe połączone z environment
    private apiUrl = `${environment.apiUrl}/api/sentence`;
    private answersApiUrl = `${environment.apiUrl}/api/answers`;
    private studentLearningApiUrl = `${environment.apiUrl}/api/student-learning`;

    http = inject(HttpClient);

    private loadStockTrigger = signal(false);
    private loadSetsTrigger  = signal(false);

    stock = resource<SentenceStockDto[], boolean>({
        request: () => this.loadStockTrigger(),
        loader: ({ request }) => {
            if (!request) return Promise.resolve([]);
            return lastValueFrom(this.http.get<SentenceStockDto[]>(`${this.apiUrl}/stock`));
        }
    });

    sets = resource<SentenceSetGroupDto[], boolean>({
        request: () => this.loadSetsTrigger(),
        loader: ({ request }) => {
            if (!request) return Promise.resolve([]);
            return lastValueFrom(this.http.get<SentenceSetGroupDto[]>(`${this.apiUrl}/sets`));
        }
    });

    reloadStock() {
        if (!this.loadStockTrigger()) {
            this.loadStockTrigger.set(true);
        } else {
            this.stock.reload();
        }
    }

    reloadSets() {
        if (!this.loadSetsTrigger()) {
            this.loadSetsTrigger.set(true);
        } else {
            this.sets.reload();
        }
    }

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

    assignSetToModule(moduleId: number, sentenceSetId: number) {
        return this.http.post(`${this.apiUrl}/assign-to-module`, { moduleId, sentenceSetId });
    }

    getSetsForModule(moduleId: number) {
        return this.http.get<SentenceSetDto[]>(`${this.apiUrl}/module/${moduleId}/sets`);
    }

    removeSetFromModule(moduleId: number, setId: number) {
        return this.http.delete(`${this.apiUrl}/module/${moduleId}/set/${setId}`);
    }

    getModuleSentences(moduleId: number) {
        return this.http.get<ModuleSentenceSessionDto>(
            `${this.studentLearningApiUrl}/module/${moduleId}/sentences`
        );
    }

    submitAnswer(moduleId: number, sentenceStockId: number, userAnswer: string) {
        return this.http.post<AnswerResultDto>(this.answersApiUrl,
            { moduleId, sentenceStockId, userAnswer });
    }

    getAnswersForModule(moduleId: number) {
        return this.http.get<AnswerResultDto[]>(`${this.answersApiUrl}/module/${moduleId}`);
    }

    getAnswersForStudent(moduleId: number, studentId: number) {
        return this.http.get<AnswerResultDto[]>(
            `${this.answersApiUrl}/module/${moduleId}/student/${studentId}`
        );
    }

    overrideAnswer(answerId: number, override: string | null, teacherExplanation?: string) {
        return this.http.patch(`${this.answersApiUrl}/${answerId}/override`,
            { override, teacherExplanation });
    }

    updateStock(id: number, polish: string) {
        return this.http.put(`${this.apiUrl}/stock/${id}`, {polish});
    }

    updateEnglishStock(id: number, newEnglish: string) {
        return this.http.put(`${this.apiUrl}/stock-english/${id}`, { newEnglish });
    }

    getCompletedModules(studentId: number, dateFrom: string, dateTo: string) {
        return this.http.get<CompletedSentenceModuleDto[]>(
            `${this.answersApiUrl}/modules/completed?studentId=${studentId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        );
    }

    downloadRangeReportPdf(studentId: number, dateFrom: string, dateTo: string) {
        return this.http.get(
            `${this.answersApiUrl}/report/range?studentId=${studentId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
            { responseType: 'blob' }
        );
    }

    downloadRangeReportDocx(studentId: number, dateFrom: string, dateTo: string) {
        return this.http.get(
            `${this.answersApiUrl}/report/range/docx?studentId=${studentId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
            { responseType: 'blob' }
        );
    }

    downloadAllActiveReportsZip(dateFrom: string, dateTo: string) {
        return this.http.get(`${this.answersApiUrl}/report/all`, {
            params: { dateFrom, dateTo },
            responseType: 'blob'
        });
    }

    assignSentenceSetToStudent(userId: number, sentenceSetId: number, dueDate: string) {
        return this.http.post<void>(`${this.apiUrl}/assign-set`, {
            userId,
            sentenceSetId,
            dueDate
        });
    }

    getLiveRoomModules(studentId?: number) {
        const url = studentId 
            ? `${this.answersApiUrl}/live-room/modules?studentId=${studentId}`
            : `${this.answersApiUrl}/live-room/modules`;
        return this.http.get<SentenceModuleLiveDto[]>(url);
    }

    getLiveRoomModuleAnswers(moduleId: number, studentId?: number) {
        const url = studentId
            ? `${this.answersApiUrl}/live-room/module/${moduleId}?studentId=${studentId}`
            : `${this.answersApiUrl}/live-room/module/${moduleId}`;
        return this.http.get<SentenceAnswerLiveDto[]>(url);
    }

    getLiveRoomSentenceDetail(answerId: number) {
        return this.http.get<SentenceAnswerLiveDto>(`${this.answersApiUrl}/live-room/sentence/${answerId}`);
    }

    saveSentenceReview(answerId: number, request: SaveSentenceReviewRequest) {
        return this.http.put<SentenceAnswerLiveDto>(`${this.answersApiUrl}/live-room/sentence/${answerId}/review`, request);
    }

    getSentenceComments(answerId: number) {
        return this.http.get<SentenceAnswerCommentDto[]>(`${this.answersApiUrl}/live-room/sentence/${answerId}/comments`);
    }

    addSentenceComment(answerId: number, request: CreateSentenceAnswerCommentRequest) {
        return this.http.post<SentenceAnswerCommentDto>(`${this.answersApiUrl}/live-room/sentence/${answerId}/comments`, request);
    }

    archiveSentenceComment(commentId: number) {
        return this.http.put(`${this.answersApiUrl}/live-room/comments/${commentId}/archive`, {});
    }
}

export interface SentenceModuleLiveDto {
    moduleId: number;
    moduleName: string;
    studentId: number;
    studentUsername: string;
    studentAvatarUrl?: string;
    totalSentences: number;
    answeredSentences: number;
    correctCount: number;
    partialCount: number;
    incorrectCount: number;
    isReviewed: boolean;
    unresolvedStudentCommentsCount?: number;
    lastAnswerDate?: string;
}

export interface SentenceAnswerLiveDto {
    id: number;
    moduleId: number;
    moduleName: string;
    sentenceStockId: number;
    polish: string;
    expectedTranslation: string;
    userAnswer: string;
    adminCorrection?: string;
    aiResult: string;
    aiExplanation: string;
    teacherOverride?: string;
    teacherExplanation?: string;
    teacherReviewed: boolean;
    studentUsername: string;
    studentAvatarUrl?: string;
}

export interface SaveSentenceReviewRequest {
    adminCorrection?: string;
    teacherOverride?: string;
    teacherExplanation?: string;
}

export interface SentenceAnswerCommentDto {
    id: number;
    noteId: string;
    userSentenceAnswerId: number;
    selectedText: string;
    noteContent: string;
    category: string;
    author: string;
    timestamp: string;
    isArchived: boolean;
}

export interface CreateSentenceAnswerCommentRequest {
    selectedText: string;
    noteContent: string;
    category: string;
}