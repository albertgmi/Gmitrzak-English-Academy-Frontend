import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AnnouncementDto {
    id: number;
    title: string;
    content: string;
    senderUsername: string;
    createdAt: string;
    totalRecipients: number;
    readCount: number;
}

export interface AnnouncementInboxDto {
    id: number;
    announcementId: number;
    title: string;
    content: string;
    senderUsername: string;
    createdAt: string;
    isRead: boolean;
    readAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
    private apiUrl = '/api/announcement';
    http = inject(HttpClient);

    unreadCount = signal(0);

    refreshUnreadCount() {
        this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe({
            next: (d) => this.unreadCount.set(d.count)
        });
    }

    getAll() {
        return this.http.get<AnnouncementDto[]>(this.apiUrl);
    }

    getInbox() {
        return this.http.get<AnnouncementInboxDto[]>(`${this.apiUrl}/inbox`);
    }

    create(title: string, content: string, recipientUserIds?: number[]) {
        return this.http.post(this.apiUrl, { title, content, recipientUserIds });
    }

    markRead(recipientId: number) {
        return this.http.patch(`${this.apiUrl}/${recipientId}/read`, {});
    }

    markAllRead() {
        return this.http.patch(`${this.apiUrl}/read-all`, {});
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}