import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AnnouncementDto {
    id: number;
    title: string;
    content: string;
    senderUsername: string;
    createdAt: string;
    totalRecipients: number;
    readCount: number;
    type: 'Announcement' | 'Listing' | 'Voting';
    signUpCount: number;
    voteYesCount: number;
    voteNoCount: number;
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
    type: 'Announcement' | 'Listing' | 'Voting';
    signedUp?: boolean;
    vote?: boolean;
    senderAvatarUrl?: string | null;
}

export interface AnnouncementRecipientDetailsDto {
  userId: number;
  username: string;
  email: string;
  isRead: boolean;
  readAt: string | null;
  signedUp: boolean | null;
  vote: boolean | null;
  avatarUrl: string | null;
}

export interface AnnouncementDetailsDto {
  announcementId: number;
  title: string;
  type: string;
  recipients: AnnouncementRecipientDetailsDto[];
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
    private apiUrl = `${environment.apiUrl}/api/announcement`;
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

    create(title: string, content: string, type: string, recipientUserIds?: number[]) {
        return this.http.post(this.apiUrl, { title, content, type, recipientUserIds });
    }

    markRead(recipientId: number) {
        return this.http.patch(`${this.apiUrl}/${recipientId}/read`, {});
    }

    signUp(recipientId: number) {
        return this.http.patch(`${this.apiUrl}/${recipientId}/signup`, {});
    }

    vote(recipientId: number, value: boolean) {
        return this.http.patch(`${this.apiUrl}/${recipientId}/vote?value=${value}`, {});
    }

    getDetails(id: number) {
        return this.http.get<AnnouncementDetailsDto>(
            `${this.apiUrl}/${id}/details`
        );
    }

    markAllRead() {
        return this.http.patch(`${this.apiUrl}/read-all`, {});
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}