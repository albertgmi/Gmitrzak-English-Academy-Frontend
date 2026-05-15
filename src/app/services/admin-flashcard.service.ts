import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

export interface AdminStudentStudySummaryDto {
  username: string;
  totalTimeSpentSeconds: number | null;
  totalFlashcardsDone: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminFlashcardService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/learning';

  private _summaries = signal<AdminStudentStudySummaryDto[] | null>(null);
  private _isLoading = signal<boolean>(false);

  summaries = this._summaries.asReadonly();
  isLoading = this._isLoading.asReadonly();

  loadStudyLogsSummary(): void {
    this._isLoading.set(true);
    this.http.get<AdminStudentStudySummaryDto[]>(this.apiUrl)
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (data) => this._summaries.set(data),
        error: (err) => {
          console.error('Failed to load study logs summary:', err);
          this._summaries.set([]);
        }
      });
  }
}