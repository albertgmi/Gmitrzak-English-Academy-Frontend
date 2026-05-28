import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AdminDashboardDto {
    totalStudents: number;
    activeStudentsThisWeek: number;
    totalFlashcards: number;
    totalAssignmentsPending: number;
    recentGrades: RecentGradeDto[];
    upcomingAssignments: UpcomingAssignmentDto[];
    topStudentsByPoints: StudentPointsDto[];
}

export interface StudentDashboardDto {
    username: string;
    totalActivityPoints: number;
    flashcardsDueToday: number;
    flashcardsStudiedToday: number;
    activeAssignments: UpcomingAssignmentDto[];
    upcomingModules: UpcomingModuleDto[];
    lastWeekCriteriaMet: boolean;
    currentStreak: number;
}

export interface RecentGradeDto {
    username: string;
    category: string;
    percentage: number;
    gradeDate: string;
    avatarUrl?: string | null;
}

export interface UpcomingAssignmentDto {
    id: number;
    moduleName: string;
    dueDate: string;
    isOverdue: boolean;
}

export interface StudentPointsDto {
    username: string;
    totalPoints: number;
    thisWeek: number;
}

export interface UpcomingModuleDto {
    moduleName: string;
    matrixName: string;
    unlockDate: string;
    isUnlocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private apiUrl = '/api/dashboard';
    http = inject(HttpClient);

    getAdminDashboard() {
        return this.http.get<AdminDashboardDto>(`${this.apiUrl}/admin`);
    }

    getStudentDashboard() {
        return this.http.get<StudentDashboardDto>(`${this.apiUrl}/student`);
    }
}