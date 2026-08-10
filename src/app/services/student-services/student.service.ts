import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StudentModuleDto {
    id: number;
    moduleId: number;
    name: string;
    description: string;
    category: string;
    order: number;
    weekNumber: number;
    dayOfWeek: number;
    unlockDate: string;
    deadline: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    isOverdue: boolean;
    url?: string;
    activityDaysCount: number;
    activityDaysRequired: number;
    canComplete: boolean;
    completionBlockReason?: string;
    presentationUrl?: string;
    presentationText?: string;
}

export interface StudentAssignmentDto {
    matrixId: number;
    matrixName: string;
    startDate: string;
    refreshIntervalDays: number;
    modules: StudentModuleDto[];
}

export interface LastWeekDto {
    weekStart: string;
    weekEnd: string;
    totalActivityPoints: number;
    flashcardsStudied: number;
    flashcardTimeSeconds: number;
    listeningEpisodesWatched: number;
    gradesThisWeek: GradeDto[];
    rankingCriteriaMet: boolean;
}

export interface ActivityPointDto {
    id: number;
    pointDate: string;
    points: number;
    reason: string;
}

export interface ActivityPointsHistoryDto {
    totalAllTime: number;
    totalThisWeek: number;
    totalLastWeek: number;
    history: ActivityPointDto[];
}

export interface GradeDto {
    id: number;
    gradeDate: string;
    percentage: number;
    category: string;
    notes: string;
}

export interface DailyActivityDto {
    date: string;
    points: number;
}

export interface DailyFlashcardsDto {
    date: string;
    cardsStudied: number;
    timeSpentSeconds: number;
}

export interface CategoryBreakdownDto {
    avgVocabulary: number;
    avgSentences: number;
    avgMemories: number;
    avgPronunciation: number;
}

export interface StatsDto {
    dailyActivity: DailyActivityDto[];
    dailyFlashcards: DailyFlashcardsDto[];
    gradeHistory: GradeDto[];
    categoryBreakdown: CategoryBreakdownDto;
}

export interface PointEntry {
    id: number;
    pointDate: string;
    points: number;
    reason: string;
}

export interface WeeklyMovieItemDto {
    rank: number;
    title: string;
    totalWatchedCount: number;
    uniqueViewersCount: number;
}

export interface TopWatcherDto {
    rank: number;
    userId: number;
    username: string;
    avatarUrl?: string | null;
    totalWatchedCount: number;
}

export interface WeeklyMoviesResponseDto {
    weekStartDate: string;
    weekEndDate: string;
    totalEpisodesWatched: number;
    topMovies: WeeklyMovieItemDto[];
    topWatchers: TopWatcherDto[];
}

@Injectable({ providedIn: 'root' })
export class StudentService {
    private apiUrl = `${environment.apiUrl}/api/student`;
    private studentLearningApiUrl = `${environment.apiUrl}/api/student-learning`;
    http = inject(HttpClient);

    getWeeklyMoviesStats(timeframe: 'week' | 'all' = 'week') {
        return this.http.get<WeeklyMoviesResponseDto>(`${this.studentLearningApiUrl}/weekly-movies?timeframe=${timeframe}`);
    }

    courses = resource<StudentAssignmentDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<StudentAssignmentDto[]>(`${this.apiUrl}/courses`))
    });

    singleModules = resource<StudentModuleDto[], unknown>({
        loader: () =>
            lastValueFrom(
                this.http.get<StudentModuleDto[]>(`${this.apiUrl}/single-modules`)
            )
    });

    reloadCourses() {
        this.courses.reload();
    }

    completeModule(matrixModuleId: number) {
        return this.http.post(`${this.apiUrl}/complete/${matrixModuleId}`, {});
    }

    uncompleteModule(matrixModuleId: number) {
        return this.http.delete(`${this.apiUrl}/complete/${matrixModuleId}`);
    }

    getLastWeek() {
        return this.http.get<LastWeekDto>(`${this.apiUrl}/last-week`);
    }

    getActivityPoints() {
        return this.http.get<ActivityPointsHistoryDto>(`${this.apiUrl}/activity-points`);
    }

    getGrades() {
        return this.http.get<GradeDto[]>(`${this.apiUrl}/grades`);
    }

    getStats() {
        return this.http.get<StatsDto>(`${this.apiUrl}/stats`);
    }

    reloadSingleModules() {
        this.singleModules.reload();
    }

    completeSingleModule(id: number) {
        return this.http.post(`${this.apiUrl}/single-modules/complete/${id}`, {});
    }
    
    uncompleteSingleModule(id: number) {
        return this.http.delete(`${this.apiUrl}/single-modules/complete/${id}`);
    }
    
    getCompletedSingleModules() {
        return this.http.get<StudentModuleDto[]>(`${this.apiUrl}/completed-single-modules`);
    }

    getStudentModule(moduleId: number) {
        return this.http.get<StudentModuleDto>(`${this.apiUrl}/module/${moduleId}`);
    }

    completeStudentModule(moduleId: number) {
        return this.http.post(`${this.apiUrl}/module/${moduleId}/complete`, {});
    }

    getStudentMatrixModule(matrixModuleId: number) {
        return this.http.get<StudentModuleDto>(`${this.apiUrl}/matrix-module/${matrixModuleId}`);
    }
    
    getSingleModuleById(id: number) {
        return this.http.get<StudentModuleDto>(`${this.apiUrl}/single-modules/${id}`);
    }
}