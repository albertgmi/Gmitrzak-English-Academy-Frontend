import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  flashcardFront: string;
  easyCount: number;
  hardCount: number;
  incorrectCount: number;
  timeSpentSeconds: number;
}
export interface ReviewCardRequest {
  quality: 'incorrect' | 'hard' | 'easy';
  timeSpentSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private apiUrl = `${environment.apiUrl}/api/student-learning/flashcards`;
  private http = inject(HttpClient);

  flashcards = resource<FlashcardDto[], unknown>({
    loader: () => lastValueFrom(this.http.get<FlashcardDto[]>(this.apiUrl))
  });

  getLeeches(): Observable<FlashcardDto[]> {
    return this.http.get<FlashcardDto[]>(`${this.apiUrl}/leeches`);
  }

  getStudiedToday(): Observable<FlashcardDto[]> {
    return this.http.get<FlashcardDto[]>(`${this.apiUrl}/studied-today`);
  }

  getStudyLogs(): Observable<FlashcardStudyLogDto[]> {
    return this.http.get<FlashcardStudyLogDto[]>(`${this.apiUrl}/logs`);
  }

  searchFlashcards(query: string): Observable<FlashcardDto[]> {
    return this.http.get<FlashcardDto[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  reviewCard(id: number, quality: 'incorrect' | 'hard' | 'easy', timeSpentSeconds: number): Observable<void> {
    const body: ReviewCardRequest = {
      quality,
      timeSpentSeconds
    };
    return this.http.patch<void>(`${this.apiUrl}/${id}/review`, body);
  }
}