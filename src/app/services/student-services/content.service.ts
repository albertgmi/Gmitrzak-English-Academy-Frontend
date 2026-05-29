import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface FlashcardDto {
    id: number;
    front: string;
    back: string;
    category: string;
    easeFactor: number;
    interval: number;
    isLeech: boolean;
    nextReviewDate: string;
    isDeleted: boolean;
}

export interface FlashcardStudyLogDto {
    id: number;
    studyDate: string;
    easyCount: number;
    hardCount: number;
    incorrectCount: number;
    timeSpentSeconds: number;
}

export interface SentenceDto {
    id: number;
    content: string;
    translation: string;
    notes?: string;
    isReviewed: boolean;
    easeFactor: number;
    interval: number;
    isLeech: boolean;
    nextReviewDate: string;
}

export interface MemoryDto {
    id: number;
    content: string;
    notes?: string;
}

export interface PronunciationEntryDto {
    id: number;
    word: string;
    isChecked: boolean;
    sortOrder: number;
}

export interface AssignmentStudentDto {
    id: number;
    moduleId: number;
    moduleName: string;
    moduleDescription: string;
    category: string;
    dueDate: string;
    isCompleted: boolean;
    isOverdue: boolean;
    isFromMatrix: boolean;
    matrixName: string;
    hasDeadline: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContentService {
    private apiUrl = '/api/student-learning';
    http = inject(HttpClient);

    flashcards = resource<FlashcardDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<FlashcardDto[]>(`${this.apiUrl}/flashcards`))
    });

    sentences = resource<SentenceDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<SentenceDto[]>(`${this.apiUrl}/sentences`))
    });

    otherSentences = resource<SentenceDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<SentenceDto[]>(`${this.apiUrl}/sentences/other`))
    });

    memories = resource<MemoryDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<MemoryDto[]>(`${this.apiUrl}/memories`))
    });

    pronunciation = resource<PronunciationEntryDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<PronunciationEntryDto[]>(`${this.apiUrl}/pronunciation`))
    });

    assignments = resource<AssignmentStudentDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<AssignmentStudentDto[]>(`${this.apiUrl}/assignments`))
    });

    getLeeches() {
        return this.http.get<FlashcardDto[]>(`${this.apiUrl}/flashcards/leeches`);
    }

    getStudiedToday() {
        return this.http.get<FlashcardDto[]>(`${this.apiUrl}/flashcards/studied-today`);
    }

    getStudyLogs() {
        return this.http.get<FlashcardStudyLogDto[]>(`${this.apiUrl}/flashcards/logs`);
    }

    searchFlashcards(query: string) {
        return this.http.get<FlashcardDto[]>(`${this.apiUrl}/flashcards/search?q=${encodeURIComponent(query)}`);
    }

    checkPronunciation(id: number) {
        return this.http.patch(`${this.apiUrl}/pronunciation/${id}/check`, {});
    }

    uncheckPronunciation(id: number) {
        return this.http.patch(`${this.apiUrl}/pronunciation/${id}/uncheck`, {});
    }

    getAssignmentHistory() {
        return this.http.get<AssignmentStudentDto[]>(`${this.apiUrl}/assignments/history`);
    }

    reviewSentence(id: number, quality: 'easy' | 'hard' | 'incorrect') {
        return this.http.patch(
            `${this.apiUrl}/sentences/${id}/review`,
            { quality }
        );
    }
}