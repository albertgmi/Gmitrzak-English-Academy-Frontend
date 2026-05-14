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

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private apiUrl = '/api/student-learning/flashcards'; // Zakładam wydzielony endpoint
  http = inject(HttpClient);

  flashcards = resource<FlashcardDto[], unknown>({
    loader: () => lastValueFrom(this.http.get<FlashcardDto[]>(this.apiUrl))
  });

  getLeeches() {
    return this.http.get<FlashcardDto[]>(`${this.apiUrl}/leeches`);
  }

  getStudiedToday() {
    return this.http.get<FlashcardDto[]>(`${this.apiUrl}/studied-today`);
  }

  getStudyLogs() {
    return this.http.get<FlashcardStudyLogDto[]>(`${this.apiUrl}/logs`);
  }

  searchFlashcards(query: string) {
    return this.http.get<FlashcardDto[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  // Nowa metoda do wysyłania wyniku powtórki na backend
  reviewCard(id: number, quality: 'incorrect' | 'hard' | 'easy') {
    return this.http.patch(`${this.apiUrl}/${id}/review`, { quality });
  }
}