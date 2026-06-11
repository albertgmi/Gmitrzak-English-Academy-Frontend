import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface RankingEntryDto {
    userId: number;
    username: string;
    avatarUrl?: string;
    position: number;
    activityPoints: number;
    averageGrade: number;
    flashcardsDone: number;
    score: number;
    title: string;
    positionChange: number;
    reactions: Record<string, number>;
}

export interface RankingDto {
    period: string;
    entries: RankingEntryDto[];
    currentUserPosition: number;
    pointsToNextPosition: number;
    currentUserOnPodium: boolean;
}

@Injectable({ providedIn: 'root' })
export class RankingService {
    private apiUrl = `${environment.apiUrl}/api/ranking`;
    http = inject(HttpClient);

    getRanking(period: 'weekly' | 'monthly' | 'alltime') {
        return this.http.get<RankingDto>(`${this.apiUrl}/${period}`);
    }

    addReaction(toUserId: number, emoji: string, period: string) {
        return this.http.post(`${this.apiUrl}/reaction`, { toUserId, emoji, period });
    }

    removeReaction(toUserId: number, emoji: string, period: string) {
        return this.http.delete(
            `${this.apiUrl}/reaction?toUserId=${toUserId}&emoji=${encodeURIComponent(emoji)}&period=${period}`
        );
    }
}