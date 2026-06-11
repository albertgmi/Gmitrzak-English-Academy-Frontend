import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface TheaterItemDto {
    id: number;
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    mediaType: string;
    durationMinutes: number;
    level: string;
    isActive: boolean;
}

export interface RepertoireItemDto {
    id: number;
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    mediaType: string;
    durationMinutes: number;
    level: string;
    timesReported: number;
    lastReportedDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TheaterService {
    private apiUrl = '/api/theater';
    http = inject(HttpClient);

    items = resource<TheaterItemDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<TheaterItemDto[]>(this.apiUrl))
    });

    reloadItems() {
        this.items.reload();
    }

    getRepertoire() {
        return this.http.get<RepertoireItemDto[]>(`${this.apiUrl}/repertoire`);
    }

    create(request: Partial<TheaterItemDto>) {
        return this.http.post<TheaterItemDto>(this.apiUrl, request);
    }

    update(id: number, request: Partial<TheaterItemDto>) {
        return this.http.put(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    toggleActive(id: number) {
        return this.http.patch(`${this.apiUrl}/${id}/toggle`, {});
    }
}