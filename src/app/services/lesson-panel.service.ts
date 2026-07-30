import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AgendaDto {
    id: number;
    activityPointTarget: number;
    flashcardTarget: number;
    listeningEpisodeTarget: number;
    notes: string;
}

export interface ActivityPointLessonDto {
    id: number;
    pointDate: string;
    points: number;
    reason: string;
}

export interface ActivityPointsLessonSummaryDto {
    totalAllTime: number;
    totalThisWeek: number;
    totalLastWeek: number;
    history: ActivityPointLessonDto[];
}

export interface LessonFlashcardDto {
    id: number;
    front: string;
    back: string;
    category: string;
    interval: number;
    isLeech: boolean;
    nextReviewDate: string;
}

export interface LessonStudyLogDto {
    studyDate: string;
    easyCount: number;
    hardCount: number;
    incorrectCount: number;
    timeSpentSeconds: number;
}

export interface LessonFlashcardSummaryDto {
    totalCards: number;
    leechCount: number;
    studiedTodayCount: number;
    dueCount: number;
    leeches: LessonFlashcardDto[];
    studiedToday: LessonFlashcardDto[];
    recentLogs: LessonStudyLogDto[];
}

export interface StreamEntryDto {
    id: number;
    command: string;
    payload: string;
    executedAt: string;
}

export interface DailyStudyTimeDto {
    studyDate: string;
    timeSpentSeconds: number;
    flashcardsDone: number;
    easyCount: number;
    hardCount: number;
    incorrectCount: number;
}

export interface StudentStudyTimeDto {
    totalTimeSpentSeconds: number;
    totalFlashcardsDone: number;
    easyCount: number;
    hardCount: number;
    incorrectCount: number;
    dailyBreakdown: DailyStudyTimeDto[];
}

export interface LessonGradeDto {
    id: number;
    gradeDate: string;
    percentage: number;
    category: string;
    notes?: string;
}

export interface LessonLastWeekDto {
    weekStart: string;
    weekEnd: string;
    totalActivityPoints: number;
    flashcardsStudied: number;
    flashcardTimeSeconds: number;
    listeningEpisodesWatched: number;
    gradesThisWeek: LessonGradeDto[];
    rankingCriteriaMet: boolean;
    activityPointTarget: number;
    flashcardTarget: number;
    listeningEpisodeTarget: number;
}

export interface LessonStatsDto {
    dailyActivity: { date: string; points: number }[];
    dailyFlashcards: { date: string; cardsStudied: number; timeSpentSeconds: number }[];
    gradeHistory: LessonGradeDto[];
    categoryBreakdown: {
        avgVocabulary: number;
        avgSentences: number;
        avgMemories: number;
        avgPronunciation: number;
    };
}

@Injectable({ providedIn: 'root' })
export class LessonPanelService {
    private apiUrl = `${environment.apiUrl}/api/lesson-panel`;
    http = inject(HttpClient);

    getAgenda(studentUserId: number) {
        return this.http.get<AgendaDto>(`${this.apiUrl}/agenda/${studentUserId}`);
    }

    updateAgenda(studentUserId: number, data: Partial<AgendaDto>) {
        return this.http.put(`${this.apiUrl}/agenda/${studentUserId}`, data);
    }

    getGrades(studentUserId: number) {
        return this.http.get<LessonGradeDto[]>(`${this.apiUrl}/grades/${studentUserId}`);
    }

    getActivityPoints(studentUserId: number) {
        return this.http.get<ActivityPointsLessonSummaryDto>(`${this.apiUrl}/activity-points/${studentUserId}`);
    }

    addActivityPoints(studentUserId: number, points: number, reason: string) {
        return this.http.post(`${this.apiUrl}/activity-points/${studentUserId}`, { points, reason });
    }

    getFlashcards(studentUserId: number) {
        return this.http.get<LessonFlashcardSummaryDto>(`${this.apiUrl}/flashcards/${studentUserId}`);
    }

    getAllFlashcards(studentUserId: number) {
        return this.http.get<LessonFlashcardDto[]>(`${this.apiUrl}/flashcards/all/${studentUserId}`);
    }

    getStudyTime(studentUserId: number) {
        return this.http.get<StudentStudyTimeDto>(`${this.apiUrl}/study-time/${studentUserId}`);
    }

    getLastWeek(studentUserId: number) {
        return this.http.get<LessonLastWeekDto>(`${this.apiUrl}/last-week/${studentUserId}`);
    }

    getStats(studentUserId: number) {
        return this.http.get<LessonStatsDto>(`${this.apiUrl}/stats/${studentUserId}`);
    }

    updateInterval(studentUserId: number, flashcardId: number, interval: number) {
        return this.http.put(`${this.apiUrl}/flashcards/${studentUserId}/${flashcardId}/interval`, interval);
    }

    exportFlashcardsPdf(studentUserId: number) {
        return this.http.get(`${this.apiUrl}/flashcards/${studentUserId}/pdf`, {
            responseType: 'blob'
        });
    }

    exportFlashcardsExcel(studentUserId: number) {
        return this.http.get(`${this.apiUrl}/flashcards/${studentUserId}/excel`, {
            responseType: 'blob'
        });
    }
}