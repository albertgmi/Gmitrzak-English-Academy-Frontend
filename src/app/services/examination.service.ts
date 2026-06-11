import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ExaminationFlashcardDto {
    id: number;
    front: string;
    back: string;
    category: string;
    easeFactor: number;
    interval: number;
}

export interface ExaminationSentenceDto {
    id: number;
    content: string;
    translation: string;
    notes?: string;
}

export interface ExaminationMemoryDto {
    id: number;
    optionA: string;
    optionB?: string;
    content: string;
    notes?: string;
    category?: string;
}

export interface ExaminationDto {
    flashcards: ExaminationFlashcardDto[];
    sentences:  ExaminationSentenceDto[];
    memories:   ExaminationMemoryDto[];
}

@Injectable({ providedIn: 'root' })
export class ExaminationService {
    private http = inject(HttpClient);

    getExamination(studentId: number) {
        return this.http.get<ExaminationDto>(`/api/examination/${studentId}`);
    }
}