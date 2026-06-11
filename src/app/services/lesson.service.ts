import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentSimple {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string | null;
}

export interface SearchFlashcardResult {
    id?: number;
    front: string;
    back: string;
    category: string;
    existsInGlobal: boolean;
    alreadyAssignedToStudent: boolean;
}

export interface SearchSentenceResult {
    id?: number;
    polish: string;
    englishTranslation: string;
    category: string;
    existsInGlobal: boolean;
    alreadyAssignedToStudent: boolean;
}

export interface HomeworkItemDto {
    id: number;
    moduleName: string;
    moduleDescription: string;
    dueDate: string;
    isCompleted: boolean;
    isOverdue: boolean;
}

export interface GradeListDto {
    id: number;
    gradeDate: string;
    percentage: number;
    category: string;
    notes?: string;
}

export interface TeacherNoteDto {
    id: number;
    content: string;
    noteDate: string;
}

export interface ListeningReportDto {
    id: number;
    reportDate: string;
    title: string;
    mediaType: string;
    episodeCount: number;
}
export interface SentenceStockDto {
    id: number;
    polish: string;
    englishTranslation: string;
    category: string;
}

export interface MemoryItemDto {
    id: number;
    content: string;
    notes?: string;
}

export interface LessonPronunciationTestItemDto {
    id: number;
    word: string;
    status: string;
    sortOrder: number;
    markedCorrectAt?: string;
    daysUntilRefresh?: number;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
    private apiUrl = `${environment.apiUrl}/api/lesson`;
    private userApiUrl = `${environment.apiUrl}/api/user`;
    private sentenceApiUrl = `${environment.apiUrl}/api/sentence`;

    http = inject(HttpClient);

    getStudents() {
        return this.http.get<StudentSimple[]>(`${this.userApiUrl}/users`);
    }

    addSentence(studentUserId: number, content: string, translation: string, notes?: string) {
        return this.http.post(`${this.apiUrl}/sentence`, { studentUserId, content, translation, notes });
    }

    addMemory(studentId: number, optionA: string, optionB?: string,
              category?: string | null, notes?: string) {
        return this.http.post(`${this.apiUrl}/memory`, {
            studentUserId: studentId,
            optionA,
            optionB:   optionB   ?? null,
            category:  category  ?? null,
            notes:     notes     ?? null
        });
    }

    addPronunciation(studentUserId: number, word: string) {
        return this.http.post(`${this.apiUrl}/pronunciation`, { studentUserId, word });
    }

    getHomework(studentUserId: number) {
        return this.http.get<HomeworkItemDto[]>(`${this.apiUrl}/homework/${studentUserId}`);
    }

    checkHomework(id: number) {
        return this.http.patch(`${this.apiUrl}/homework/${id}/check`, {});
    }

    uncheckHomework(id: number) {
        return this.http.patch(`${this.apiUrl}/homework/${id}/uncheck`, {});
    }

    getPronunciationTest(studentUserId: number) {
        return this.http.get<LessonPronunciationTestItemDto[]>(
            `${this.apiUrl}/pronunciation-test/${studentUserId}`
        );
    }

    getCorrectPronunciationEntries(studentId: number) {
        return this.http.get<LessonPronunciationTestItemDto[]>(
            `${this.apiUrl}/pronunciation/correct/${studentId}`
        );
    }

    checkWord(id: number) {
        return this.http.patch(`${this.apiUrl}/pronunciation-test/${id}/check`, {});
    }

    uncheckWord(id: number) {
        return this.http.patch(`${this.apiUrl}/pronunciation-test/${id}/uncheck`, {});
    }

    getGrades(studentUserId: number) {
        return this.http.get<GradeListDto[]>(`${this.apiUrl}/grades/${studentUserId}`);
    }

    addGrade(studentUserId: number, percentage: number, category: string, notes?: string) {
        return this.http.post(`${this.apiUrl}/grades`, { studentUserId, percentage, category, notes });
    }

    removeGrade(gradeId: number) {
        return this.http.delete(`${this.apiUrl}/grades/${gradeId}`);
    }

    getNotes(studentUserId: number) {
        return this.http.get<TeacherNoteDto[]>(`${this.apiUrl}/notes/${studentUserId}`);
    }

    saveNote(studentUserId: number, content: string) {
        return this.http.post(`${this.apiUrl}/notes`, { studentUserId, content });
    }

    deleteNote(noteId: number) {
        return this.http.delete(`${this.apiUrl}/notes/${noteId}`);
    }

    getListeningReports(studentUserId: number) {
        return this.http.get<ListeningReportDto[]>(`${this.apiUrl}/listening/${studentUserId}`);
    }

    addListeningReport(studentUserId: number, title: string, mediaType: string, episodeCount: number) {
        return this.http.post(`${this.apiUrl}/listening`,
            { studentUserId, title, mediaType, episodeCount });
    }

    getAllStock(): Observable<SentenceStockDto[]> {
        return this.http.get<SentenceStockDto[]>(`${this.sentenceApiUrl}/stock`);
    }

    assignToUser(request: { userId: number; sentenceStockId: number; dueDate: string; sentenceSetId?: number | null }): Observable<void> {
        return this.http.post<void>(`${this.sentenceApiUrl}/assign`, request);
    }

    getMemories(studentUserId: number): Observable<MemoryItemDto[]> {
        return this.http.get<MemoryItemDto[]>(`${this.apiUrl}/memory/${studentUserId}`);
    }

    markPronunciationResult(entryId: number, result: 'correct' | 'incorrect') {
        return this.http.post(`${this.apiUrl}/pronunciation/mark`, {
            entryId, result
        });
    }

    searchSentence(query: string, studentId: number): Observable<SearchSentenceResult> {
        return this.http.get<SearchSentenceResult>(`${this.sentenceApiUrl}/search`, {
            params: { query, studentId: studentId.toString() }
        });
    }
}