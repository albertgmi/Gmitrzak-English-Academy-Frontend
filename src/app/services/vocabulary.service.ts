import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface VocabularyDto {
    id?: number;
    front: string;
    back: string;
    category: string;
}

export interface StudentSimple {
    id: number;
    username: string;
}

export interface VocabularyAddingRequest {
    front: string;
    back: string;
    category: string;
}

export interface StudentLookup {
    id: number;
    username: string;
}

export interface AssignVocabularyRequest {
    studentUserId: number;
    vocabularyIds: number[];
}

@Injectable({ providedIn: 'root' })
export class VocabularyService {
    private apiUrl = '/api/vocabulary';
    private userApiUrl = '/api/user';
    http = inject(HttpClient);

    getAllVocabulary() {
        return this.http.get<VocabularyDto[]>(`${this.apiUrl}`);
    }

    createVocabulary(request: VocabularyAddingRequest) {
        return this.http.post<VocabularyDto>(`${this.apiUrl}`, request);
    }

    updateVocabulary(request: VocabularyAddingRequest, id: number) {
        return this.http.put<VocabularyDto>(`${this.apiUrl}/update/${id}`, request);
    }
    
    getStudents() {
        return this.http.get<StudentSimple[]>(`${this.userApiUrl}/users`);
    }
    
    getVocabularyList() {
        return this.http.get<VocabularyDto[]>(`${this.apiUrl}`);
    }

    assignVocabularyToStudent(request: AssignVocabularyRequest) {
        return this.http.post<void>(`${this.apiUrl}/assign-multiple`, request);
    }
}