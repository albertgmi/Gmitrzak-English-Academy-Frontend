import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
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

  allIrregularVerbsResource = resource<IrregularVerbDto[], unknown>({
    loader: () => lastValueFrom(this.http.get<IrregularVerbDto[]>(`${this.apiUrl}/all`))
  });

  getIrregularVerbs(level: IrregularVerbLevel): Observable<IrregularVerbDto[]> {
    return this.http.get<IrregularVerbDto[]>(`${this.apiUrl}?level=${level}`);
  }

  getAll(): Observable<IrregularVerbDto[]> {
    return this.http.get<IrregularVerbDto[]>(`${this.apiUrl}/all`);
  }

  getLeeches(): Observable<IrregularVerbDto[]> {
    return this.http.get<IrregularVerbDto[]>(`${this.apiUrl}/leeches`);
  }

  getStudiedToday(): Observable<IrregularVerbDto[]> {
    return this.http.get<IrregularVerbDto[]>(`${this.apiUrl}/studied-today`);
  }

  search(query: string): Observable<IrregularVerbDto[]> {
    return this.http.get<IrregularVerbDto[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  reviewVerb(id: number, quality: 'incorrect' | 'again_1m' | 'hard' | 'easy', timeSpentSeconds: number): Observable<void> {
    const body: ReviewIrregularVerbRequest = {
      quality,
      timeSpentSeconds
    };
    return this.http.patch<void>(`${this.apiUrl}/${id}/review`, body);
  }
}
