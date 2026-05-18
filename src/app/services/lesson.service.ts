import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface StudentSimple {
    id: number;
    username: string;
    email: string;
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

@Injectable({ providedIn: 'root' })
export class LessonService {
    private apiUrl = '/api/lesson';
    private userApiUrl = '/api/user';
    http = inject(HttpClient);

    getStudents() {
        return this.http.get<StudentSimple[]>(`${this.userApiUrl}/users`);
    }

    searchFlashcard(q: string, studentUserId: number) {
        return this.http.get<SearchFlashcardResult>(
            `${this.apiUrl}/flashcard/search?q=${encodeURIComponent(q)}&studentUserId=${studentUserId}`
        );
    }

    addTranslation(front: string, back: string, category: string) {
        return this.http.post<{ id: number; front: string; back: string; category: string }>(
            `${this.apiUrl}/flashcard/translation`, { front, back, category }
        );
    }

    assignFlashcard(globalFlashcardId: number, studentUserId: number) {
        return this.http.post(`${this.apiUrl}/flashcard/assign`,
            { globalFlashcardId, studentUserId });
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
}