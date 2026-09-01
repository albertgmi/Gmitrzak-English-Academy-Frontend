import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LiveNoteSummaryDto {
    id: number;
    studentId: number;
    studentUsername: string;
    studentAvatarUrl?: string;
    title: string;
    previewText: string;
    createdById: number;
    createdByUsername: string;
    createdAt?: string;
    lastModifiedAt?: string;
}

export interface LiveNoteDetailDto {
    id: number;
    studentId: number;
    studentUsername: string;
    studentAvatarUrl?: string;
    title: string;
    content: string;
    createdById: number;
    createdByUsername: string;
    createdAt?: string;
    lastModifiedAt?: string;
}

export interface CreateLiveNoteRequest {
    title: string;
    studentId?: number;
}

export interface SaveLiveNoteRequest {
    title?: string;
    content: string;
}

@Injectable({
    providedIn: 'root'
})
export class LiveNotepadService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/live-notepad`;

    getNotes(studentId?: number): Observable<LiveNoteSummaryDto[]> {
        let url = `${this.apiUrl}/notes`;
        if (studentId) {
            url += `?studentId=${studentId}`;
        }
        return this.http.get<LiveNoteSummaryDto[]>(url);
    }

    getNoteById(noteId: number): Observable<LiveNoteDetailDto> {
        return this.http.get<LiveNoteDetailDto>(`${this.apiUrl}/notes/${noteId}`);
    }

    createNote(request: CreateLiveNoteRequest): Observable<LiveNoteDetailDto> {
        return this.http.post<LiveNoteDetailDto>(`${this.apiUrl}/notes`, request);
    }

    saveNote(noteId: number, request: SaveLiveNoteRequest): Observable<LiveNoteDetailDto> {
        return this.http.put<LiveNoteDetailDto>(`${this.apiUrl}/notes/${noteId}`, request);
    }

    deleteNote(noteId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/notes/${noteId}`);
    }
}
