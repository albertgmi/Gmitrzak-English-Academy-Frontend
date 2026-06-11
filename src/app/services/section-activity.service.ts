import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SectionActivityService {
    private apiUrl = `${environment.apiUrl}/api/activity`;
    private http = inject(HttpClient);

    logActivity(section: 'memories' | 'pronunciation' | 'sentences' | 'flashcards') {
        return this.http.post(`${this.apiUrl}/log`, { section });
    }
}