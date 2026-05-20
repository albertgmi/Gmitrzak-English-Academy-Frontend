import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UserOptionsDto {
    userId: number;
    username: string;
    leechThreshold: number;
    minDailyFlashcards: number;
    emailNotifications: boolean;
    incorrectStepOneMinutes: number;
    incorrectStepTwoMinutes: number;
    incorrectStepThreeMinutes: number;
    incorrectStepFourMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class OptionsService {
    private apiUrl = '/api/options';
    http = inject(HttpClient);

    getAll() {
        return this.http.get<UserOptionsDto[]>(this.apiUrl);
    }

    getByUser(userId: number) {
        return this.http.get<UserOptionsDto>(`${this.apiUrl}/${userId}`);
    }

    update(userId: number, opts: Partial<UserOptionsDto>) {
        return this.http.put(`${this.apiUrl}/${userId}`, opts);
    }
}