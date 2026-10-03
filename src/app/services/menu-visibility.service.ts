import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConfigurableMenuItem {
  key: string;
  label: string;
  icon: string;
  category: string;
}

export const ALL_STUDENT_MENU_ITEMS: ConfigurableMenuItem[] = [
  // Home
  { key: '/', label: 'Dashboard', icon: 'pi pi-home', category: 'Home' },
  { key: '/ranking', label: 'Ranking', icon: 'pi pi-trophy', category: 'Home' },
  
  // Learning
  { key: '/flashcards/study', label: 'Flashcard Session', icon: 'pi pi-bolt', category: 'Learning' },
  { key: '/flashcards', label: 'Flashcard List', icon: 'pi pi-list', category: 'Learning' },
  { key: '/irregular-verbs/study', label: 'Irregular Verbs Session', icon: 'pi pi-bolt', category: 'Learning' },
  { key: '/irregular-verbs', label: 'Irregular Verbs', icon: 'pi pi-list-check', category: 'Learning' },
  { key: '/sentences-cards', label: 'Sentences Session', icon: 'pi pi-bolt', category: 'Learning' },
  { key: '/sentences', label: 'Sentences', icon: 'pi pi-align-left', category: 'Learning' },
  { key: '/memories', label: 'Memories', icon: 'pi pi-lightbulb', category: 'Learning' },
  { key: '/pronunciation', label: 'Pronunciation', icon: 'pi pi-microphone', category: 'Learning' },
  { key: '/wordfinder', label: 'Wordfinder', icon: 'pi pi-compass', category: 'Learning' },
  { key: '/alphabet-test', label: 'Alphabet Test', icon: 'pi pi-language', category: 'Learning' },
  { key: '/assignments', label: 'Homework', icon: 'pi pi-file', category: 'Learning' },
  { key: '/exams', label: 'Exams', icon: 'pi pi-graduation-cap', category: 'Learning' },
  { key: '/my-essays', label: 'My Essays', icon: 'pi pi-file-edit', category: 'Learning' },
  { key: '/weekly-movies', label: 'Movie Theater', icon: 'pi pi-video', category: 'Learning' },
  
  // Live Hub
  { key: '/live-essay-room', label: 'Live Essay Room', icon: 'pi pi-comments', category: 'Live Hub' },
  { key: '/live-sentence-room', label: 'Live Sentence Room', icon: 'pi pi-sync', category: 'Live Hub' },
  { key: '/live-notepad', label: 'Live Notepad', icon: 'pi pi-file-edit', category: 'Live Hub' },
  
  // Progress
  { key: '/last-week', label: 'Last Week', icon: 'pi pi-calendar-times', category: 'Progress' },
  { key: '/activity-points', label: 'Activity Points', icon: 'pi pi-chart-line', category: 'Progress' },
  { key: '/grades', label: 'Grades', icon: 'pi pi-star', category: 'Progress' },
  { key: '/stats', label: 'Stats', icon: 'pi pi-chart-bar', category: 'Progress' },
  { key: '/credits', label: 'Credits & Shop', icon: 'pi pi-star', category: 'Progress' },
  
  // Courses
  { key: '/courses', label: 'My Courses', icon: 'pi pi-bookmark', category: 'Courses' }
];

@Injectable({
  providedIn: 'root'
})
export class MenuVisibilityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/user-menu-visibility`;

  getAvailableMenuItems(): ConfigurableMenuItem[] {
    return [...ALL_STUDENT_MENU_ITEMS];
  }

  getHiddenKeysForUser(userId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${userId}`);
  }

  updateUserMenuVisibility(userId: number, hiddenMenuItemKeys: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}`, {
      hiddenMenuItemKeys
    });
  }

  getMyHiddenKeys(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/my`);
  }
}
