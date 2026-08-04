import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface VocabularyDto {
    id: number;
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

export interface VocabularyUpdateRequest {
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

export interface SearchVocabularyResult {
    id?: number;
    front: string;
    back: string;
    category: string;
    existsInGlobal: boolean;
    alreadyAssignedToStudent: boolean;
}

@Injectable({ providedIn: 'root' })
export class VocabularyService {
    private apiUrl = `${environment.apiUrl}/api/vocabulary`;
    private userApiUrl = `${environment.apiUrl}/api/user`;
    http = inject(HttpClient);

    getAllVocabulary() {
        return this.http.get<VocabularyDto[]>(`${this.apiUrl}`);
    }

    getVocabularyList() {
        return this.http.get<VocabularyDto[]>(`${this.apiUrl}`);
    }

    createVocabulary(request: VocabularyAddingRequest) {
        return this.http.post<VocabularyDto>(`${this.apiUrl}`, request);
    }

    updateVocabulary(request: VocabularyUpdateRequest, id: number) {
        return this.http.put<void>(`${this.apiUrl}/update/${id}`, request);
    }
    
    getStudents() {
        return this.http.get<StudentSimple[]>(`${this.userApiUrl}/users`);
    }

    assignVocabularyToStudent(request: AssignVocabularyRequest) {
        return this.http.post<void>(`${this.apiUrl}/assign-multiple`, request);
    }

    searchVocabulary(query: string, studentUserId: number) {
        return this.http.get<SearchVocabularyResult[]>(
            `${this.apiUrl}/search?query=${encodeURIComponent(query)}&studentUserId=${studentUserId}`
        );
    }

    addTranslation(front: string, back: string, category: string) {
        return this.http.post<VocabularyDto>(
            `${this.apiUrl}/translation`, { front, back, category }
        );
    }

    assignSingleVocabularyToStudent(vocabularyId: number, studentUserId: number) {
        return this.http.post<void>(`${this.apiUrl}/assign`, { 
            vocabularyId, 
            studentUserId 
        });
    }

    assignCatalogueToStudent(catalogueId: number, studentUserId: number) {
        return this.http.post<void>(`${this.apiUrl}/assign-catalogue`, {
            catalogueId,
            studentUserId
        });
    }
}