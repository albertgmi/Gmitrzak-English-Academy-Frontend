import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface StreamEntryListDto {
    id: number;
    userId: number;
    username: string;
    command: string;
    payload: string;
    executedAt: string;
}

@Injectable({ providedIn: 'root' })
export class StreamService {
    private apiUrl = '/api/stream';
    http = inject(HttpClient);

    entries = resource<StreamEntryListDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<StreamEntryListDto[]>(this.apiUrl))
    });

    reloadEntries() {
        this.entries.reload();
    }

    getByUser(userId: number) {
        return this.http.get<StreamEntryListDto[]>(`${this.apiUrl}?userId=${userId}`);
    }

    create(userId: number, command: string, payload: string) {
        return this.http.post(this.apiUrl, { userId, command, payload });
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    deleteMultiple(ids: number[]) {
        return this.http.delete(this.apiUrl, { body: { ids } });
    }
}