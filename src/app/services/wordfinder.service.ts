import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum WordfinderCatalogueStatus {
  Draft = 0,
  PendingApproval = 1,
  Approved = 2,
  Rejected = 3
}

export interface WordfinderCatalogueEntryDto {
  id?: number;
  front: string;
  back: string;
}

export interface WordfinderCatalogueDto {
  id: number;
  studentUserId: number;
  studentUsername: string;
  studentInitials: string;
  studentAvatarUrl?: string;
  name: string;
  status: WordfinderCatalogueStatus;
  statusName: string;
  rejectionReason?: string;
  approvedCatalogueId?: number;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  entries: WordfinderCatalogueEntryDto[];
}

export interface WordfinderCatalogueListDto {
  id: number;
  studentUserId: number;
  studentUsername: string;
  studentInitials: string;
  studentAvatarUrl?: string;
  name: string;
  status: WordfinderCatalogueStatus;
  statusName: string;
  entryCount: number;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface TranslateWordfinderEntryRequest {
  frontText: string;
  targetLanguage?: string;
}

export interface TranslateWordfinderEntryResponse {
  translatedText: string;
}

export interface SpellCheckRequest {
  text: string;
  language?: string;
}

export interface SpellCheckResult {
  hasError: boolean;
  corrected?: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class WordfinderService {
  private apiUrl = `${environment.apiUrl}/api/wordfinder`;
  private http = inject(HttpClient);

  // Student endpoints
  getMyCatalogues(): Observable<WordfinderCatalogueListDto[]> {
    return this.http.get<WordfinderCatalogueListDto[]>(`${this.apiUrl}/my`);
  }

  getById(id: number): Observable<WordfinderCatalogueDto> {
    return this.http.get<WordfinderCatalogueDto>(`${this.apiUrl}/${id}`);
  }

  createDraft(dto: { name: string }): Observable<WordfinderCatalogueDto> {
    return this.http.post<WordfinderCatalogueDto>(this.apiUrl, dto);
  }

  updateDraft(id: number, dto: { name: string; entries: WordfinderCatalogueEntryDto[] }): Observable<WordfinderCatalogueDto> {
    return this.http.put<WordfinderCatalogueDto>(`${this.apiUrl}/${id}`, dto);
  }

  deleteDraft(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  submit(id: number): Observable<WordfinderCatalogueDto> {
    return this.http.post<WordfinderCatalogueDto>(`${this.apiUrl}/${id}/submit`, {});
  }

  translateEntry(frontText: string, targetLanguage = 'Polish'): Observable<TranslateWordfinderEntryResponse> {
    return this.http.post<TranslateWordfinderEntryResponse>(`${this.apiUrl}/translate`, { frontText, targetLanguage });
  }

  spellCheckEntry(text: string, language = 'English'): Observable<SpellCheckResult> {
    return this.http.post<SpellCheckResult>(`${this.apiUrl}/spellcheck`, { text, language });
  }

  // Admin endpoints
  getPendingCatalogues(status?: WordfinderCatalogueStatus | null): Observable<WordfinderCatalogueListDto[]> {
    let url = `${this.apiUrl}/pending`;
    if (status !== undefined && status !== null) {
      url += `?status=${status}`;
    }
    return this.http.get<WordfinderCatalogueListDto[]>(url);
  }

  approveCatalogue(id: number, modifiedEntries?: WordfinderCatalogueEntryDto[]): Observable<WordfinderCatalogueDto> {
    return this.http.post<WordfinderCatalogueDto>(`${this.apiUrl}/${id}/approve`, { modifiedEntries });
  }

  rejectCatalogue(id: number, rejectionReason: string): Observable<WordfinderCatalogueDto> {
    return this.http.post<WordfinderCatalogueDto>(`${this.apiUrl}/${id}/reject`, { rejectionReason });
  }
}
