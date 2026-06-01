import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface HomeworkItemDto {
    id: number;
    moduleName: string;
    moduleDescription: string;
    dueDate: string;
    isCompleted: boolean;
    isOverdue: boolean;
}

export interface PronunciationTestItemDto {
    id: number;
    word: string;
    isChecked: boolean;
    sortOrder: number;
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

@Injectable({ providedIn: 'root' })
export class LessonService {
    private apiUrl = '/api/lesson';
    private userApiUrl = '/api/user';
    http = inject(HttpClient);

    getStudents() {
        return this.http.get<StudentSimple[]>(`${this.userApiUrl}/users`);
    }

    addSentence(studentUserId: number, content: string, translation: string, notes?: string) {
        return this.http.post(`${this.apiUrl}/sentence`, { studentUserId, content, translation, notes });
    }

    addMemory(studentUserId: number, content: string, notes?: string) {
        return this.http.post(`${this.apiUrl}/memory`, { studentUserId, content, notes });
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
        return this.http.get<PronunciationTestItemDto[]>(
            `${this.apiUrl}/pronunciation-test/${studentUserId}`
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
        return this.http.get<SentenceStockDto[]>('/api/sentence/stock');
    }

    // 2. Przypisanie zdania z bazy do konkretnego studenta (nowo dodany endpoint wyżej)
    assignToUser(request: { userId: number; sentenceStockId: number; dueDate: string; sentenceSetId?: number | null }): Observable<void> {
        return this.http.post<void>('/api/sentence/assign', request);
    }

    // 3. Pobieranie istniejących wspomnień z LessonController do blokady duplikatów
    getMemories(studentUserId: number): Observable<MemoryItemDto[]> {
        return this.http.get<MemoryItemDto[]>(`${this.apiUrl}/memory/${studentUserId}`);
    }
}