import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FlashcardInactiveUser {
  id: number;
  username: string;
  email: string;
  lastActiveAt?: string | null;
  lastFlashcardStudyDate?: string | null;
  daysInactive: number;
  isInactiveForThreeDays: boolean;
}

export interface SendRemindersResult {
  sentCount: number;
  failedCount: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailReminderService {
  private apiUrl = `${environment.apiUrl}/api/email-reminder`;
  private http = inject(HttpClient);

  getStudentsForReminder(): Observable<FlashcardInactiveUser[]> {
    return this.http.get<FlashcardInactiveUser[]>(`${this.apiUrl}/students`);
  }

  sendFlashcardReminders(userIds: number[], customSubject?: string, customBody?: string): Observable<SendRemindersResult> {
    return this.http.post<SendRemindersResult>(`${this.apiUrl}/send-flashcard-reminders`, {
      userIds,
      customSubject,
      customBody
    });
  }
}
