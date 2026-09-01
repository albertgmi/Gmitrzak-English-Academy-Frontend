import { Injectable, signal, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface LiveNoteCollaborativeUser {
    connectionId: string;
    username: string;
    role: string;
    avatarUrl?: string;
    joinedAt: string;
}

export interface LiveNoteContentChangeEvent {
    noteId: number;
    content: string;
    senderUsername: string;
    timestamp: string;
}

export interface LiveNoteSelectionEvent {
    noteId: number;
    index: number;
    length: number;
    username: string;
    role: string;
}

export interface LiveNoteTypingEvent {
    noteId: number;
    isTyping: boolean;
    senderUsername: string;
}

@Injectable({
    providedIn: 'root'
})
export class LiveNotepadCollaborationService {
    private authService = inject(AuthService);
    private hubConnection: signalR.HubConnection | null = null;

    activeUsers = signal<LiveNoteCollaborativeUser[]>([]);
    contentChange = signal<LiveNoteContentChangeEvent | null>(null);
    selectionChange = signal<LiveNoteSelectionEvent | null>(null);
    typingUser = signal<LiveNoteTypingEvent | null>(null);
    isConnected = signal<boolean>(false);

    startConnection(noteId: number, username: string, role: string, avatarUrl?: string): void {
        const token = this.authService.getToken();
        if (!token) return;

        const hubUrl = `${environment.apiUrl.replace('/api', '')}/hubs/live-notepad`;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.registerHandlers();

        this.hubConnection
            .start()
            .then(() => {
                this.isConnected.set(true);
                this.joinRoom(noteId, username, role, avatarUrl);
            })
            .catch(err => {
                console.error('Error starting SignalR LiveNotepadHub:', err);
                this.isConnected.set(false);
            });
    }

    private registerHandlers(): void {
        if (!this.hubConnection) return;

        this.hubConnection.on('ActiveUsersList', (users: LiveNoteCollaborativeUser[]) => {
            this.activeUsers.set(users);
        });

        this.hubConnection.on('UserJoined', (user: LiveNoteCollaborativeUser) => {
            this.activeUsers.update(list => {
                if (list.some(u => u.connectionId === user.connectionId)) return list;
                return [...list, user];
            });
        });

        this.hubConnection.on('UserLeft', (connectionId: string) => {
            this.activeUsers.update(list => list.filter(u => u.connectionId !== connectionId));
        });

        this.hubConnection.on('ContentChanged', (data: LiveNoteContentChangeEvent) => {
            this.contentChange.set(data);
        });

        this.hubConnection.on('SelectionChanged', (data: LiveNoteSelectionEvent) => {
            this.selectionChange.set(data);
        });

        this.hubConnection.on('UserTyping', (data: LiveNoteTypingEvent) => {
            this.typingUser.set(data);
        });
    }

    joinRoom(noteId: number, username: string, role: string, avatarUrl?: string): void {
        if (this.hubConnection && this.isConnected()) {
            this.hubConnection.invoke('JoinNoteRoom', noteId, username, role, avatarUrl || null);
        }
    }

    sendContentChange(noteId: number, content: string, senderUsername: string): void {
        if (this.hubConnection && this.isConnected()) {
            this.hubConnection.invoke('SendContentChange', noteId, content, senderUsername);
        }
    }

    sendSelectionChange(noteId: number, index: number, length: number, senderUsername: string, role: string): void {
        if (this.hubConnection && this.isConnected()) {
            this.hubConnection.invoke('SendSelectionChange', noteId, index, length, senderUsername, role);
        }
    }

    sendTypingStatus(noteId: number, isTyping: boolean, senderUsername: string): void {
        if (this.hubConnection && this.isConnected()) {
            this.hubConnection.invoke('SendTypingStatus', noteId, isTyping, senderUsername);
        }
    }

    stopConnection(): void {
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = null;
            this.isConnected.set(false);
            this.activeUsers.set([]);
            this.contentChange.set(null);
            this.selectionChange.set(null);
            this.typingUser.set(null);
        }
    }
}
