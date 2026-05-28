import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SectionActivityService {
    private http = inject(HttpClient);

    logActivity(section: 'memories' | 'pronunciation' | 'sentences' | 'flashcards') {
        return this.http.post('/api/activity/log', { section });
    }
}