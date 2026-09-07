import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type IrregularVerbLevel = 'Basic' | 'Advanced';

export interface IrregularVerbDto {
  id: number;
  polishTranslation: string;
  englishForms: string;
  level: IrregularVerbLevel;
  easeFactor: number;
  interval: number;
  isLeech: boolean;
  nextReviewDate: string;
}

export interface ReviewIrregularVerbRequest {
  quality: 'incorrect' | 'again_1m' | 'hard' | 'easy';
  timeSpentSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class IrregularVerbsService {
  private apiUrl = `${environment.apiUrl}/api/student-learning/irregular-verbs`;
  private http = inject(HttpClient);

  getIrregularVerbs(level: IrregularVerbLevel): Observable<IrregularVerbDto[]> {
    return this.http.get<IrregularVerbDto[]>(`${this.apiUrl}?level=${level}`);
  }

  reviewVerb(id: number, quality: 'incorrect' | 'again_1m' | 'hard' | 'easy', timeSpentSeconds: number): Observable<void> {
    const body: ReviewIrregularVerbRequest = {
      quality,
      timeSpentSeconds
    };
    return this.http.patch<void>(`${this.apiUrl}/${id}/review`, body);
  }
}
