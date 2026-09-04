import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type ExamLevel = 'Junior' | 'Senior';
export type ExamSignupStatus = 'Registered' | 'Passed' | 'Failed' | 'Cancelled';

export interface ExamTakerDto {
    userId: number;
    username: string;
    avatarUrl?: string;
    signedUpAt: string;
    status: ExamSignupStatus;
}

export interface AcademyExamDto {
    id: number;
    title: string;
    description: string;
    level: ExamLevel;
    materialsUrl?: string;
    rewardCredits: number;
    passingThreshold: string;
    signupDeadline: string;
    isActive: boolean;
    createdAt: string;
    isCurrentUserSignedUp: boolean;
    currentUserStatus?: ExamSignupStatus;
    canSignUp: boolean;
    canUnsign: boolean;
    takersCount: number;
    takers: ExamTakerDto[];
}

export interface CreateAcademyExamDto {
    title: string;
    description: string;
    level: ExamLevel;
    materialsUrl?: string;
    rewardCredits: number;
    passingThreshold: string;
    signupDeadline: string;
    isActive: boolean;
}

export interface UpdateAcademyExamDto extends CreateAcademyExamDto {}

@Injectable({ providedIn: 'root' })
export class AcademyExamService {
    private http = inject(HttpClient);
    private api = `${environment.apiUrl}/api/academy-exams`;

    getExams(level: ExamLevel = 'Junior') {
        const params = new HttpParams().set('level', level);
        return this.http.get<AcademyExamDto[]>(this.api, { params });
    }

    getExamById(id: number) {
        return this.http.get<AcademyExamDto>(`${this.api}/${id}`);
    }

    signUp(id: number) {
        return this.http.post<{ message: string }>(`${this.api}/${id}/signup`, {});
    }

    unsign(id: number) {
        return this.http.delete<{ message: string }>(`${this.api}/${id}/signup`);
    }

    createExam(dto: CreateAcademyExamDto) {
        return this.http.post<{ id: number }>(this.api, dto);
    }

    updateExam(id: number, dto: UpdateAcademyExamDto) {
        return this.http.put<{ message: string }>(`${this.api}/${id}`, dto);
    }

    deleteExam(id: number) {
        return this.http.delete<{ message: string }>(`${this.api}/${id}`);
    }

    markTakerStatus(id: number, userId: number, status: ExamSignupStatus) {
        return this.http.post<{ message: string }>(`${this.api}/${id}/takers/${userId}/status`, { status });
    }
}
